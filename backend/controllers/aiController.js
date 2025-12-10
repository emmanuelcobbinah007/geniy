const genesisAgent = require('../services/ai/genesis');
const { PrismaClient } = require('@prisma/client');
const auditService = require('../services/auditService');
const prisma = new PrismaClient();

exports.analyzeContext = async (req, res) => {
    try {
        const { contextText, workspaceId, recommendations } = req.body;
        if (!contextText) {
            return res.status(400).json({ error: "Context text is required" });
        }

        // Step 1: Analyze Context (Fast)
        const contextSummary = await genesisAgent.analyzeContext(contextText, recommendations);

        // Step 2: Send Response Immediately
        res.json(contextSummary);

        // Step 3: Trigger Background Competitor Analysis (Fire-and-forget)
        if (workspaceId) {
            runBackgroundCompetitorAnalysis(contextSummary, workspaceId).catch(err => {
                console.error("Background Competitor Analysis Failed:", err);
            });
        }

    } catch (error) {
        console.error("Context Analysis Error:", error);
        // Only send error if response hasn't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to analyze context" });
        }
    }
};

// Helper for background processing
async function runBackgroundCompetitorAnalysis(contextSummary, workspaceId) {
    console.log(`Starting background competitor analysis for workspace ${workspaceId}...`);

    try {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { competitors: true }
        });

        // CRITICAL: If competitors already exist, DO NOT run discovery.
        if (workspace && workspace.competitors && workspace.competitors.length > 0) {
            console.log(`Workspace ${workspaceId} already has ${workspace.competitors.length} competitors. Skipping discovery.`);
            return;
        }
    } catch (err) {
        console.error("Failed to check existing competitors:", err);
        // Continue if check fails? Or abort? Safer to abort to avoid redundant costs.
        return;
    }

    // Discover Competitors (Agentic - Slow)
    const competitors = await genesisAgent.discoverCompetitors(contextSummary);
    console.log("Manus Agent Competitors Discovered:", competitors);

    if (competitors.length > 0) {
        try {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId }
            });

            if (workspace) {
                let existingCompetitors = workspace.competitors || [];

                // Merge new competitors (avoid duplicates)
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
                } else {
                    console.log("No new competitors to persist.");
                }
            }
        } catch (dbError) {
            console.error("Failed to persist discovered competitors:", dbError);
        }
    }
}

exports.generateStrategy = async (req, res) => {
    try {
        const { contextSummary, workspaceId } = req.body;

        let fullContext = contextSummary;

        // If workspaceId is provided, fetch the full unified context to ensure relevance
        if (workspaceId) {
            const contextService = require('../services/contextService');
            const unifiedContext = await contextService.getUnifiedContext(workspaceId);
            if (unifiedContext) {
                // We append the unified context to the summary to give the AI the full picture
                fullContext = `
                Summary: ${JSON.stringify(contextSummary)}
                
                Full Unified Context (Includes Chat History & PDFs):
                ${unifiedContext}
                `;

                // Audit Log
                auditService.log({
                    userId: req.user ? req.user.id : null,
                    workspaceId: workspaceId,
                    action: 'AI_CONTEXT_ACCESS',
                    metadata: { type: 'strategy_generation' }
                });
            }
        }

        if (!fullContext) {
            return res.status(400).json({ error: "Context summary is required" });
        }

        const strategy = await genesisAgent.generateStrategy(fullContext);
        res.json(strategy);
    } catch (error) {
        console.error("Strategy Generation Error:", error);
        res.status(500).json({ error: "Failed to generate strategy" });
    }
};

exports.generateSurvey = async (req, res) => {
    try {
        const { contextSummary, strategy, userInstruction, workspaceId } = req.body;

        let fullContext = contextSummary;

        // If workspaceId is provided, fetch the full unified context to ensure relevance
        if (workspaceId) {
            const contextService = require('../services/contextService');
            const unifiedContext = await contextService.getUnifiedContext(workspaceId);
            if (unifiedContext) {
                // We append the unified context to the summary to give the AI the full picture
                fullContext = `
                Summary: ${JSON.stringify(contextSummary)}
                
                Full Unified Context (Includes Chat History & PDFs):
                ${unifiedContext}
                `;
            }
        }

        if (!fullContext || !strategy) {
            return res.status(400).json({ error: "Context summary and strategy are required" });
        }

        const survey = await genesisAgent.generateSurvey(fullContext, strategy, userInstruction);
        res.json(survey);
    } catch (error) {
        console.error("Survey Generation Error:", error);
        res.status(500).json({ error: "Failed to generate survey" });
    }
};

exports.chatWithContext = async (req, res) => {
    try {
        const { context, messages, workspaceId } = req.body;
        // Note: 'context' param here might be the old client-side context. 
        // We will IGNORE it and fetch fresh context using ContextService to ensure single source of truth.

        if (!messages) {
            return res.status(400).json({ error: "Messages are required" });
        }

        let enrichedContext = "";

        if (workspaceId) {
            const contextService = require('../services/contextService');
            enrichedContext = await contextService.getUnifiedContext(workspaceId);
        } else {
            // Fallback if no workspaceId (shouldn't happen in dashboard)
            enrichedContext = context || "";
        }

        const result = await genesisAgent.chatWithBrain(enrichedContext, messages);

        // Handle Memory (If the agent flagged something to remember)
        if (result.memory && workspaceId) {
            const contextService = require('../services/contextService');
            await contextService.appendContext(workspaceId, result.memory);
            console.log(`[Memory] Appended new insight to workspace ${workspaceId}:`, result.memory);
        }

        // Handle Agentic Actions
        if (result.action === 'ANALYZE_COMPETITOR' && workspaceId) {
            console.log(`[Agent Action] Triggering competitor analysis. Target: ${result.actionTarget}`);

            // Fetch workspace to get competitors
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId }
            });

            if (workspace && workspace.competitors) {
                let targets = [];
                if (result.actionTarget === 'ALL') {
                    targets = workspace.competitors.map(c => c.name);
                } else if (result.actionTarget) {
                    // Fuzzy match or exact match
                    const targetName = result.actionTarget.toLowerCase();
                    const match = workspace.competitors.find(c => c.name.toLowerCase().includes(targetName));
                    if (match) targets.push(match.name);
                }

                // Trigger background analysis for each target
                // Run sequentially to avoid rate limits
                (async () => {
                    const results = [];
                    for (const compName of targets) {
                        try {
                            console.log(`Starting background analysis for ${compName}...`);
                            // Extract industry from businessContext if possible, or default
                            const industryMatch = workspace.businessContext ? workspace.businessContext.match(/Industry:\s*(.+?)(\n|$)/) : null;
                            const industry = industryMatch ? industryMatch[1].trim() : "General";

                            const analysis = await genesisAgent.analyzeCompetitor(compName, industry);

                            if (analysis) {
                                // Update the specific competitor in the array
                                const freshWorkspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
                                if (freshWorkspace && freshWorkspace.competitors) {
                                    const updatedCompetitors = freshWorkspace.competitors.map(c => {
                                        if (c.name === compName) {
                                            return { ...c, analysis: analysis };
                                        }
                                        return c;
                                    });

                                    await prisma.workspace.update({
                                        where: { id: workspaceId },
                                        data: { competitors: updatedCompetitors }
                                    });
                                    console.log(`Updated analysis for ${compName}`);
                                    results.push({ name: compName, analysis });
                                }
                            }

                            // Wait 2 seconds before next request to respect rate limits
                            await new Promise(resolve => setTimeout(resolve, 2000));

                        } catch (err) {
                            console.error(`Failed background analysis for ${compName}:`, err);
                        }
                    }

                })();
            }
        }

        res.json({ reply: result.message, memory: result.memory });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to chat" });
    }
};

exports.analyzeCompetitor = async (req, res) => {
    try {
        const { competitorName, industry } = req.body;
        if (!competitorName || !industry) {
            return res.status(400).json({ error: "Competitor name and industry are required" });
        }

        const analysis = await genesisAgent.analyzeCompetitor(competitorName, industry);
        res.json(analysis);
    } catch (error) {
        console.error("Competitor Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze competitor" });
    }
};

exports.generateTheme = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const theme = await genesisAgent.generateTheme(prompt);
        res.json(theme);
    } catch (error) {
        console.error("Theme Generation Error:", error);
        res.status(500).json({ error: "Failed to generate theme" });
    }
};

exports.generateGapAnalysis = async (req, res) => {
    try {
        const { workspaceId } = req.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId }
        });

        const { encrypt, decrypt } = require('../utils/encryption');

        // ... (other imports seem to be at the top of the file, this tool edits a chunk)

        // ...

        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Decrypt business context
        const businessContext = decrypt(workspace.businessContext);

        // Prepare context summary
        const contextSummary = {
            businessContext: businessContext,
            // We could parse more if needed
        };

        const competitors = workspace.competitors || [];

        if (competitors.length === 0) {
            return res.status(400).json({ message: "No competitors found to analyze against." });
        }

        // Audit Log for Gap Analysis
        if (req.user) {
            auditService.log({
                userId: req.user.id,
                workspaceId: workspaceId,
                action: 'AI_CONTEXT_ACCESS',
                metadata: { type: 'gap_analysis' }
            });
        }

        const analysis = await genesisAgent.generateGapAnalysis(contextSummary, competitors);

        // Save analysis to workspace
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { gapAnalysis: analysis }
        });

        res.json(analysis);

    } catch (error) {
        console.error("Gap Analysis Error:", error);
        res.status(500).json({ message: "Failed to generate gap analysis" });
    }
};


