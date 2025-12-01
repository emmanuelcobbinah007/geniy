const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const openRouter = require('./openrouter');

class InsightService {
    /**
     * Generates AI insights for a given campaign.
     * @param {string} campaignId 
     */
    async generateInsights(campaignId) {
        // 1. Fetch Campaign, Workspace Context, and Responses
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                workspace: true,
                surveys: {
                    include: {
                        responses: true
                    }
                }
            }
        });

        if (!campaign) throw new Error("Campaign not found");

        const survey = campaign.surveys[0]; // Assuming single survey per campaign for now
        if (!survey) throw new Error("No survey found for this campaign");

        const responses = survey.responses;
        if (responses.length === 0) throw new Error("No responses to analyze");

        // 2. Prepare Data for AI
        // Extract text answers only to save tokens
        const textAnswers = responses.map(r => {
            // Filter out empty or non-text answers if possible, but for now just dump raw
            return JSON.stringify(r.rawAnswers);
        }).join("\n");

        const businessContext = campaign.workspace.businessContext || "No specific business context provided.";
        const campaignGoal = campaign.description || "No specific campaign goal provided.";

        // 3. Construct Prompt
        const prompt = `
            You are an expert Data Analyst and Market Researcher.
            Analyze the following survey responses for a campaign.

            === CONTEXT ===
            Company/Business Context: "${businessContext}"
            Campaign Goal: "${campaignGoal}"
            Survey Title: "${survey.title}"

            === RESPONSES ===
            ${textAnswers.substring(0, 15000)} // Truncated to prevent token overflow

            === INSTRUCTIONS ===
            Generate a comprehensive insight report in JSON format.
            1. **Executive Summary**: A concise 2-3 sentence summary of the overall feedback.
            2. **Sentiment Analysis**: Determine the overall sentiment (Positive, Neutral, Negative) and provide a breakdown/reasoning.
            3. **Key Trends**: Identify the top 3 recurring themes or patterns.
            4. **Recommendations**: Provide 3 actionable steps the user should take based on this feedback, considering their business context.

            === OUTPUT FORMAT (JSON ONLY) ===
            {
                "summary": "string",
                "sentiment": {
                    "label": "Positive" | "Neutral" | "Negative",
                    "score": number (0-100),
                    "breakdown": "string"
                },
                "trends": [
                    { "title": "string", "description": "string" }
                ],
                "recommendations": [
                    "string"
                ]
            }
        `;

        // 4. Call AI
        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 2000);

        // 5. Parse Result
        let insights;
        try {
            const cleanText = result.replace(/```json\n?|\n?```/g, '').trim();
            insights = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse AI insights:", result);
            throw new Error("Failed to generate valid insights");
        }

        // 6. Save to DB
        // Check if insights already exist for this campaign to avoid duplicates or just create new
        // For MVP, let's just create a new record
        const savedInsight = await prisma.aIInsight.create({
            data: {
                campaignId: campaign.id,
                surveyId: survey.id,
                insightType: "SUMMARY", // Using SUMMARY as a catch-all for the composite object
                content: insights,
                modelUsed: "gpt-4o-mini"
            }
        });

        return savedInsight;
    }

    /**
     * Retrieves the latest insights for a campaign.
     * @param {string} campaignId 
     */
    async getInsights(campaignId) {
        return await prisma.aIInsight.findFirst({
            where: { campaignId },
            orderBy: { createdAt: 'desc' }
        });
    }
}

module.exports = new InsightService();
