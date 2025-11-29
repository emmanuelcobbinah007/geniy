const openRouter = require('./openrouter');
const manus = require('./manus');

class GenesisAgent {
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
        return JSON.parse(result);
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

        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 1500);
        return JSON.parse(result);
    }

    /**
     * Step 4: Generate Survey
     * Creates the questions.json based on the strategy.
     */
    async generateSurvey(contextSummary, strategy) {
        const prompt = `
      Create a branching survey based on the following context and strategy.
      
      Context: ${JSON.stringify(contextSummary)}
      Strategy: ${JSON.stringify(strategy)}

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
                      { "if": "Option String", "next": "Q_Next" }
                  ],
                  "next": "Q_Default_Next"
              }
          }
      }
    `;

        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true, 2500);
        return JSON.parse(result);
    }

    /**
     * Step 5: Chat with Context
     * Interactive chat with the business context.
     */
    async chat(context, messages) {
        // Format messages for the prompt
        // Assuming messages is an array of { role: "user"|"assistant", content: "..." }
        const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const prompt = `
      You are Geniy, an expert AI market research consultant.
      You have access to the following Business Context for the user's project:
      
      === BUSINESS CONTEXT ===
      ${context}
      ========================

      Your goal is to help the user refine their strategy, understand their competitors, or brainstorm survey questions.
      
      **Tone & Style Guidelines:**
      - **Be Concise & Adaptive:** Keep answers brief and punchy. Only go deep if the topic is complex or explicitly asked.
      - **Be Hyper-Specific:** Never give generic advice (e.g., "use social media"). Instead, use the specific **Target Audience** and **Industry** from the context to suggest exact channels (e.g., "Since you target software engineers, try Hacker News or r/programming" instead of "forums").
      - **No Fluff:** Cut the preamble. Start with your best idea.
      - **Conversational:** Write like a smart colleague, not a textbook.

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
