const genesisAgent = require('../services/ai/genesis');
const { PrismaClient } = require('@prisma/client');
const auditService = require('../services/auditService');
const prisma = new PrismaClient();

exports.analyzeContext = async (req, res) => {
    try {

        const { workspaceId, recommendations } = req.body;

        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required for unified analysis" });
        }

        const contextService = require('../services/contextService');
        const unifiedContext = await contextService.getUnifiedContext(workspaceId);

        if (!unifiedContext) {
            return res.status(400).json({ error: "No context found for this workspace" });
        }

        // Step 1: Analyze Context (Fast)
        const contextSummary = await genesisAgent.analyzeContext(unifiedContext, recommendations);

        // Step 2: Send Response Immediately
        res.json(contextSummary);

        // Step 3: Trigger Background Competitor Analysis (Fire-and-forget)
        runBackgroundCompetitorAnalysis(contextSummary, workspaceId).catch(err => {
            console.error("Background Competitor Analysis Failed:", err);
        });

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

        // REMOVED: Early exit check. We want to discover new competitors even if some exist.
        // if (workspace && workspace.competitors && workspace.competitors.length > 0) { ... }
    } catch (err) {
        console.error("Failed to check existing competitors:", err);
        // Continue regardless
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
        const { workspaceId, messages } = req.body;
        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
        }

        const contextService = require('../services/contextService');
        const enrichedContext = await contextService.getUnifiedContext(workspaceId);

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
                console.log(`[Agent Action] Found ${workspace.competitors.length} competitors in DB.`);

                let targets = [];
                if (result.actionTarget === 'ALL') {
                    targets = workspace.competitors.map(c => c.name);
                } else if (result.actionTarget) {
                    // Fuzzy match or exact match
                    const targetName = result.actionTarget.toLowerCase();
                    const match = workspace.competitors.find(c => c.name.toLowerCase().includes(targetName));
                    if (match) targets.push(match.name);
                }

                // FALLBACK: If DB is empty, try to parse from context (Just-in-Time Discovery)
                // This matches frontend logic to ensure we don't miss "detected" but unsaved competitors
                if (targets.length === 0 && result.actionTarget === 'ALL') {
                    // Need decryption for context
                    const { decrypt } = require('../utils/encryption');
                    const decryptedContext = workspace.businessContext ? decrypt(workspace.businessContext) : "";

                    const competitorsSplit = decryptedContext.split("Competitors:");
                    if (competitorsSplit.length > 1) {
                        const competitorsSection = competitorsSplit[1].split("\n\n")[0];
                        const lines = competitorsSection.split('\n');
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('- ')) {
                                targets.push(trimmed.substring(2));
                            } else if (trimmed.length > 0 && !trimmed.startsWith('Competitors')) {
                                // Attempt to catch lines that might not have dash but look like names (heuristic)
                                // Skipping purely empty lines
                            }
                        }
                    }
                    console.log(`[Agent Action] Fallback discovery found ${targets.length} targets from text.`);
                }

                // If STILL no targets, cancel the action to prevent UI hanging
                if (targets.length === 0) {
                    console.log("[Agent Action] No targets found. Cancelling action.");
                    result.action = null;
                    result.actionTarget = null;
                    result.message += " (I couldn't find any competitors listed in your context to analyze. Please ensure they are listed under 'Competitors:' in the Context tab.)";
                }

                console.log(`[Agent Action] Identified targets:`, targets);

                // Trigger background analysis for each target
                // Run sequentially to avoid rate limits
                (async () => {
                    const results = [];
                    // Need decryption for context
                    const { decrypt } = require('../utils/encryption');
                    const decryptedContext = workspace.businessContext ? decrypt(workspace.businessContext) : "";

                    for (const compName of targets) {
                        try {
                            console.log(`[Agent Action] Starting background analysis for ${compName}...`);
                            // Extract industry from businessContext if possible, or default
                            const industryMatch = decryptedContext ? decryptedContext.match(/Industry:\s*(.+?)(\n|$)/) : null;
                            const industry = industryMatch ? industryMatch[1].trim() : "General";
                            console.log(`[Agent Action] Detected Industry: ${industry}`);

                            const analysis = await genesisAgent.analyzeCompetitor(compName, industry);

                            if (analysis) {
                                // Update the specific competitor in the array
                                const freshWorkspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
                                if (freshWorkspace && freshWorkspace.competitors) {
                                    const existingIndex = freshWorkspace.competitors.findIndex(c => c.name === compName);
                                    let updatedCompetitors = [...freshWorkspace.competitors];

                                    if (existingIndex >= 0) {
                                        updatedCompetitors[existingIndex] = { ...updatedCompetitors[existingIndex], analysis: analysis };
                                    } else {
                                        updatedCompetitors.push({ name: compName, analysis: analysis, pricingModel: "Unknown" }); // Default props
                                    }

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
                            console.error(`[Agent Action] Failed background analysis for ${compName}:`, err);

                            // Save error state to DB so UI stops loading
                            try {
                                const errorAnalysis = {
                                    error: true,
                                    strengths: ["Analysis Failed: " + (err.message || "Unknown Error")], // Fallback for UI that expects arrays
                                    weaknesses: ["Please try again later."],
                                    pricingModel: "Error",
                                    uniqueSellingPoint: "Analysis Failed"
                                };

                                const freshWorkspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
                                if (freshWorkspace && freshWorkspace.competitors) {
                                    const existingIndex = freshWorkspace.competitors.findIndex(c => c.name === compName);
                                    let updatedCompetitors = [...freshWorkspace.competitors];

                                    if (existingIndex >= 0) {
                                        updatedCompetitors[existingIndex] = { ...updatedCompetitors[existingIndex], analysis: errorAnalysis };
                                    } else {
                                        updatedCompetitors.push({ name: compName, analysis: errorAnalysis, pricingModel: "Error" });
                                    }

                                    await prisma.workspace.update({
                                        where: { id: workspaceId },
                                        data: { competitors: updatedCompetitors }
                                    });
                                    console.log(`[Agent Action] Saved error state for ${compName}`);
                                }
                            } catch (saveErr) {
                                console.error("Critical: Failed to save error state to DB", saveErr);
                            }
                        }
                    }

                })().catch(err => console.error("[Agent Action] Background task failed:", err));
            }
        }

        res.json({
            reply: result.message,
            memory: result.memory,
            action: result.action,
            actionTarget: result.actionTarget
        });
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

exports.deleteCompetitor = async (req, res) => {
    try {
        const { workspaceId, competitorName } = req.body;
        if (!workspaceId || !competitorName) {
            return res.status(400).json({ error: "Workspace ID and competitor name are required" });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId }
        });

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        const competitors = workspace.competitors || [];
        const updatedCompetitors = competitors.filter(c => c.name.toLowerCase() !== competitorName.toLowerCase());

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { competitors: updatedCompetitors }
        });

        res.json({ message: "Competitor deleted successfully", competitors: updatedCompetitors });
    } catch (error) {
        console.error("Delete Competitor Error:", error);
        res.status(500).json({ error: "Failed to delete competitor" });
    }
};


