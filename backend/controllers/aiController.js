const genesisAgent = require('../services/ai/genesis');

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

exports.chatWithContext = async (req, res) => {
    try {
        const { context, messages } = req.body;
        if (!context || !messages) {
            return res.status(400).json({ error: "Context and messages are required" });
        }

        const reply = await genesisAgent.chat(context, messages);
        res.json({ reply });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to chat" });
    }
};
