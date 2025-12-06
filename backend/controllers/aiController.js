const genesisAgent = require('../services/ai/genesis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.analyzeContext = async (req, res) => {
    try {
        const { contextText, workspaceId } = req.body;
        if (!contextText) {
            return res.status(400).json({ error: "Context text is required" });
        }

        // Step 1: Analyze Context (Fast)
        const contextSummary = await genesisAgent.analyzeContext(contextText);

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
        const { contextSummary } = req.body;
        if (!contextSummary) {
            return res.status(400).json({ error: "Context summary is required" });
        }

        const strategy = await genesisAgent.generateStrategy(contextSummary);
        res.json(strategy);
    } catch (error) {
        console.error("Strategy Generation Error:", error);
        res.status(500).json({ error: "Failed to generate strategy" });
    }
};

exports.generateSurvey = async (req, res) => {
    try {
        const { contextSummary, strategy, userInstruction } = req.body;
        if (!contextSummary || !strategy) {
            return res.status(400).json({ error: "Context summary and strategy are required" });
        }

        const survey = await genesisAgent.generateSurvey(contextSummary, strategy, userInstruction);
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
