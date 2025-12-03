require('dotenv').config();
const genesisAgent = require('./services/ai/genesis');

async function test() {
    try {
        console.log("Testing Genesis Chat...");
        const context = "This is a test context about a company called Geniy.";
        const messages = [{ role: "user", content: "What is Geniy?" }];
        
        const result = await genesisAgent.chatWithBrain(context, messages);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
