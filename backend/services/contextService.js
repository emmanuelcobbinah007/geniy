const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// We will require genesisAgent later to avoid circular dependencies if possible, 
// or we can inject it. For now, let's assume we can require it.
// If circular dependency becomes an issue, we'll refactor.
const genesisAgent = require('./ai/genesis');

class ContextService {
    /**
     * Aggregates all workspace knowledge into a single context string for the AI.
     * Sources:
     * 1. Business Context (Text blob)
     * 2. Competitors (Structured DB data)
     * 3. Live Campaign Data (Surveys & Responses)
     */
    async getUnifiedContext(workspaceId) {
        if (!workspaceId) throw new Error("Workspace ID is required");

        // 1. Fetch Workspace & Competitors
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: {
                businessContext: true,
                competitors: true,
                gapAnalysis: true
            }
        });

        if (!workspace) throw new Error("Workspace not found");

        let unifiedContext = "=== BUSINESS CONTEXT & KNOWLEDGE BASE ===\n";
        unifiedContext += workspace.businessContext || "No business context provided yet.";
        unifiedContext += "\n=========================================\n";

        // 2. Append Competitors
        if (workspace.competitors && Array.isArray(workspace.competitors) && workspace.competitors.length > 0) {
            unifiedContext += `\n=== KNOWN COMPETITORS ===\n`;
            workspace.competitors.forEach(c => {
                unifiedContext += `- ${c.name}`;
                if (c.analysis) {
                    // Summarize analysis to save tokens if needed, for now dump it
                    unifiedContext += `: ${JSON.stringify(c.analysis).substring(0, 500)}...`;
                }
                unifiedContext += `\n`;
            });
            unifiedContext += `=========================\n`;
        }

        // 2.5 Append Gap Analysis (Strategic Insights)
        if (workspace.gapAnalysis) {
            unifiedContext += `\n=== STRATEGIC GAP ANALYSIS ===\n`;
            unifiedContext += JSON.stringify(workspace.gapAnalysis, null, 2);
            unifiedContext += `\n==============================\n`;
        }

        // 3. Append Live Campaign Data
        const campaigns = await prisma.campaign.findMany({
            where: { workspaceId },
            include: {
                surveys: {
                    include: {
                        responses: {
                            orderBy: { submittedAt: 'desc' },
                            take: 10 // Increased from 5 to give more context
                        }
                    }
                }
            }
        });

        if (campaigns.length > 0) {
            unifiedContext += "\n=== LIVE CAMPAIGN DATA (REAL-TIME) ===\n";
            campaigns.forEach(campaign => {
                unifiedContext += `Campaign: ${campaign.name}\n`;
                campaign.surveys.forEach(survey => {
                    unifiedContext += `  - Survey: ${survey.title} (Status: ${survey.isActive ? 'Active' : 'Inactive'})\n`;
                    if (survey.responses.length > 0) {
                        unifiedContext += `    Recent Responses:\n`;
                        survey.responses.forEach(r => {
                            // Format answers nicely
                            const answerSummary = JSON.stringify(r.rawAnswers);
                            unifiedContext += `      - [${r.submittedAt.toISOString()}] ${answerSummary.substring(0, 300)}\n`;
                        });
                    } else {
                        unifiedContext += `    (No responses yet)\n`;
                    }
                });
            });
            unifiedContext += "======================================\n";
        }

        return unifiedContext;
    }

    /**
     * Appends new information to the workspace's business context.
     * Useful for "Memory" - when the user tells the AI something new.
     */
    async appendContext(workspaceId, newInfo) {
        if (!workspaceId || !newInfo) return;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { businessContext: true }
        });

        if (!workspace) return;

        const timestamp = new Date().toISOString().split('T')[0];
        const entry = `\n\n[User Note - ${timestamp}]: ${newInfo}`;

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                businessContext: (workspace.businessContext || "") + entry
            }
        });

        return entry;
    }

    /**
     * Analyzes raw text (e.g. from a PDF) and appends the insights to the context.
     * This prevents the context from becoming a dump of raw text.
     */
    async analyzeAndAppend(workspaceId, rawText, sourceName = "Document") {
        // 1. Summarize/Extract Insights using AI
        // We'll add a method to genesisAgent for this specific task
        const analysis = await genesisAgent.summarizeKnowledge(rawText);

        // 2. Append the structured analysis
        const timestamp = new Date().toISOString().split('T')[0];
        const entry = `\n\n=== KNOWLEDGE FROM ${sourceName.toUpperCase()} (${timestamp}) ===\n${analysis}\n============================================\n`;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { businessContext: true }
        });

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                businessContext: (workspace.businessContext || "") + entry
            }
        });

        return analysis;
    }
}

module.exports = new ContextService();
