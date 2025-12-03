const genesisAgent = require('../services/ai/genesis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.analyzeContext = async (req, res) => {
    try {
        const { contextText, workspaceId } = req.body;
        if (!contextText) {
            return res.status(400).json({ error: "Context text is required" });
        }

        // Step 1: Analyze Context
        const contextSummary = await genesisAgent.analyzeContext(contextText);

        // Step 2: Discover Competitors (Agentic)
        const competitors = await genesisAgent.discoverCompetitors(contextSummary);
        console.log("Manus Agent Competitors:", competitors); // Log for debugging
        contextSummary.competitors = competitors;

        // Step 3: Persist to Workspace (if workspaceId provided)
        if (workspaceId && competitors.length > 0) {
            try {
                const workspace = await prisma.workspace.findUnique({
                    where: { id: workspaceId }
                });

                if (workspace) {
                    let existingCompetitors = workspace.competitors || [];

                    // Merge new competitors (avoid duplicates)
                    const newCompetitors = competitors.filter(c =>
                        !existingCompetitors.some(ec => ec.name.toLowerCase() === c.toLowerCase())
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
                    }
                }
            } catch (dbError) {
                console.error("Failed to persist discovered competitors:", dbError);
                // Don't fail the request if persistence fails
            }
        }

        res.json(contextSummary);
    } catch (error) {
        console.error("Context Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze context" });
    }
};

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
        if (!context || !messages) {
            return res.status(400).json({ error: "Context and messages are required" });
        }

        let enrichedContext = context;

        if (workspaceId) {
            // Fetch live campaign data
            const campaigns = await prisma.campaign.findMany({
                where: { workspaceId },
                include: {
                    surveys: {
                        include: {
                            responses: {
                                orderBy: { submittedAt: 'desc' },
                                take: 5 // Get 5 most recent responses per survey for context
                            }
                        }
                    }
                }
            });

            if (campaigns.length > 0) {
                let campaignSummary = "\n\n=== LIVE CAMPAIGN DATA ===\n";
                campaigns.forEach(campaign => {
                    campaignSummary += `Campaign: ${campaign.name}\n`;
                    campaign.surveys.forEach(survey => {
                        const responseCount = survey.responses.length; // Note: This is just the fetched count (max 5), ideally we'd get total count separately but this is a quick context injection
                        // Actually, let's just say "Recent Responses"
                        campaignSummary += `  - Survey: ${survey.title} (Public Slug: ${survey.publicSlug})\n`;
                        if (survey.responses.length > 0) {
                            campaignSummary += `    Recent Responses:\n`;
                            survey.responses.forEach(r => {
                                campaignSummary += `      - [${r.submittedAt.toISOString()}] ${JSON.stringify(r.rawAnswers).substring(0, 200)}...\n`;
                            });
                        } else {
                            campaignSummary += `    No responses yet.\n`;
                        }
                    });
                });
                campaignSummary += "==========================\n";
                enrichedContext += campaignSummary;
            }
        }

        const result = await genesisAgent.chatWithBrain(enrichedContext, messages);
        res.json({ reply: result.message });
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
