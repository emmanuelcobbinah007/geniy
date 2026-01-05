const prisma = require('../config/db');
const scraperService = require('./scraperService');
const genesisAgent = require('./ai/genesis');
const auditService = require('./auditService');
const notificationService = require('./notificationService');

class RadarService {

    /**
     * Scans a specific competitor for a workspace
     * @param {string} workspaceId 
     * @param {string} competitorName 
     */
    async scanCompetitor(workspaceId, competitorName) {
        console.log(`📡 RADAR: Scanning ${competitorName} for workspace ${workspaceId}...`);

        try {
            const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
            if (!workspace || !workspace.competitors) {
                // If we can't find the workspace, we can't really log error to it, but we should not crash.
                console.error(`Workspace ${workspaceId} not found during scan.`);
                return { status: "error", error: "Workspace not found" };
            }

            const competitors = workspace.competitors;
            const targetIndex = competitors.findIndex(c => c && c.name && c.name.toLowerCase() === competitorName.toLowerCase());

            if (targetIndex === -1) {
                throw new Error(`Competitor ${competitorName} not found in tracking list.`);
            }

            const target = competitors[targetIndex];

            // 0. LIVE STATUS UPDATE: Set to "scanning" immediately
            target.radarStatus = 'scanning';
            competitors[targetIndex] = target;
            await prisma.workspace.update({
                where: { id: workspaceId },
                data: { competitors: competitors }
            });

            // 1. Get URL (If missing, use AI/Search to find it - mocked for now or use Perplexity in future)
            let url = target.url || target.website;

            // AUTO-DISCOVERY: If no URL, ask Genesis/Perplexity
            if (!url) {
                console.log(`🔍 URL missing for ${competitorName}. Attempting auto-discovery...`);
                try {
                    const discoveryPrompt = `Find the official website homepage URL for the company "${competitorName}". 
                    
                    Return a JSON object with the field "url".
                    Example: { "url": "https://www.example.com" }
                    
                    DO NOT return just text. Return JSON.`;

                    const discoveredText = await genesisAgent.research(discoveryPrompt);

                    // 1. Try JSON Parse
                    try {
                        const jsonMatch = discoveredText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);
                            if (parsed.url) url = parsed.url;
                        }
                    } catch (e) { /* ignore */ }

                    // 2. Fallback: Regex Extraction
                    if (!url) {
                        // Match markdown bolding first: **example.com**
                        const boldMatch = discoveredText.match(/\*\*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\*\*/);
                        if (boldMatch) {
                            url = boldMatch[1];
                        } else {
                            // Match standard URLs
                            const urlMatch = discoveredText.match(/https?:\/\/[^\s\)]+|www\.[^\s\)]+/);
                            if (urlMatch) {
                                url = urlMatch[0];
                            }
                        }
                    }

                    // 3. Normalize
                    if (url) {
                        // Remove common markdown artifacts (bolding **, citations [1], etc)
                        url = url.replace(/\*\*/g, '');
                        url = url.replace(/\[.*?\]/g, '');

                        // Prepend https if missing
                        if (url.startsWith('www.')) url = 'https://' + url;

                        // Clean trailing punctuation
                        url = url.replace(/['";,.\)]+$/, '');

                        console.log(`✅ Discovered URL for ${competitorName}: ${url}`);

                        // Save it immediately so we don't have to look it up next time
                        target.url = url;
                    } else {
                        console.log(`❌ Could not discover URL for ${competitorName}. Result: ${discoveredText}`);
                        throw new Error("Could not find competitor website URL.");
                    }
                } catch (err) {
                    console.log(`⚠️ Auto-discovery failed for ${competitorName}. Skipping Radar.`);
                    return { status: "skipped", reason: "no_url_found" };
                }
            }


            // --- FINAL URL SANITIZATION & VALIDATION ---
            // Ensure that whether the URL came from DB or new discovery, it is clean.
            if (url) {
                // Remove markdown artifacts
                url = url.replace(/\*\*/g, '').replace(/\[.*?\]/g, '');
                // Clean trailing chars
                url = url.replace(/['";,.\)]+$/, '');
                // Ensure protocol
                if (!url.startsWith('http') && !url.startsWith('https')) {
                    url = 'https://' + url;
                }

                // Update the target object in memory so we verify against the clean URL
                console.log(`🧹 Sanitized URL for ${competitorName}: ${url}`);
            }

            if (!url || (!url.startsWith('http') && !url.startsWith('https'))) {
                console.log(`❌ Invalid URL for ${competitorName}: ${url}. Skipping scrape.`);
                return { status: "skipped", reason: "invalid_url" };
            }

            try {
                // 2. Scrape
                const scrapeResult = await scraperService.scrape(url);

                // 3. Compare Hash
                const oldHash = target.contentHash;
                const newHash = scrapeResult.hash;
                let changeDetected = false;
                let insight = null;

                if (oldHash && oldHash !== newHash) {
                    changeDetected = true;
                    console.log(`🚨 CHANGE DETECTED for ${competitorName}!`);

                    // AI-POWERED CHANGE ANALYSIS
                    insight = await this.analyzeChange(competitorName, scrapeResult.plainText, workspace);

                    // Determine alert severity based on insight
                    const severity = this.classifyAlert(insight);

                    // NOTIFICATION: Alert workspace with smart context
                    await notificationService.send(workspaceId, {
                        title: `${severity.emoji} ${competitorName} Update`,
                        message: insight.summary || `Changes detected on ${competitorName}'s website.`,
                        data: insight.keyPoints,
                        type: severity.type,
                        link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://geniy.aurorasoftwarelabs.io'}/dashboard/${workspaceId}/context`
                    });

                    // CONTEXT SELF-LEARNING: Auto-update workspace knowledge
                    if (insight.shouldLearn) {
                        await this.updateWorkspaceContext(workspaceId, competitorName, insight);
                    }

                } else if (!oldHash) {
                    console.log(`✨ First scan for ${competitorName}. Content baseline established.`);
                    changeDetected = true; // Technically a "change" from null
                    insight = { summary: "Initial baseline established.", keyPoints: [], severity: 'low' };
                } else {
                    console.log(`✅ No change detected for ${competitorName}.`);
                }

                const updatedCompetitor = {
                    ...target,
                    url: url,
                    radarStatus: 'stable',
                    lastScrapedAt: new Date().toISOString(),
                    contentHash: newHash,
                    // Add to history log (keep last 15 entries)
                    radarHistory: [
                        { date: new Date().toISOString(), status: changeDetected ? "changed" : "stable", insight },
                        ...(target.radarHistory || [])
                    ].slice(0, 15)
                };

                competitors[targetIndex] = updatedCompetitor;

                await prisma.workspace.update({
                    where: { id: workspaceId },
                    data: { competitors: competitors }
                });

                // Log to audit if significant change
                if (changeDetected && insight?.summary !== "Initial baseline established.") {
                    await auditService.log({
                        workspaceId: workspaceId,
                        action: 'COMPETITOR_UPDATE',
                        metadata: {
                            competitorName: competitorName,
                            insight: insight?.summary || 'Content changed',
                            category: insight?.category || 'general',
                            url: url
                        }
                    });
                    console.log(`📢 Logged activity for ${competitorName}`);
                }

                return { status: changeDetected ? "changed" : "stable", insight, competitor: updatedCompetitor };

            } catch (error) {
                console.error(`Radar scan failed during scrape/update for ${competitorName}:`, error);

                // Try to log error to DB if possible (we have the index)
                const errorCompetitor = {
                    ...target,
                    lastScrapedAt: new Date().toISOString(),
                    radarStatus: "error",
                    radarHistory: [
                        { date: new Date().toISOString(), status: "error", error: error.message },
                        ...(target.radarHistory || [])
                    ].slice(0, 5)
                };
                competitors[targetIndex] = errorCompetitor;

                // Optimistically try to save the error state state
                try {
                    await prisma.workspace.update({
                        where: { id: workspaceId },
                        data: { competitors: competitors }
                    });
                } catch (dbErr) {
                    console.error("Critical: Could not save error state to DB", dbErr);
                }

                throw error;
            }

        } catch (initialError) {
            console.error(`Radar scan failed completely for ${competitorName}:`, initialError);
            return { status: "error", error: initialError.message };
        }
    }

    /**
     * AI-powered analysis of website changes
     * Returns structured insight with summary, key points, and learning recommendations
     */
    async analyzeChange(competitorName, newContent, workspace) {
        try {
            const businessContext = workspace.businessContext || '';
            const prompt = `Analyze website content changes for competitor "${competitorName}".

Business Context: ${businessContext}

New Website Content (excerpt):
${newContent.substring(0, 3000)}

Provide a brief, actionable analysis. Focus on:
1. What's new or changed (product launches, pricing, messaging, features)
2. Why it matters

Return JSON:
{
    "summary": "One sentence summary of the change",
    "keyPoints": ["Point 1", "Point 2"],
    "category": "product|pricing|messaging|feature|hiring|general",
    "impactLevel": "high|medium|low",
    "shouldLearn": true/false,
    "learnings": ["Facts to add to workspace knowledge"]
}`;

            const response = await genesisAgent.research(prompt);

            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                // Fallback to basic insight
            }

            return {
                summary: `Changes detected on ${competitorName}'s website`,
                keyPoints: [],
                category: 'general',
                impactLevel: 'medium',
                shouldLearn: false,
                learnings: []
            };

        } catch (error) {
            console.error('AI Change Analysis Error:', error);
            return {
                summary: `Website update detected for ${competitorName}`,
                keyPoints: [],
                category: 'general',
                impactLevel: 'low',
                shouldLearn: false,
                learnings: []
            };
        }
    }

    /**
     * Classify alert severity and emoji based on insight
     */
    classifyAlert(insight) {
        const level = insight?.impactLevel || 'medium';
        const category = insight?.category || 'general';

        // High impact categories
        if (level === 'high' || category === 'pricing' || category === 'product') {
            return { type: 'warning', emoji: '' };
        }

        // Medium impact
        if (level === 'medium' || category === 'feature' || category === 'messaging') {
            return { type: 'info', emoji: '' };
        }

        // Low impact
        return { type: 'success', emoji: '' };
    }

    /**
     * Auto-update workspace context with learnings from radar
     * This is the "self-learning" feature
     */
    async updateWorkspaceContext(workspaceId, competitorName, insight) {
        if (!insight.learnings || insight.learnings.length === 0) return;

        try {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { competitors: true, businessContext: true }
            });

            if (!workspace) return;

            // Find and update the competitor with new learnings
            const competitors = workspace.competitors || [];
            const targetIndex = competitors.findIndex(
                c => c && c.name && c.name.toLowerCase() === competitorName.toLowerCase()
            );

            if (targetIndex !== -1) {
                const competitor = competitors[targetIndex];

                // Add learnings to competitor's analysis
                const currentAnalysis = competitor.analysis || {};
                const existingLearnings = currentAnalysis.autoLearnings || [];

                competitors[targetIndex] = {
                    ...competitor,
                    analysis: {
                        ...currentAnalysis,
                        lastRadarLearning: new Date().toISOString(),
                        autoLearnings: [
                            ...insight.learnings.map(l => ({
                                text: l,
                                date: new Date().toISOString(),
                                source: 'radar'
                            })),
                            ...existingLearnings
                        ].slice(0, 20) // Keep last 20 learnings
                    }
                };

                await prisma.workspace.update({
                    where: { id: workspaceId },
                    data: { competitors }
                });

                console.log(`📚 Auto-learned ${insight.learnings.length} facts about ${competitorName}`);
            }
        } catch (error) {
            console.error('Context Self-Learning Error:', error);
        }
    }
}

module.exports = new RadarService();
