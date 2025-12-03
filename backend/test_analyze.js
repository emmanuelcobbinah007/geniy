require('dotenv').config();
const genesisAgent = require('./services/ai/genesis');

async function testAnalyze() {
    try {
        console.log("Testing Analyze Context...");
        const text = "Geniy is a B2B SaaS platform that helps companies build better surveys using AI. We target product managers and founders.";

        const result = await genesisAgent.analyzeContext(text);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testAnalyze();
