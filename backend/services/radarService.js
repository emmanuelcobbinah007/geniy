const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const scraperService = require('./scraperService');
const genesisAgent = require('./ai/genesis');
const auditService = require('./auditService');

class RadarService {

    /**
     * Scans a specific competitor for a workspace
     * @param {string} workspaceId 
     * @param {string} competitorName 
     */
    async scanCompetitor(workspaceId, competitorName) {
        console.log(`📡 RADAR: Scanning ${competitorName} for workspace ${workspaceId}...`);

        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!workspace || !workspace.competitors) {
            throw new Error("Workspace or competitors not found");
        }

        const competitors = workspace.competitors;
        const targetIndex = competitors.findIndex(c => c.name.toLowerCase() === competitorName.toLowerCase());

        if (targetIndex === -1) {
            throw new Error(`Competitor ${competitorName} not found in tracking list.`);
        }

        const target = competitors[targetIndex];

        // 1. Get URL (If missing, use AI/Search to find it - mocked for now or use Perplexity in future)
        let url = target.url || target.website;

        // AUTO-DISCOVERY: If no URL, ask Genesis/Perplexity
        if (!url) {
            console.log(`🔍 URL missing for ${competitorName}. Attempting auto-discovery...`);
            try {
                const discoveryPrompt = `Find the official website homepage URL for the company "${competitorName}". Return ONLY the raw URL string (e.g., https://example.com). Do not include any text.`;
                const discoveredUrl = await genesisAgent.research(discoveryPrompt);

                // Simple validation: check if looks like a URL
                if (discoveredUrl && discoveredUrl.includes('http')) {
                    // Clean up potential markdown or whitespace
                    url = discoveredUrl.replace(/```/g, '').trim();
                    console.log(`✅ Discovered URL for ${competitorName}: ${url}`);

                    // Save it immediately so we don't have to look it up next time
                    target.url = url;
                    // Note: We don't save to DB here yet, we save at the end of the function successfully
                } else {
                    console.log(`❌ Could not discover URL for ${competitorName}. Result: ${discoveredUrl}`);
                    throw new Error("Could not find competitor website URL.");
                }
            } catch (err) {
                console.log(`⚠️ Auto-discovery failed for ${competitorName}. Skipping Radar.`);
                return { status: "skipped", reason: "no_url_found" };
            }
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
            } else if (!oldHash) {
                console.log(`✨ First scan for ${competitorName}. Content baseline established.`);
                changeDetected = true; // Technically a "change" from null
                insight = "Initial baseline established.";
            } else {
                console.log(`✅ No change detected for ${competitorName}.`);
            }

            // 5. Update DB
            const updatedCompetitor = {
                ...target,
                url: url,
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
                console.log(`📢 Logged activity for ${competitorName}`);
            }

            return { status: changeDetected ? "changed" : "stable", insight, competitor: updatedCompetitor };

        } catch (error) {
            console.error(`Radar scan failed for ${competitorName}:`, error);
            // Log error in history
            const updatedCompetitor = {
                ...target,
                lastScrapedAt: new Date().toISOString(),
                radarStatus: "error",
                radarHistory: [
                    { date: new Date().toISOString(), status: "error", error: error.message },
                    ...(target.radarHistory || [])
                ].slice(0, 5)
            };
            competitors[targetIndex] = updatedCompetitor;
            await prisma.workspace.update({
                where: { id: workspaceId },
                data: { competitors: competitors }
            });
            throw error;
        }
    }
}

module.exports = new RadarService();
