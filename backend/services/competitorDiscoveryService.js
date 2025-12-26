const prisma = require('../config/db');
const genesisAgent = require('./ai/genesis');
const radarService = require('./radarService');

class CompetitorDiscoveryService {
    async run(contextOrSummary, workspaceId) {
        console.log(`Starting background competitor analysis for workspace ${workspaceId}...`);

        let contextSummary = contextOrSummary;

        // 1. Adapter: If input is raw string (business context), parse it
        if (typeof contextOrSummary === 'string') {
            const companyMatch = contextOrSummary.match(/Company:\s*(.+?)(\n|$)/);
            const industryMatch = contextOrSummary.match(/Industry:\s*(.+?)(\n|$)/);
            const valuePropMatch = contextOrSummary.match(/Value Proposition:\s*(.+?)(\n|$)/);

            // Extract competitors from list
            let competitors = [];
            const competitorsSplit = contextOrSummary.split("Competitors:");
            if (competitorsSplit.length > 1) {
                const list = competitorsSplit[1].split("\n\n")[0]; // Get the block
                competitors = list.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.startsWith('- '))
                    .map(l => l.substring(2));
            }

            contextSummary = {
                companyName: companyMatch ? companyMatch[1].trim() : "Unknown",
                industry: industryMatch ? industryMatch[1].trim() : "General",
                valueProposition: valuePropMatch ? valuePropMatch[1].trim() : "Unknown",
                competitors: competitors
            };
            console.log(`Parsed context string into summary. Found ${competitors.length} initial competitors.`);
        }

        try {
            // Discover Competitors (Agentic - Slow)
            const competitors = await genesisAgent.discoverCompetitors(contextSummary);
            console.log("Manus Agent Competitors Discovered:", competitors);

            if (competitors.length > 0) {
                const workspace = await prisma.workspace.findUnique({
                    where: { id: workspaceId },
                    select: { competitors: true }
                });

                if (workspace) {
                    let existingCompetitors = workspace.competitors || [];

                    // Validate competitors is an array of strings
                    if (!Array.isArray(competitors) || !competitors.every(c => typeof c === 'string')) {
                        console.error("Invalid competitors format received:", competitors);
                        return;
                    }

                    const newCompetitors = competitors.filter(c =>
                        !existingCompetitors.some(ec => ec && ec.name && ec.name.toLowerCase() === c.toLowerCase())
                    ).map(c => ({
                        name: c,
                        analysis: null, // Initial discovery has no deep analysis yet
                        discoveredAt: new Date().toISOString()
                    }));

                    if (newCompetitors.length > 0) {
                        await prisma.workspace.update({
                            where: { id: workspaceId },
                            data: {
                                competitors: [...existingCompetitors, ...newCompetitors]
                            }
                        });
                        console.log(`Persisted ${newCompetitors.length} new competitors for workspace ${workspaceId}`);

                        // AUTOMATION: Trigger Initial Radar Scan
                        console.log(`⚡ Triggering initial radar scan for ${newCompetitors.length} new competitors...`);

                        // We run this without awaiting to return quickly, but we catch errors logs
                        // OPTIMIZATION: Run sequentially to prevent server resource spike (Puppeteer is heavy)
                        (async () => {
                            for (const comp of newCompetitors) {
                                try {
                                    await radarService.scanCompetitor(workspaceId, comp.name);
                                    // Small breathing room between scans
                                    await new Promise(r => setTimeout(r, 1000));
                                } catch (err) {
                                    console.error(`Failed initial scan for ${comp.name}`, err);
                                }
                            }
                        })();

                    } else {
                        console.log("No new competitors to persist.");
                    }
                }
            }
        } catch (error) {
            console.error("Competitor Discovery Failed:", error);
        }
    }
}

module.exports = new CompetitorDiscoveryService();
