const genesisAgent = require('../services/ai/genesis');

exports.analyzeContext = async (req, res) => {
    try {
        const { contextText } = req.body;
        if (!contextText) {
            return res.status(400).json({ error: "Context text is required" });
        }

        // Step 1: Analyze Context
        const contextSummary = await genesisAgent.analyzeContext(contextText);

        // Step 2: Discover Competitors (Optional/Async in real app)
        // For MVP, we might skip or do it synchronously if fast enough
        // const enrichedContext = await genesisAgent.discoverCompetitors(contextSummary);

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
        const { contextSummary, strategy } = req.body;
        if (!contextSummary || !strategy) {
            return res.status(400).json({ error: "Context summary and strategy are required" });
        }

        const survey = await genesisAgent.generateSurvey(contextSummary, strategy);
        res.json(survey);
    } catch (error) {
        console.error("Survey Generation Error:", error);
        res.status(500).json({ error: "Failed to generate survey" });
    }
};
