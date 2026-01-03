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

    async complete(prompt, model = "openai/gpt-4o-mini", jsonMode = false, maxTokens = 1000) {
        try {
            const client = this.getClient();
            if (!client) {
                throw new Error("OpenRouter API Key is missing");
            }

            console.log(`[OpenRouter] Calling model: ${model}, jsonMode: ${jsonMode}, maxTokens: ${maxTokens}`);

            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: "user", content: prompt }
                ],
                response_format: jsonMode ? { type: "json_object" } : undefined,
                max_tokens: maxTokens
            });

            const content = completion.choices[0].message.content;
            console.log(`[OpenRouter] Response received, length: ${content?.length || 0} chars`);
            return content;
        } catch (error) {
            console.error("[OpenRouter] API Error Details:");
            console.error("[OpenRouter] Model:", model);
            console.error("[OpenRouter] Error name:", error.name);
            console.error("[OpenRouter] Error message:", error.message);
            if (error.response) {
                console.error("[OpenRouter] Response status:", error.response.status);
                console.error("[OpenRouter] Response data:", JSON.stringify(error.response.data || {}).substring(0, 500));
            }
            throw new Error(`Failed to generate AI response: ${error.message}`);
        }
    }
}

module.exports = new OpenRouterService();
