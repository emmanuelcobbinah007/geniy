const genesisAgent = require('../services/ai/genesis');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.analyzeContext = async (req, res) => {
    try {
        const { contextText } = req.body;
        if (!contextText) {
            return res.status(400).json({ error: "Context text is required" });
        }

        // Step 1: Analyze Context
        const contextSummary = await genesisAgent.analyzeContext(contextText);

        // Step 2: Discover Competitors (Agentic)
        const competitors = await genesisAgent.discoverCompetitors(contextSummary);
        console.log("Manus Agent Competitors:", competitors); // Log for debugging
        contextSummary.competitors = competitors;

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

        const reply = await genesisAgent.chat(enrichedContext, messages);
        res.json({ reply });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to chat" });
    }
};
