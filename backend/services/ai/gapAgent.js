const openRouter = require('./openrouter');
const genesis = require('./genesis'); // Reuse safeParse

class GapAgent {
    /**
     * Analyze the current context and identify missing information.
     */
    async analyze(contextText, fileNames = []) {
        // Short-circuit if context is empty to prevent AI hallucinations (e.g. "UrbanNest")
        if (!contextText || contextText.trim().length < 10) {
            return {
                completenessScore: 0,
                missingDimensions: ["Business Context", "Target Audience", "Value Proposition", "Competitors", "Goals"],
                recommendations: [
                    "Start by entering your business context in the settings.",
                    "Upload any existing strategy documents or pitch decks."
                ],
                summary: "No knowledge base detected. Please provide context to get started."
            };
        }

        const prompt = `
            You are an expert Business Consultant. Your job is to audit the "Knowledge Base" of a startup to see if we have enough info to build a perfect marketing strategy and survey.
            
            Current Knowledge Base:
            "${contextText.substring(0, 10000)}"
            
            Uploaded Files: ${fileNames.join(', ')}

            **Goal:** Determine what is MISSING.
            
            **Dimensions to Check:**
            1. **Value Proposition:** (Look for: "Value Prop", "USP", "Why us", or descriptions of benefits).
            2. **Target Audience:** (Look for: "Audience", "Persona", "Target", or specific demographics).
            3. **Pricing/Business Model:** (Look for: "Model", "Pricing", "Revenue", "SaaS", "Freemium").
            4. **Competitors:** (Look for: "Competitors", "Alternatives", or list of companies).
            5. **Goals:** (Look for: "Goals", "Objectives", "KPIs", "Aim").

            **Evaluation Rules:**
            - If the text contains a section for the dimension (e.g. "Value Proposition: Speed"), count it as **PRESENT** (do not list in missingDimensions).
            - Only list it in "missingDimensions" if it is **COMPLETELY ABSENT** or explicitly marked as "Unknown".
            - Be lenient. Short descriptions are fine.

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
