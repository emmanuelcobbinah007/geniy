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
        1. **Analyze the Request:** Does the user provide a clear **Business Goal** (what they do) and **Target Audience**?
        2. **Gather Context:** If the request is vague or brief, ask clarifying questions to understand their specific niche, features, or constraints.
        3. **Memory:** Pay close attention to specific names (e.g., product names like "ShopAurora", competitor names). Ensure these are captured in the "updatedContext".
        4. **Confirmation Required:** 
           - If you have enough information (Goal + Audience), you MUST ask the user for confirmation before generating.
           - Say something like: "I have a good understanding of [Project Name]. If I'm getting this right, you wantplan] Shall I go ahead and generate the survey now?"
           - ONLY set "action" to "GENERATE" if the user explicitly confirms (e.g., "Yes", "Go ahead", "Proceed").
           - If they haven't confirmed yet, set "action" to "CHAT".

        Output JSON Schema:
        {
            "message": "string", // Brief confirmation, clarifying question, or request for approval
            "action": "CHAT" | "GENERATE",
            "updatedContext": "string" // The accumulated context including new info and specific names
        }
        `;

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 1000);
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

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 1000);
    }

    /**
     * Step 2: Discover Competitors (Agentic)
     * Uses Manus to find competitors if none are known.
     */
    async discoverCompetitors(contextSummary) {
        if (contextSummary.competitors && contextSummary.competitors.length >= 3) {
            return contextSummary.competitors;
        }

        const instruction = `
            Research task: Identify top 5 direct competitors for "${contextSummary.companyName}" in the "${contextSummary.industry}" industry.
            Context: ${contextSummary.valueProposition || "Unknown value prop"}
            
            Criteria:
            - Must offer similar core features.
            - Must target a similar audience (${contextSummary.targetAudience?.join(', ') || "General"}).
            
            Return ONLY a JSON array of strings, e.g. ["Comp1", "Comp2"].
        `;

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
            throw new Error("Invalid JSON response from AI");
        }
    }

    /**
     * Helper to execute AI call with retry logic on JSON parse failure
     */
    async completeWithRetry(prompt, model, jsonMode, maxTokens, retries = 1) {
        for (let i = 0; i <= retries; i++) {
            try {
                const result = await openRouter.complete(prompt, model, jsonMode, maxTokens);
                return this.safeParse(result);
            } catch (error) {
                console.warn(`AI Attempt ${i + 1} failed:`, error.message);
                if (i === retries) {
                    throw error; // Throw on final attempt
                }
                // Optional: Add a small delay or modify prompt for retry
                await new Promise(r => setTimeout(r, 1000));
            }
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

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 2500);
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
      **CRITICAL RULES FOR BRANCHING:**
      1. **MANDATORY DIVERGENCE:** You MUST include at least 2 questions where different options lead to DIFFERENT questions (e.g., "If Yes, go to Q3; If No, go to Q4"). 
         - **FORBIDDEN:** Do NOT create "fake branching" where all options jump to the same next question (e.g., If A -> Q2, If B -> Q2). This is useless.
      2. Use "Q1", "Q2", etc. as keys and references.
      3. **Merging Branches:** If Question 1 branches to Q2 and Q3, and you want them to merge back at Q4, you MUST set "next": "Q4" for BOTH Q2 and Q3 (or whichever is the last question in that branch).
      4. **Skip Logic:** If a question should skip the next one (e.g. Q2 -> Q4), set "next": "Q4".
      5. **Format:** "next" and "branches[].next" MUST be in the format "Q#" (e.g., "Q2", "Q5") or "END".

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

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 4000);
    }

    /**
     * Step 6: Analyze Competitor (Deep Dive)
     * Uses Manus to get detailed intel.
     */
    async analyzeCompetitor(competitorName, industry) {
        const instruction = `
            Perform a deep-dive market analysis on "${competitorName}" in the "${industry}" sector.
            
            I need a structured report focusing on actionable intelligence.
            
            Return a JSON object with the following fields:
            - pricingModel: string (Detailed pricing strategy, e.g., "Freemium with aggressive upsell to Enterprise at $500/mo")
            - keyFeatures: array of strings (Top 3-5 distinct features)
            - targetAudience: string (Who are they really selling to?)
            - marketingChannels: array of strings (Where are they most active? e.g., "LinkedIn Ads", "SEO", "TikTok")
            - customerSentiment: string (What do users hate/love? e.g., "Users love the UI but hate the support")
            - strengths: array of strings (SWOT)
            - weaknesses: array of strings (SWOT)
            - uniqueSellingPoint: string (What is their "moat"?)
            
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

        return this.completeWithRetry(instruction, "openai/gpt-4o-mini", true, 1000);
    }

    /**
     * Step 5a: Chat with Brain (Context Q&A)
     * Dedicated method for the "Geniy's Brain" page.
     * Prioritizes context retrieval over survey generation.
     */
    async chatWithBrain(context, messages) {
        const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content} `).join('\n');

        const prompt = `
        You are Geniy's Brain, the central intelligence for this workspace.
        You have access to the following KNOWLEDGE BASE (Business Context, Documents, Live Campaign Data):

        === KNOWLEDGE BASE ===
        ${context}
        ======================

        Your goal is to answer the user's questions based STRICTLY on the provided KNOWLEDGE BASE.
        
        Instructions:
        1. **Be Context-Driven:** If the user asks "Who are our competitors?", list the EXACT competitors found in the context. Do NOT make up generic ones.
        2. **Be Specific:** Use the specific data points, numbers, and names from the context.
        3. **Live Data:** If the context contains "LIVE CAMPAIGN DATA", use it to answer questions about performance or responses.
        4. **Fallback:** If the answer is NOT in the context, you may use your general knowledge, but explicitly state: "Based on general market knowledge (since it's not in your context)..."
        5. **Tone:** Professional, analytical, and helpful.

        Output JSON Schema:
        {
            "message": "string"
        }

        Conversation History:
        ${conversationHistory}

        ASSISTANT:
        `;

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 1000);
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

      ** Actions:**
      - If the user asks to analyze a specific competitor (e.g., "Analyze Starbucks", "Check out Competitor X"), set "action" to "ANALYZE_COMPETITOR" and "competitorName" to the name.
      - **CONFIRMATION REQUIRED:** 
        - If the user provides a clear **Business Goal** and **Target Audience**, do NOT generate immediately.
        - Instead, summarize what you know and ask for confirmation: "I have a clear picture of [Project Name]. Shall I generate the survey now?"
        - ONLY set "action" to "GENERATE" if the user explicitly confirms (e.g., "Yes", "Go ahead").
      - Otherwise, set "action" to "CHAT".

      Output JSON Schema:
      {
        "message": "string",
        "action": "CHAT" | "GENERATE" | "ANALYZE_COMPETITOR",
        "updatedContext": "string",
        "competitorName": "string" // Only if action is ANALYZE_COMPETITOR
      }

      Conversation History:
      ${conversationHistory}

ASSISTANT:
`;

        // Use a smart model for chat
        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 2500);
    }
}

module.exports = new GenesisAgent();
