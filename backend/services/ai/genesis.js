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

      **CRITICAL INSTRUCTION:**
      If the context does not explicitly state the company's goals or value proposition, you MUST **INFER** them based on the product description, industry, and typical business needs. Do not return "Unknown" unless absolutely impossible to guess.
      - Example: If it's a "drug kit delivery system", infer that speed, privacy, and reliability are key values.

      Output JSON Schema:
      {
        "companyName": "string",
        "industry": "string",
        "targetAudience": ["string"],
        "valueProposition": "string", // Infer if missing
        "goals": ["string"], // Infer if missing (e.g., "Increase user retention", "Validate pricing")
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
                let textToParse = agentOutput;

                // Handle structured output (Array of messages)
                try {
                    const parsedOutput = JSON.parse(agentOutput);
                    if (Array.isArray(parsedOutput) && parsedOutput.some(m => m.role && m.content)) {
                        // Find last assistant message
                        const lastAssistantMsg = parsedOutput.reverse().find(m => m.role === 'assistant');
                        if (lastAssistantMsg && Array.isArray(lastAssistantMsg.content)) {
                            // Extract text from content array
                            const textPart = lastAssistantMsg.content.find(c => c.type === 'text');
                            if (textPart) {
                                textToParse = textPart.text;
                            }
                        }
                    }
                } catch (e) {
                    // Not JSON or not the structure we expect, treat as raw string
                }

                // Try to parse JSON from the extracted text
                try {
                    let finalResult = null;
                    // Extract JSON if wrapped in code blocks
                    const jsonMatch = textToParse.match(/\[.*\]/s);
                    if (jsonMatch) {
                        finalResult = JSON.parse(jsonMatch[0]);
                    } else {
                        finalResult = JSON.parse(textToParse);
                    }

                    // Validate: Must be array of strings
                    if (Array.isArray(finalResult) && finalResult.every(i => typeof i === 'string')) {
                        return finalResult;
                    } else {
                        console.warn("Parsed Manus output is not an array of strings:", JSON.stringify(finalResult).substring(0, 200));
                        // If it looks like the message history, we failed to extract. Fallback to regex on the raw text if possible, or just fail.
                    }
                } catch (e) {
                    // console.warn("Failed to parse Manus output as JSON, returning raw list", e);
                }

                // Fallback: split by newlines if it looks like a list and is NOT the message object
                if (typeof textToParse === 'string' && !textToParse.trim().startsWith('[{"')) {
                    return textToParse.split('\n')
                        .filter(line => line.trim().length > 0)
                        .map(l => l.replace(/^- /, '').replace(/^\d+\.\s*/, '').trim()) // Remove bullets and numbers
                        .filter(l => l.length > 0);
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

      **TONE & STYLE GUIDELINES (CRITICAL):**
      1. **Conversational & Human:** Write like a friendly researcher, not a robot. Use "I" and "We".
         - BAD: "Rate your satisfaction with the delivery speed."
         - GOOD: "How was the delivery speed? Did it arrive when you expected?"
      2. **Engaging:** People hate surveys. Make this one feel like a chat.
      3. **Strict Relevance:** Every question MUST be directly related to the provided context. 
         - **DO NOT** ask generic market research questions (e.g., "What is your age?") unless specifically relevant to the product.
         - If the product is a "drug kit delivery", ask about privacy, speed, and packaging. Do NOT ask about "shopping habits" in general.

      **QUESTION RULES:**
      1. **Rating Scales:** ALWAYS use a **1-5 scale** (1=Low, 5=High). NEVER use 1-10.
      2. **Question Count:** 
         - **DEFAULT:** Generate **18-25 questions** unless the user explicitly asks for a different number.
         - If the user asks for a specific number (e.g., 10), follow it strictly.
      3. **Cognitive Load:** Keep options simple.

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
                  "question": "string", // Conversational phrasing
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
    /**
     * Step 8: Summarize Knowledge (for PDF/Context Injection)
     * Compresses raw text into actionable insights.
     */
    async summarizeKnowledge(rawText) {
        const prompt = `
            You are an expert analyst. Summarize the following document into key actionable insights for a business context.
            
            Document Content:
            "${rawText.substring(0, 15000)}" // Truncate to avoid massive token usage

            Goal: Extract the "Need to Know" information.
            - Key facts, figures, and dates.
            - Strategic goals or problems mentioned.
            - Competitor mentions.
            
            Output format:
            - Bullet points.
            - concise and dense.
        `;

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", false, 1000);
    }

    /**
     * Step 5a: Chat with Brain (Context Q&A)
     * Dedicated method for the "Geniy's Brain" page.
     * Prioritizes context retrieval over survey generation.
     */
    async chatWithBrain(context, messages) {
        const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content} `).join('\n');

        const prompt = `
        You are Geniy, a smart, enthusiastic teammate in this workspace. 
        Your job is to help the user navigate their business context, competitors, and campaign data.

        === KNOWLEDGE BASE (SOURCE OF TRUTH) ===
        ${context}
        ========================================

        **CORE INSTRUCTIONS:**
        1.  **Context is King:** ALWAYS answer based on the KNOWLEDGE BASE first. If the answer is there, use it.
        2.  **Be Honest:** If the answer is NOT in the Knowledge Base, say: "I don't see that in our current context, but generally speaking..." or "I don't have that info yet. You can add it by uploading a PDF or telling me directly!"
        3.  **Teammate Persona:** Be friendly, professional, and proactive. Use emojis sparingly.
            -   User: "Hi" -> You: "Hey there! Ready to dive into our strategy?"
        4.  **Memory Trigger:** If the user provides NEW information (e.g., "Competitor X is launching a new product"), acknowledge it and say: "Thanks, I'll make a note of that." (The system will handle the actual saving).

        Output JSON Schema:
        {
            "message": "string",
            "memory": "string | null" // If the user provided new info worth saving, put the summary here. Else null.
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
      - **STRICT CONFIRMATION REQUIRED:** 
        - **NEVER** generate the survey immediately.
        - Summarize what you know and ask for confirmation: "I have a clear picture of [Project Name]. Shall I generate the survey now?"
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
