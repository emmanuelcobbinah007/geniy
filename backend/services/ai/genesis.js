const openRouter = require('./openrouter');
const manus = require('./manus');

class GenesisAgent {
    /**
     * Step 0: Chat & Intent Analysis
     * Converses with the user to gather requirements or decides to generate.
     */
    async chat(message, currentContext = "") {
        const prompt = `
        You are Geniy, an expert AI Survey Consultant. Your goal is to help the user define the perfect survey campaign.
        
        Current Context: "${currentContext}"
        User Message: "${message}"

        Instructions:
        1. Analyze the user's request.
        2. If the user provides enough information (e.g., "I want a survey for my coffee shop targeting students"), decide to GENERATE.
        3. If the request is vague (e.g., "Hi", "I need a survey"), ask a clarifying question to gather more context (e.g., "What is your business?", "Who is your target audience?").
        4. Be friendly, professional, and concise.

        Output JSON Schema:
        {
            "message": "string", // Your response to the user
            "action": "CHAT" | "GENERATE", // CHAT to keep talking, GENERATE to start building
            "updatedContext": "string" // The accumulated context including new info
        }
        `;

        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 1000);
        return this.safeParse(result);
    }

    /**
     * Step 1: Analyze Context
     * Extracts key entities from the raw BCD text.
     */
    async analyzeContext(rawText) {
        const prompt = `
      Analyze the following business context and extract key information into a JSON object.
      
      Context:
      "${rawText.substring(0, 8000)}" // Truncate to avoid token limits if necessary

      Output JSON Schema:
      {
        "companyName": "string",
        "industry": "string",
        "targetAudience": ["string"],
        "valueProposition": "string",
        "competitors": ["string"] // List any mentioned competitors
      }
    `;

        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 1000);
        return this.safeParse(result);
    }

    /**
     * Step 2: Discover Competitors (Agentic)
     * Uses Manus to find competitors if none are known.
     */
    async discoverCompetitors(contextSummary) {
        if (contextSummary.competitors && contextSummary.competitors.length >= 3) {
            return contextSummary.competitors;
        }

        const instruction = `Find top 5 direct competitors for ${contextSummary.companyName} in the ${contextSummary.industry} industry. Return ONLY a JSON array of strings, e.g. ["Comp1", "Comp2"].`;

        // Trigger Manus Agent
        try {
            const agentOutput = await manus.runTask(instruction);
            if (agentOutput) {
                // Try to parse JSON from output
                try {
                    // Extract JSON if wrapped in code blocks
                    const jsonMatch = agentOutput.match(/\[.*\]/s);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    return JSON.parse(agentOutput);
                } catch (e) {
                    console.warn("Failed to parse Manus output as JSON, returning raw list", e);
                    // Fallback: split by newlines if it looks like a list
                    return agentOutput.split('\n').filter(line => line.trim().length > 0).map(l => l.replace(/^- /, '').trim());
                }
            }
        } catch (err) {
            console.error("Manus discovery failed:", err);
        }

        // Fallback to existing or empty
        return contextSummary.competitors || [];
    }

    /**
     * Step 3: Generate Strategy
     * Creates the "Starter Docs" (Research Plan).
     */
    /**
     * Helper to clean and parse JSON
     */
    safeParse(text) {
        try {
            // Remove markdown code blocks if present
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Failed. Raw text:", text);
            throw e;
        }
    }

    /**
     * Step 3: Generate Strategy
     * Creates the "Starter Docs" (Research Plan).
     */
    async generateStrategy(contextSummary) {
        const prompt = `
      Based on the following business context, generate a research strategy for a survey campaign.

      Context: ${JSON.stringify(contextSummary)}

      Output JSON Schema:
      {
        "objectives": ["string"],
        "hypotheses": ["string"],
        "targetDemographics": ["string"],
        "keyMetrics": ["string"],
        "suggestedChannels": ["string"]
      }
    `;

        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 2500);
        return this.safeParse(result);
    }

    /**
     * Step 4: Generate Survey
     * Creates the questions.json based on the strategy.
     */
    async generateSurvey(contextSummary, strategy, userInstruction = "") {
        const prompt = `
      Create a branching survey based on the following context and strategy.
      
      Context: ${JSON.stringify(contextSummary)}
      Strategy: ${JSON.stringify(strategy)}
      
      ${userInstruction ? `**USER INSTRUCTION:** ${userInstruction}\n(You MUST prioritize this instruction, e.g., if it asks for a specific number of questions or a specific topic, follow it strictly.)` : ""}

      **ANTI-PATTERNS TO AVOID (Based on User Feedback):**
      1. **Too Long/Complex:** Keep questions short and simple. Avoid cognitive overload.
      2. **Irrelevant Questions:** Ensure every question directly relates to the strategy and context. Don't ask for the sake of asking.
      3. **Poor Design:** Use simple, engaging language. Avoid corporate jargon.
      4. **Lack of Action:** Ensure questions lead to actionable insights.
      5. **Too Frequent:** Make the survey feel high-value and respectful of the user's time (e.g., "We value your quick feedback").

      **CRITICAL RULES FOR BRANCHING:**
      1. Use "Q1", "Q2", etc. as keys and references.
      2. **Merging Branches:** If Question 1 branches to Q2 and Q3, and you want them to merge back at Q4, you MUST set "next": "Q4" for BOTH Q2 and Q3 (or whichever is the last question in that branch).
      3. **Skip Logic:** If a question should skip the next one (e.g. Q2 -> Q4), set "next": "Q4".
      4. **Format:** "next" and "branches[].next" MUST be in the format "Q#" (e.g., "Q2", "Q5") or "END".

      Output must strictly follow this JSON schema:
      {
          "title": "string",
          "version": "1.0",
          "start": "Q1",
          "questions": {
              "Q1": {
                  "type": "multiple_choice | text | ranking | rating",
                  "question": "string",
                  "options": ["string"], // Required for multiple_choice/ranking
                  "branches": [
                      { "if": "Option String", "next": "Q#" }
                  ],
                  "next": "Q#" // Default next question. Use this for merging branches!
          }
      }
    `;

        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 4000);
        return this.safeParse(result);
    }

    /**
     * Step 6: Analyze Competitor (Deep Dive)
     * Uses Manus to get detailed intel.
     */
    async analyzeCompetitor(competitorName, industry) {
        const instruction = `
            Analyze the company "${competitorName}" in the "${industry}" industry.
            Provide a detailed report in JSON format with the following fields:
        - pricingModel: string(e.g. "Freemium", "Enterprise", "Tiered: $10-$50")
            - keyFeatures: array of strings
                - targetAudience: string
                    - strengths: array of strings(SWOT)
                        - weaknesses: array of strings(SWOT)
                            - uniqueSellingPoint: string
            
            Return ONLY valid JSON.
        `;

        try {
            const agentOutput = await manus.runTask(instruction);
            if (agentOutput) {
                // Try to parse JSON from output
                try {
                    const jsonMatch = agentOutput.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                    return JSON.parse(agentOutput);
                } catch (e) {
                    console.warn("Failed to parse Manus output as JSON for competitor analysis", e);
                    return { error: "Failed to parse analysis results", raw: agentOutput };
                }
            }
        } catch (err) {
            console.error("Manus analysis failed:", err);
        }
        return null;
    }

    /**
     * Step 7: Generate Theme (AI Design)
     * Creates a color palette and font selection based on a vibe/prompt.
     */
    async generateTheme(prompt) {
        const instruction = `
            Create a UI theme based on this description: "${prompt}".
            Return a JSON object with:
            - primaryColor: hex code (e.g. #6366f1)
            - backgroundColor: hex code (e.g. #ffffff)
            - textColor: hex code (e.g. #18181b)
            - accentColor: hex code
            - fontFamily: string (one of: "Inter", "Playfair Display", "Roboto Mono", "Comic Sans MS")
            - borderRadius: string (e.g. "0.5rem", "1rem", "0px")
            
            Return ONLY valid JSON.
        `;

        const result = await openRouter.complete(instruction, "openai/gpt-4o-mini", true, 1000);
        return this.safeParse(result);
    }

    /**
     * Step 5: Chat with Context
     * Interactive chat with the business context.
     */
    async chatWithContext(context, messages) {
        // Format messages for the prompt
        // Assuming messages is an array of { role: "user"|"assistant", content: "..." }
        const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content} `).join('\n');

        const prompt = `
      You are Geniy, an expert AI market research consultant.
      You have access to the following Business Context for the user's project:

    === BUSINESS CONTEXT ===
        ${context}
      ========================

    Your goal is to help the user refine their strategy, understand their competitors, or brainstorm survey questions.
      
      ** Tone & Style Guidelines:**
      - ** Be Concise & Adaptive:** Keep answers brief and punchy.Only go deep if the topic is complex or explicitly asked.
      - ** Be Hyper - Specific:** Never give generic advice(e.g., "use social media").Instead, use the specific ** Target Audience ** and ** Industry ** from the context to suggest exact channels(e.g., "Since you target software engineers, try Hacker News or r/programming" instead of "forums").
      - ** No Fluff:** Cut the preamble.Start with your best idea.
      - ** Conversational:** Write like a smart colleague, not a textbook.

      Conversation History:
      ${conversationHistory}

ASSISTANT:
`;

        // Use a smart model for chat
        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", false, 500);
        return result;
    }
}

module.exports = new GenesisAgent();
