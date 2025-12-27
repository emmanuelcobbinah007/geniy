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

                    // 4. Generate Insight (AI Diff)
                    // We ask Genesis to compare old text vs new text? 
                    // Or just analyze the NEW text for "Updates".
                    // Saving full old text might be too heavy. 
                    // Let's just say "Content Changed" for v1.
                    insight = "Website content has changed significantly.";

                    // NOTIFICATION: Alert workspace
                    await notificationService.send(workspaceId, {
                        title: `Competitor Update: ${competitorName}`,
                        message: `Significant changes detected on ${competitorName}'s website. Click to review.`,
                        type: 'info',
                        link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://geniy.aurorasoftwarelabs.io'}/dashboard/${workspaceId}/context`
                    });
                } else if (!oldHash) {
                    console.log(`✨ First scan for ${competitorName}. Content baseline established.`);
                    changeDetected = true; // Technically a "change" from null
                    insight = "Initial baseline established.";
                } else {
                    console.log(`✅ No change detected for ${competitorName}.`);
                }

                const updatedCompetitor = {
                    ...target,
                    url: url,
                    radarStatus: 'stable',
                    lastScrapedAt: new Date().toISOString(),
                    contentHash: newHash,
                    // Add to history log (keep last 5 entries to save space)
                    radarHistory: [
                        { date: new Date().toISOString(), status: changeDetected ? "changed" : "stable", insight },
                        ...(target.radarHistory || [])
                    ].slice(0, 5)
                };

                competitors[targetIndex] = updatedCompetitor;

                await prisma.workspace.update({
                    where: { id: workspaceId },
                    data: { competitors: competitors }
                });

                // 6. Notify / Audit Log (Active Notification)
                if (changeDetected && insight !== "Initial baseline established.") {
                    await auditService.log({
                        workspaceId: workspaceId,
                        action: 'COMPETITOR_UPDATE',
                        metadata: {
                            competitorName: competitorName,
                            insight: insight,
                            url: url
                        }
                    });

                    // LIVE PULSE: Send Webhook Notification
                    const changeMessages = [
                        insight || "Website content has changed.",
                        `Heads up! I detected some updates on ${competitorName}.`,
                        `Looks like ${competitorName} made some tweaks.`,
                        `New activity detected on ${competitorName}'s site.`
                    ];
                    // Prefer the actual insight if it's descriptive, otherwise pick a random alert
                    const message = (insight && insight !== "Website content has changed significantly.")
                        ? insight
                        : changeMessages[Math.floor(Math.random() * changeMessages.length)];

                    await notificationService.send(workspaceId, {
                        title: `Competitor Update: ${competitorName}`,
                        message: message,
                        link: url,
                        type: 'warning'
                    });

                    console.log(`📢 Logged activity and notified for ${competitorName}`);
                } else if (!changeDetected) {
                    const stableMessages = [
                        `Daily scan complete for ${competitorName}. No significant changes detected.`,
                        `Everything looks quiet on ${competitorName}'s front today.`,
                        `Checked ${competitorName} just now. All stable.`,
                        `No major moves from ${competitorName} in the last 24h.`
                    ];
                    const message = stableMessages[Math.floor(Math.random() * stableMessages.length)];

                    await notificationService.send(workspaceId, {
                        title: `System Status: Stable`,
                        message: message,
                        link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://geniy.aurorasoftwarelabs.io'}/dashboard/${workspaceId}/context`,
                        type: 'success'
                    });
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
}

module.exports = new RadarService();
