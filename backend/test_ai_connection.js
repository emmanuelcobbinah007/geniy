require('dotenv').config();
const openRouter = require('./services/ai/openrouter');

async function test() {
    try {
        console.log("Testing OpenRouter connection...");
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("OPENROUTER_API_KEY is missing in environment variables.");
            return;
        }
        console.log("API Key present (length):", process.env.OPENROUTER_API_KEY.length);

        const response = await openRouter.complete("Hello, are you working?");
        console.log("Response:", response);
    } catch (error) {
        console.error("Test failed:", error.message);
        if (error.response) {
            console.error("Error details:", error.response.data);
        }
    }
}

test();
