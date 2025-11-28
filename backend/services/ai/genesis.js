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

        const result = await openRouter.complete(prompt, "openai/gpt-4o-mini", true);
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

        const instruction = `Find top 5 direct competitors for ${contextSummary.companyName} in the ${contextSummary.industry} industry. Return a list of names.`;

        // Trigger Manus Agent
        // Note: In a real async flow, we'd kick this off and poll later. 
        // For MVP, we might skip or mock this if it takes too long.
        const task = await manus.createTask(instruction);

        // For now, return existing or empty to not block
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

        const result = await openRouter.complete(prompt, "openai/gpt-4o", true);
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

        const result = await openRouter.complete(prompt, "openai/gpt-4o", true);
        return JSON.parse(result);
    }
}

module.exports = new GenesisAgent();
