const { OpenAI } = require("openai");

class OpenRouterService {
    constructor() {
        this.client = null;
    }

    getClient() {
        if (!this.client) {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                console.warn("OPENROUTER_API_KEY is not set. AI features will not work.");
                return null;
            }

            this.client = new OpenAI({
                baseURL: "https://openrouter.ai/api/v1",
                apiKey: apiKey,
                defaultHeaders: {
                    "HTTP-Referer": "https://geniy.app",
                    "X-Title": "Geniy",
                }
            });
        }
        return this.client;
    }

    async complete(prompt, model = "openai/gpt-4o-mini", jsonMode = false) {
        try {
            const client = this.getClient();
            if (!client) {
                throw new Error("OpenRouter API Key is missing");
            }

            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: "user", content: prompt }
                ],
                response_format: jsonMode ? { type: "json_object" } : undefined
            });

            return completion.choices[0].message.content;
        } catch (error) {
            console.error("OpenRouter API Error:", error);
            throw new Error("Failed to generate AI response");
        }
    }
}

module.exports = new OpenRouterService();
