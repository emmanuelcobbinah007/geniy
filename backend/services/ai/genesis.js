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
                    let parsedOutput = null;
                    if (typeof agentOutput === 'string') {
                        parsedOutput = JSON.parse(agentOutput);
                    } else {
                        parsedOutput = agentOutput;
                    }

                    if (Array.isArray(parsedOutput)) {
                        // Find last assistant message
                        // Use slice().reverse() to avoid mutating the original array
                        const lastAssistantMsg = parsedOutput.slice().reverse().find(m => m.role === 'assistant');

                        if (lastAssistantMsg) {
                            // Check for content array (Anthropic style)
                            if (Array.isArray(lastAssistantMsg.content)) {
                                const textPart = lastAssistantMsg.content.find(c => c.type === 'text' || c.type === 'output_text');
                                if (textPart && textPart.text) {
                                    textToParse = textPart.text;
                                }
                            }
                            // Check for simple content string (OpenAI style)
                            else if (typeof lastAssistantMsg.content === 'string') {
                                textToParse = lastAssistantMsg.content;
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
                    }
                } catch (e) {
                    // console.warn("Failed to parse Manus output as JSON, returning raw list", e);
                }

                // Fallback: split by newlines if it looks like a list and is NOT the message object
                // Ensure textToParse is a string and doesn't look like the message array
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

      **CRITICAL INSTRUCTIONS:**
      1. **BE SPECIFIC:** Do NOT generalize the target audience. If the context says "18-30 year old Ghanaians", do NOT say "18-65 year olds". Use the EXACT demographics provided.
      2. **BE RELEVANT:** Ensure the objectives and hypotheses are directly tied to the specific industry and value proposition mentioned.
      3. **NO FLUFF:** Keep the output concise and actionable.

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

      Output JSON Schema:
      {
          "title": "string",
          "description": "string",
          "questions": {
              "Q1": {
                  "type": "multiple_choice" | "text" | "rating",
                  "question": "string",
                  "options": ["string"], // Only for multiple_choice
                  "required": boolean,
                  "branches": [
                      { "if": "string", "next": "Q#" }
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
            
            CRITICAL INSTRUCTIONS:
            1. OUTPUT THE JSON DIRECTLY IN THE CHAT.
            2. DO NOT CREATE A FILE.
            3. DO NOT INCLUDE CONVERSATIONAL FILLER (e.g., "Here is the report").
            4. START AND END WITH BRACES { }.
        `;

        try {
            const agentOutput = await manus.runTask(instruction);
            if (agentOutput) {
                let textToParse = agentOutput;

                // Handle structured output (Array of messages)
                try {
                    let parsedOutput = null;
                    if (typeof agentOutput === 'string') {
                        parsedOutput = JSON.parse(agentOutput);
                    } else {
                        parsedOutput = agentOutput;
                    }

                    if (Array.isArray(parsedOutput)) {
                        // Find last assistant message
                        const lastAssistantMsg = parsedOutput.slice().reverse().find(m => m.role === 'assistant');

                        if (lastAssistantMsg) {
                            if (Array.isArray(lastAssistantMsg.content)) {
                                const textPart = lastAssistantMsg.content.find(c => c.type === 'text' || c.type === 'output_text');
                                if (textPart && textPart.text) {
                                    textToParse = textPart.text;
                                }
                            } else if (typeof lastAssistantMsg.content === 'string') {
                                textToParse = lastAssistantMsg.content;
                            }
                        }
                    }
                } catch (e) {
                    // Not JSON or not the structure we expect, treat as raw string
                }

                // Try to parse JSON from output
                try {
                    // 1. Try to extract JSON block using regex
                    const jsonMatch = textToParse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }

                    // 2. Try to clean markdown and parse
                    const cleanText = textToParse.replace(/```json\n?|\n?```/g, '').trim();
                    return JSON.parse(cleanText);
                } catch (e) {
                    console.warn("Failed to parse Manus output as JSON for competitor analysis", e);

                    // 3. Fallback: Return a valid object with the raw text
                    // This prevents the frontend from crashing and shows the info to the user
                    return {
                        pricingModel: "See detailed analysis in strengths",
                        keyFeatures: ["See detailed analysis in strengths"],
                        targetAudience: "See detailed analysis in strengths",
                        marketingChannels: ["See detailed analysis in strengths"],
                        customerSentiment: "See detailed analysis in strengths",
                        strengths: [textToParse], // Dump the raw text here so it is visible
                        weaknesses: ["See detailed analysis in strengths"],
                        uniqueSellingPoint: "See detailed analysis in strengths"
                    };
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
            You are an expert analyst.Summarize the following document into key actionable insights for a business context.
            
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
     * Step 9: Gap Analysis
     * Compares user context with competitors to find gaps and opportunities.
     */
    async generateGapAnalysis(contextSummary, competitors) {
        const competitorAnalysisText = competitors.map(c => {
            if (c.analysis) {
                return `Competitor: ${c.name}\nAnalysis: ${JSON.stringify(c.analysis)}`;
            }
            return `Competitor: ${c.name} (No detailed analysis available)`;
        }).join('\n\n');

        const prompt = `
            Perform a Strategic Gap Analysis for the following business.

            === OUR BUSINESS ===
            ${JSON.stringify(contextSummary)}

            === COMPETITORS ===
            ${competitorAnalysisText}

            Identify:
            1. 3 Market Gaps (Needs that competitors are ignoring).
            2. 3 Strategic Opportunities (How we can win).
            3. 3 Specific Recommendations (Actionable steps).

            Output JSON Schema:
            {
                "gaps": [
                    { "title": "string", "description": "string" }
                ],
                "opportunities": [
                    { "title": "string", "description": "string" }
                ],
                "recommendations": ["string"]
            }
        `;

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 2000);
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

        === KNOWLEDGE BASE(SOURCE OF TRUTH) ===
                        ${context}
        ========================================

        ** CORE INSTRUCTIONS:**
                        1. ** Context is King:** ALWAYS answer based on the KNOWLEDGE BASE first.If the answer is there, use it.
        2. ** Be Honest:** If the answer is NOT in the Knowledge Base, say: "I don't see that in our current context, but generally speaking..." or "I don't have that info yet. You can add it by uploading a PDF or telling me directly!"
                    3. ** Teammate Persona:** Be friendly, professional, and proactive.Use emojis sparingly.
            - User: "Hi" -> You: "Hey there! Ready to dive into our strategy?"
                    4. ** Formatting:** Use Markdown. ** CRITICAL:** Use DOUBLE NEWLINES between paragraphs and list items to ensure they render correctly.
            - Bad: "Point 1\nPoint 2"
                        - Good: "Point 1\n\nPoint 2"
                    5. ** Memory Trigger:** If the user provides NEW information(e.g., "Competitor X is launching a new product"), acknowledge it and say: "Thanks, I'll make a note of that."(The system will handle the actual saving).
        6. ** Agentic Actions:** You can trigger background research tasks.
            - **CRITICAL:** Before triggering "ANALYZE_COMPETITOR", CHECK THE KNOWLEDGE BASE.
            - If the competitor is ALREADY listed in "KNOWN COMPETITORS" with analysis, DO NOT trigger the action. Just answer using the existing data.
            - ONLY trigger "ANALYZE_COMPETITOR" if:
                a) The competitor is NOT in the Knowledge Base.
                b) The user explicitly asks to "re-analyze" or "update" the data.
            - If the user asks to "analyze competitors", "deep dive", or "research" companies, set "action" to "ANALYZE_COMPETITOR".
            - If they want to analyze ALL discovered competitors, set "actionTarget" to "ALL".
            - If they want a specific one, set "actionTarget" to the competitor name.
            - When triggering an action, your "message" should confirm it: "On it! I'm starting the deep dive analysis for [Target]. Check the Competitor Intel tab in a few minutes."

        Output JSON Schema:
                    {
                        "message": "string",
                            "memory": "string | null", // If the user provided new info worth saving, put the summary here. Else null.
                                "action": "CHAT" | "ANALYZE_COMPETITOR",
                                    "actionTarget": "string | null" // "ALL" or specific name
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
                        - If the user asks to analyze a specific competitor(e.g., "Analyze Starbucks", "Check out Competitor X"), set "action" to "ANALYZE_COMPETITOR" and "competitorName" to the name.
      - ** STRICT CONFIRMATION REQUIRED:** 
        - ** NEVER ** generate the survey immediately.
        - Summarize what you know and ask for confirmation: "I have a clear picture of [Project Name]. Shall I generate the survey now?"
                        - ONLY set "action" to "GENERATE" if the user explicitly confirms(e.g., "Yes", "Go ahead").
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
