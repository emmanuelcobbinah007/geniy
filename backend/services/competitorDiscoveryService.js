const prisma = require('../config/db');
const genesisAgent = require('./ai/genesis');
const radarService = require('./radarService');

class CompetitorDiscoveryService {
    async run(contextSummary, workspaceId) {
        console.log(`Starting background competitor analysis for workspace ${workspaceId}...`);

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
                        Promise.allSettled(newCompetitors.map(comp =>
                            radarService.scanCompetitor(workspaceId, comp.name)
                                .catch(err => console.error(`Failed initial scan for ${comp.name}`, err))
                        ));

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
