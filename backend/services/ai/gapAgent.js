const openRouter = require('./openrouter');
const genesis = require('./genesis'); // Reuse safeParse

class GapAgent {
    /**
     * Analyze the current context and identify missing information.
     */
    async analyze(contextText, fileNames = []) {
        const prompt = `
            You are an expert Business Consultant. Your job is to audit the "Knowledge Base" of a startup to see if we have enough info to build a perfect marketing strategy and survey.

            Current Knowledge Base:
            "${contextText.substring(0, 10000)}"
            
            Uploaded Files: ${fileNames.join(', ')}

            **Goal:** Determine what is MISSING.
            
            **Dimensions to Check:**
            1. **Value Proposition:** Do we clearly know what they sell and why it's unique?
            2. **Target Audience:** Do we have specific personas (not just "everyone")?
            3. **Pricing/Business Model:** Do we know how they make money?
            4. **Competitors:** Do we know who they are fighting against?
            5. **Goals:** Do we know what they want to achieve with this survey?

            Output JSON Schema:
            {
                "completenessScore": number, // 0-100
                "missingDimensions": ["string"], // e.g. ["Pricing", "Competitors"]
                "recommendations": ["string"], // Specific actions, e.g. "Upload your pricing page PDF."
                "summary": "string" // Brief status report
            }
        `;

        try {
            const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 1500);
            return genesis.safeParse(result);
        } catch (error) {
            console.error("Gap Analysis Failed:", error);
            return {
                completenessScore: 50,
                missingDimensions: ["Error analyzing context"],
                recommendations: ["Try uploading more documents."],
                summary: "Could not analyze context at this time."
            };
        }
    }
}

module.exports = new GapAgent();
