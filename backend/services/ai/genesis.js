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
    async analyzeContext(rawText, recommendations = []) {
        let focusInstruction = "";
        if (recommendations && recommendations.length > 0) {
            focusInstruction = `
            **FOCUS AREAS (Based on previous analysis):**
            The user has been advised to:
            ${recommendations.map(r => `- ${r}`).join('\n')}
            
            **INSTRUCTION:** Pay EXTRA attention to inferring details related to these recommendations. If the context is vague, make a reasonable professional inference for these specific areas.
             `;
        }

        const prompt = `
      Analyze the following business context and extract key information into a JSON object.
      
      Context:
      "${rawText.substring(0, 8000)}" 
      
      ${focusInstruction}

      **CRITICAL INSTRUCTION:**
      Determine if this is a **BUSINESS** context (a specific company/product) or a **GENERAL RESEARCH** context (a topic/question).
      
      - **If BUSINESS:** Extract Company Name, Industry, Value Prop. Infer missing business goals.
      - **If GENERAL:** Set "contextType" to "GENERAL". "companyName" can be "General Research". Focus on the "Topic" as the Industry.

      Output JSON Schema:
      {
        "contextType": "BUSINESS" | "GENERAL",
        "companyName": "string", // or "General Research" if general
        "industry": "string", // Topic or Industry
        "targetAudience": ["string"],
        "valueProposition": "string", // Value of the product OR importance of the topic
        "goals": ["string"], 
        "businessModel": "string", // or "N/A" if general
        "competitors": ["string"] // List competitors OR key entities/sub-topics
      }
    `;

        return this.completeWithRetry(prompt, "openai/gpt-4o-mini", true, 1000);
    }

    /**
     * Helper to perform real-time web research using Perplexity via OpenRouter.
     * Uses: perplexity/llama-3.1-sonar-large-128k-online
     */
    async research(prompt) {
        // We use a specific system prompt for the researcher to ensure concise, factual results.
        const researchPrompt = `
        You are a high-speed market research assistant with real-time web access.
        
        Task: ${prompt}
        
        CRITICAL INSTRUCTIONS:
        1. Search the live web for the most current data.
        2. Citations are helpful but prioritize the direct answer.
        3. Be concise and structured.
        4. If you cannot find specific data, infer based on reasonable industry standards but mark it as "Estimated".
        `;

        // Using prompt-only completions often works better for "search" style queries with Sonar
        // But OpenRouter standard is chat.
        return this.completeWithRetry(researchPrompt, "perplexity/sonar-reasoning", false, 1500);
    }

    /**
     * Step 2: Discover Competitors (Hybrid: Perplexity -> Manus)
     * Uses Perplexity for fast discovery.
     */
    async discoverCompetitors(contextSummary) {
        if (contextSummary.competitors && contextSummary.competitors.length >= 3) {
            return contextSummary.competitors;
        }

        const instruction = `
            Find the top 5 direct competitors for:
            Company: "${contextSummary.companyName}"
            Industry: "${contextSummary.industry}"
            Value Prop: "${contextSummary.valueProposition || "Unknown"}"
            
            Return ONLY a raw JSON array of strings. Example: ["Competitor A", "Competitor B"]
        `;

        try {
            console.log("🔍 Researching competitors with Perplexity...");
            const agentOutput = await this.research(instruction);

            if (agentOutput) {
                // Try to parse JSON from the extracted text
                try {
                    let finalResult = null;
                    // Extract JSON if wrapped in code blocks
                    const jsonMatch = agentOutput.match(/\[.*\]/s);
                    if (jsonMatch) {
                        finalResult = JSON.parse(jsonMatch[0]);
                    } else {
                        finalResult = JSON.parse(agentOutput);
                    }

                    // Validate: Must be array of strings
                    if (Array.isArray(finalResult) && finalResult.length > 0) {
                        console.log("✅ Perplexity found competitors:", finalResult);
                        return finalResult;
                    }
                } catch (e) {
                    // console.warn("Failed to parse Perplexity output as JSON", e);
                }

                // Fallback: split by newlines if it looks like a list
                if (typeof agentOutput === 'string') {
                    return agentOutput.split('\n')
                        .filter(line => line.trim().length > 0)
                        .map(l => l.replace(/^- /, '').replace(/^\d+\.\s*/, '').replace(/"/g, '').replace(/,$/, '').trim()) // Remove bullets, numbers, quotes
                        .filter(l => l.length > 0 && !l.startsWith('[') && !l.startsWith(']'));
                }
            }
        } catch (err) {
            console.error("Perplexity discovery failed:", err);
        }

        // Fallback to existing logic (Manus) if Perplexity completely fails to return valid data? 
        // Or just return empty array to let the UI prompt user.
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
                if (jsonMode) {
                    return this.safeParse(result);
                }
                return result;
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
      4. **FACTUALITY CHECK:** If the input context does not mention a specific budget, timeline, or constraint, DO NOT INVENT ONE. Use "To be determined" or generalized assumptions marked as such.
         - *Example:* Do not say "Targeting users with $100k+ income" if the context only said "Affluent users". Say "High-income individuals (Income TBD)".

      Output JSON Schema:
      {
        "objectives": ["string"],
        "hypotheses": ["string"],
        "targetDemographics": ["string"],
        "keyMetrics": ["string"],
        "suggestedChannels": ["string"]
      }
    `;

        return this.completeWithRetry(prompt, "openai/gpt-4o", true, 2500);
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
      2. **Hyper-Specific Context:** You are NOT a general researcher. You are a specialist in the "${contextSummary.industry}" industry.
         - **RULE:** Every single question must contain at least one specific keyword related to "${contextSummary.companyName}" or "${contextSummary.valueProposition}".
         - If the company sells "Organic Coffee", you must use words like "Roast", "Bean", "Brew", "Morning Routine".
         - **BAN:** Do NOT ask generic questions like "How likely are you to recommend us?" without tying it to the specific product value.
      3. **Engaging:** People hate surveys. Make this one feel like a chat.

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
    async analyzeCompetitor(competitorName, industry, goal = "") {
        let instruction = "";
        const lowerGoal = goal.toLowerCase();

        // --- SPECIALIZED PROMPTS (FINE-TUNING) ---

        if (lowerGoal.includes('pric') || lowerGoal.includes('cost') || lowerGoal.includes('subscription')) {
            // STRATEGY: PRICING HUNTER
            instruction = `
            ACT AS: A Competitor Pricing Analyst.
            TASK: Find the EXACT pricing model for "${competitorName}" (${industry}).
            
            **EXECUTION STEPS:**
            1.  Navigate directly to their Pricing page (usually /pricing).
            2.  If hidden, look for "FAQ" or "Support" pages mentioning costs.
            3.  Extract: Free Tier limits, Pro Plan cost, Enterprise triggers.
            
            **OUTPUT JSON (Strict):**
            {
                "pricingModel": "Detailed breakdown of tiers and costs",
                "uniqueSellingPoint": "What is their 'value metric'? (e.g. per user, per GB)",
                "strengths": ["List standard pricing features"],
                "weaknesses": ["Hidden fees, rigid contracts, expensive add-ons"]
            }
            `;
        } else if (lowerGoal.includes('review') || lowerGoal.includes('sentiment') || lowerGoal.includes('hate') || lowerGoal.includes('love')) {
            // STRATEGY: SENTIMENT ANALYST
            instruction = `
            ACT AS: A UX Researcher.
            TASK: Find what real users think about "${competitorName}".
            
            **EXECUTION STEPS:**
            1.  Ignore their landing page.
            2.  Search Reddit, G2, Capterra, and Twitter for "${competitorName} reviews".
            3.  Synthesize the "Emotional Sentiment".
            
            **OUTPUT JSON (Strict):**
            {
                "customerSentiment": "Summary of user vibes (Angry? Delighted? Frustrated?)",
                "strengths": ["Top 3 things users praise"],
                "weaknesses": ["Top 3 complaints (e.g. 'Bad support', 'Buggy mobile app')"],
                "keyFeatures": ["Features users mention most"]
            }
            `;
        } else {
            // STRATEGY: GENERAL DEEP DIVE (Default)
            instruction = `
            Perform a deep-dive market analysis on "${competitorName}" in the "${industry}" sector.
            
            ${goal ? `**FOCUS GOAL:** The user specifically wants to: "${goal}". Prioritize finding this info.` : ""}

            I need a structured report focusing on actionable intelligence.
            
            Return a JSON object with the following fields:
            - pricingModel: string
            - keyFeatures: array of strings
            - targetAudience: string
            - marketingChannels: array of strings
            - customerSentiment: string
            - strengths: array of strings (SWOT)
            - weaknesses: array of strings (SWOT)
            - uniqueSellingPoint: string
            `;
        }

        instruction += `
            CRITICAL INSTRUCTIONS:
            1. OUTPUT THE JSON DIRECTLY IN THE CHAT.
            2. DO NOT CREATE A FILE.
            3. DO NOT INCLUDE CONVERSATIONAL FILLER.
            4. START AND END WITH BRACES { }.
        `;

        // Kept MANUS here for deep dives per hybrid plan
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
        // 1. Research Current Trends using Perplexity
        let marketTrends = "";
        try {
            console.log("🔍 Researching market gaps/trends with Perplexity...");
            const trendsPrompt = `
                What are the current emerging trends and customer complaints in the "${contextSummary.industry}" industry right now?
                Focus on:
                - Unmet customer needs.
                - New technologies or delivery methods.
                - Features customers are asking for.
            `;
            marketTrends = await this.research(trendsPrompt);
        } catch (err) {
            console.warn("Market trends research failed:", err);
            marketTrends = "Unable to fetch live trends.";
        }

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

            === LIVE MARKET TRENDS (Real-time data) ===
            ${marketTrends}

            Identify:
            1. 3 Market Gaps (Needs that competitors are ignoring, especially based on the live trends).
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
        You are Geniy, an expert market researcher and successful business co-founder. 
        Your goal is to help the user build a solid business strategy by being direct, insightful, and proactive.
        You are NOT just a passive assistant. You are a partner.

        === KNOWLEDGE BASE (SOURCE OF TRUTH) ===
        ${context}
        ========================================

        ** CORE INSTRUCTIONS:**
        1. **Context is King:** ALWAYS answer based on the KNOWLEDGE BASE first.
        2. **Be Honest:** If the answer isn't there, say: "I don't see that in our data yet. Can you tell me more about...?"
        3. **Cofounder Persona (CRITICAL):**
           - **Be Relatable & Human:** Write like a smart, friendly business partner. Use natural language, not robotic lists.
           - **Socratic Probing:** If the user's idea is vague (e.g., "I want to sell shoes"), DO NOT just accept it. Ask probing questions: "That's a crowded market. Who specifically are you targeting? High-end collectors or budget runners?"
           - **Challenge Gently:** If an assumption looks risky, point it out. "I love the ambition, but have we validated that people will pay $50 for this?"
           - **Be Proactive:** Don't wait for questions. Suggest the next logical step. "Since we have the competitors, should we look at their pricing?"
        4. **Formatting:** Use Markdown. Use DOUBLE NEWLINES between paragraphs.
        5. **Memory Trigger:** If the user provides NEW information, acknowledge it so it can be saved.
        6. **Agentic Actions:** You can trigger background research tasks.
            - **CRITICAL:** Before triggering "ANALYZE_COMPETITOR", CHECK THE KNOWLEDGE BASE.
            - If already analyzed, use existing data.
            - ONLY trigger "ANALYZE_COMPETITOR" if new or explicitly requested.
            - Valid actions: "ANALYZE_COMPETITOR" (requires "actionTarget").
            - When triggering, confirm with the user: "On it! I'm starting the deep dive on [Target]."

        Output JSON Schema:
        {
            "message": "string",
            "memory": "string | null", 
            "action": "CHAT" | "ANALYZE_COMPETITOR",
            "actionTarget": "string | null",
            "actionGoal": "string | null" // e.g. "Find pricing model", "Check feature list"
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
      You are Geniy, an expert market research co-founder helping a user definition their survey campaign.
      
      === BUSINESS CONTEXT ===
      ${context}
      ========================

      Your goal is to help the user refine their strategy.
      
      **Tone & Style Guidelines:**
      - **Persona:** You are a savvy, successful co-founder. Direct, meaningful, and slightly casual.
      - **Socratic Logic:** If the context is empty or vague, DO NOT generate a generic outcome. Ask questions!
        - "I see we're targeting 'everyone'. That's usually a mistake. Can we narrow it down to a specific niche first?"
      - **Be Hyper-Specific:** Use the provided Industry and Audience in your examples.
      - **No Fluff:** Start with the insight.

      **Actions:**
      - If the user asks to analyze a competitor, set "action" to "ANALYZE_COMPETITOR".
      - **STRICT CONFIRMATION REQUIRED:** 
        - **NEVER** generate the survey immediately unless the strategy is crystal clear.
        - Summary: "I think we have a solid angle now: [Summary]. Ready to build the survey?"
        - ONLY set "action" to "GENERATE" if the user explicitly confirms (e.g., "Yes", "Go ahead").
      - Otherwise, set "action" to "CHAT".

      Output JSON Schema:
      {
          "message": "string",
          "action": "CHAT" | "GENERATE" | "ANALYZE_COMPETITOR",
          "updatedContext": "string",
          "competitorName": "string"
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
