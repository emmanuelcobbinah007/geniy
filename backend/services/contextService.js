const prisma = require('../config/db');
// We will require genesisAgent later to avoid circular dependencies if possible, 
// or we can inject it. For now, let's assume we can require it.
// If circular dependency becomes an issue, we'll refactor.
const genesisAgent = require('./ai/genesis');

const { encrypt, decrypt } = require('../utils/encryption');

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

        // Decrypt business context
        const businessContext = decrypt(workspace.businessContext);

        let unifiedContext = "=== BUSINESS CONTEXT & KNOWLEDGE BASE ===\n";
        unifiedContext += businessContext || "No business context provided yet.";
        unifiedContext += "\n=========================================\n";

        if (workspace.competitors && Array.isArray(workspace.competitors) && workspace.competitors.length > 0) {
            unifiedContext += `\n=== KNOWN COMPETITORS & INTELLIGENCE ===\n`;
            workspace.competitors.forEach(c => {
                unifiedContext += `\n--- COMPETITOR: ${c.name} ---\n`;
                if (c.url) unifiedContext += `URL: ${c.url}\n`;

                // 1. Static Analysis
                if (c.analysis) {
                    unifiedContext += `Core Analysis: ${JSON.stringify(c.analysis).substring(0, 500)}...\n`;
                }

                // 2. Recent Radar Activity (The "pulse")
                if (c.radarHistory && Array.isArray(c.radarHistory) && c.radarHistory.length > 0) {
                    unifiedContext += `Recent Website Activity (Last 10 Scans):\n`;
                    // Take last 10, filter for meaningful updates if possible, or just list them
                    const history = c.radarHistory.slice(0, 10);
                    history.forEach(h => {
                        const date = h.date ? h.date.split('T')[0] : 'Unknown Date';
                        const status = h.status === 'changed' ? '⚠ UPDATE DETECTED' : 'Stable';
                        unifiedContext += `  - [${date}] ${status}: ${h.insight || 'No significant changes.'}\n`;
                    });
                } else {
                    unifiedContext += `(No recent scan history available)\n`;
                }
            });
            unifiedContext += `==========================================\n`;
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

        // Decrypt first
        const currentContext = decrypt(workspace.businessContext) || "";

        const timestamp = new Date().toISOString().split('T')[0];
        const entry = `\n\n[User Note - ${timestamp}]: ${newInfo}`;
        const updatedContext = currentContext + entry;

        // Encrypt before saving
        const encryptedContext = encrypt(updatedContext);

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                businessContext: encryptedContext
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

        // Decrypt first
        const currentContext = decrypt(workspace.businessContext) || "";
        const updatedContext = currentContext + entry;

        // Encrypt before saving
        const encryptedContext = encrypt(updatedContext);

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                businessContext: encryptedContext
            }
        });

        return analysis;
    }
}

module.exports = new ContextService();
