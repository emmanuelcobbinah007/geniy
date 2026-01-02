const openRouter = require('./openrouter');
const manus = require('./manus');
const trainingLogger = require('../logging/trainingLogger');

// ============================================
// MODEL CONFIGURATION (Centralized)
// ============================================
const MODELS = {
    FAST: "openai/gpt-4o-mini",
    SMART: "openai/gpt-4o",
    RESEARCH: "perplexity/sonar-reasoning-pro",
    CREATIVE: "openai/gpt-4o-mini",
};

const TOKEN_LIMITS = {
    CHAT: 1500,
    ANALYSIS: 2000,
    STRATEGY: 3000,
    SURVEY: 4000,
    RESEARCH: 2000,
    VALIDATION: 2000,
};

class GenesisAgent {
    /**
     * Chat & Intent Analysis
     * Converses with the user to gather requirements or decides to generate.
     */
    async chat(messages, currentContext = "") {
        // Build conversation history from messages array
        const conversationHistory = Array.isArray(messages)
            ? messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
            : `USER: ${messages}`;

        const prompt = `
        You are Geniy, an expert AI Survey Consultant and Market Research Co-Founder. 
        Your goal is to help the user define the perfect survey campaign through natural conversation.
        
        === CURRENT CONTEXT ===
        ${currentContext || "No context provided yet."}
        =======================
        
        === CONVERSATION HISTORY ===
        ${conversationHistory}
        ============================
        
        **INSTRUCTIONS:**
        1. If the user is still exploring or providing information, engage conversationally and gather more details.
        2. If the user has provided enough context (company, audience, goals), summarize and ask if they're ready to generate.
        3. Only set action to "GENERATE" if the user explicitly confirms they want to create a survey (e.g., "yes", "go ahead", "create the survey").
        
        **CRITICAL RULES:**
        - **NEVER list survey questions in the chat.** Questions are generated separately by the system.
        - Do NOT show examples like "Question 1: ...", "Usage Frequency: ...", etc.
        - Keep responses conversational. Just discuss strategy, not the actual survey content.
        - When ready to generate, simply confirm and the system will create the survey automatically.
        
        **CONVERSATION STYLE:**
        - Be friendly and professional, like a smart business partner.
        - Ask probing questions if details are vague.
        - Acknowledge new information and build on it.
        - Focus on understanding: WHO is the audience, WHAT is the product, WHY are we surveying them.
        
        **CONTEXT ACCUMULATION:**
        The "updatedContext" must contain ALL important details from the conversation:
        - Company/Product name and description
        - Target audience demographics
        - Goals of the survey
        - Any specific questions or topics to explore
        - Key differentiators or value propositions mentioned
        
        Output JSON Schema:
        {
            "message": "string - Your conversational response (NO SURVEY QUESTIONS)",
            "action": "CHAT" | "GENERATE",
            "updatedContext": "string - Comprehensive accumulated context with ALL details from conversation"
        }
        `;

        return this.completeWithRetry(prompt, MODELS.FAST, true, TOKEN_LIMITS.CHAT);
    }

    /**
     * Analyze Context
     * Extracts key entities from the raw BCD text.
     */
    async analyzeContext(rawText, recommendations = [], missingDimensions = []) {
        let focusInstruction = "";
        if (recommendations && recommendations.length > 0) {
            focusInstruction = `
            **PRIORITY FOCUS AREAS:**
            The user has been advised to:
            ${recommendations.map(r => `- ${r}`).join('\n')}
            `;
        }

        if (missingDimensions && missingDimensions.length > 0) {
            focusInstruction += `
            **MISSING INTELLIGENCE (AUTO-FILL MODE):**
            The following sections are currently MISSING from the knowledge base:
            ${missingDimensions.map(d => `- ${d}`).join('\n')}

            **INSTRUCTION:** 
            For these SPECIFIC missing dimensions, if the explicit answer is not in the context, you MUST **PROPOSE A PROFESSIONAL SUGGESTION** based on the Industry and Company Name.
            - Do NOT leave them as "Unknown".
            - Do NOT make them generic. Use your knowledge of the industry to draft high-quality placeholders.
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
        "companyName": "string",
        "industry": "string",
        "targetAudience": ["string"],
        "valueProposition": "string",
        "goals": ["string"], 
        "businessModel": "string",
        "competitors": ["string"]
      }
    `;

        return this.completeWithRetry(prompt, MODELS.FAST, true, TOKEN_LIMITS.ANALYSIS);
    }

    /**
     * Perform real-time web research using Perplexity via OpenRouter.
     */
    async research(prompt) {
        const researchPrompt = `
        You are a high-speed market research assistant with real-time web access.
        
        Task: ${prompt}
        
        CRITICAL INSTRUCTIONS:
        1. Search the live web for the most current data.
        2. Citations are helpful but prioritize the direct answer.
        3. Be concise and structured.
        4. If you cannot find specific data, infer based on reasonable industry standards but mark it as "Estimated".
        `;

        return this.completeWithRetry(researchPrompt, MODELS.RESEARCH, false, TOKEN_LIMITS.RESEARCH);
    }

    /**
     * NEW FEATURE: Validate Business Idea
     * Checks if the business idea has been implemented before (directly or indirectly).
     * Returns existing solutions, failed attempts, and differentiation opportunities.
     */
    async validateBusinessIdea(contextSummary) {
        const prompt = `
        You are a seasoned startup analyst and venture capital researcher with real-time web access.
        
        TASK: Validate whether this business idea already exists in the market.
        
        === BUSINESS IDEA ===
        Company/Product: "${contextSummary.companyName}"
        Industry: "${contextSummary.industry}"
        Value Proposition: "${contextSummary.valueProposition}"
        Target Audience: ${JSON.stringify(contextSummary.targetAudience)}
        ====================
        
        RESEARCH OBJECTIVES:
        1. **Direct Competitors:** Find companies doing EXACTLY the same thing.
        2. **Indirect Solutions:** Find alternative ways people currently solve this problem.
        3. **Failed Attempts:** Search for startups that tried this and failed (look for shutdown notices, post-mortems).
        4. **Market Validation:** Assess if there's evidence of demand (search volume, social discussions).
        
        CRITICAL: Be brutally honest. If the idea is crowded, say so. If it's novel, explain why.
        
        Output JSON Schema:
        {
            "ideaStatus": "NOVEL" | "EXISTS" | "CROWDED" | "FAILED_BEFORE",
            "summary": "string - 2-3 sentence executive summary of findings",
            "directCompetitors": [
                { "name": "string", "description": "string", "differentiator": "string" }
            ],
            "indirectSolutions": ["string - How people currently solve this problem"],
            "failedAttempts": [
                { "name": "string", "reason": "string - Why it failed" }
            ],
            "marketSignals": {
                "demandLevel": "HIGH" | "MEDIUM" | "LOW",
                "evidence": "string - What indicates demand exists"
            },
            "differentiationOpportunities": ["string - Ways to stand out"]
        }
        `;

        try {
            console.log("[Genesis] Validating business idea...");
            const result = await this.completeWithRetry(prompt, MODELS.RESEARCH, true, TOKEN_LIMITS.VALIDATION);
            console.log("[Genesis] Business idea validation complete");
            return result;
        } catch (err) {
            console.error("[Genesis] Business idea validation failed:", err.message);
            return {
                ideaStatus: "UNKNOWN",
                summary: "Unable to validate idea at this time. Please try again.",
                directCompetitors: [],
                indirectSolutions: [],
                failedAttempts: [],
                marketSignals: { demandLevel: "UNKNOWN", evidence: "Research unavailable" },
                differentiationOpportunities: []
            };
        }
    }

    /**
     * NEW FEATURE: Find Audience Hangouts
     * Discovers where the target audience spends time online and offline.
     * Returns platforms, communities, influencers, and distribution channels.
     */
    async findAudienceHangouts(contextSummary) {
        const audienceStr = Array.isArray(contextSummary.targetAudience)
            ? contextSummary.targetAudience.join(", ")
            : contextSummary.targetAudience;

        const prompt = `
        You are a digital marketing strategist and audience research expert with real-time web access.
        
        TASK: Find where this target audience hangs out online and offline.
        
        === TARGET AUDIENCE ===
        Demographics: ${audienceStr}
        Industry Context: "${contextSummary.industry}"
        Product/Service: "${contextSummary.valueProposition}"
        =======================
        
        RESEARCH OBJECTIVES:
        1. **Social Platforms:** Which social media platforms do they use most? (Be specific - not just "Facebook" but "Facebook Groups about X")
        2. **Online Communities:** Reddit subreddits, Discord servers, Slack communities, forums.
        3. **Content Consumption:** Podcasts they listen to, YouTube channels they watch, newsletters they read.
        4. **Offline Hangouts:** Events, conferences, meetups, physical locations.
        5. **Influencers:** Key opinion leaders they follow and trust.
        
        CRITICAL: Prioritize SPECIFIC, ACTIONABLE locations. Not "Social Media" but "r/startups, LinkedIn SaaS groups, Product Hunt".
        
        Output JSON Schema:
        {
            "summary": "string - Quick overview of where to find this audience",
            "socialPlatforms": [
                { "platform": "string", "specificChannels": ["string"], "engagementTip": "string" }
            ],
            "onlineCommunities": [
                { "name": "string", "type": "Reddit" | "Discord" | "Forum" | "Slack" | "Other", "link": "string or null", "memberCount": "string or null" }
            ],
            "contentChannels": [
                { "type": "Podcast" | "YouTube" | "Newsletter" | "Blog", "name": "string", "relevance": "string" }
            ],
            "offlineVenues": [
                { "type": "Conference" | "Meetup" | "Location" | "Event", "name": "string", "frequency": "string or null" }
            ],
            "keyInfluencers": [
                { "name": "string", "platform": "string", "followers": "string or null" }
            ],
            "surveyDistributionStrategy": ["string - Specific recommendations for sharing surveys"]
        }
        `;

        try {
            console.log("[Genesis] Finding audience hangouts...");
            const result = await this.completeWithRetry(prompt, MODELS.RESEARCH, true, TOKEN_LIMITS.VALIDATION);
            console.log("[Genesis] Audience hangouts discovery complete");
            return result;
        } catch (err) {
            console.error("[Genesis] Audience hangouts discovery failed:", err.message);
            return {
                summary: "Unable to discover audience hangouts at this time.",
                socialPlatforms: [],
                onlineCommunities: [],
                contentChannels: [],
                offlineVenues: [],
                keyInfluencers: [],
                surveyDistributionStrategy: ["Consider sharing on relevant social media platforms and communities."]
            };
        }
    }

    /**
     * Discover Competitors (Perplexity-based)
     */
    async discoverCompetitors(contextSummary) {
        const currentCompetitors = contextSummary.competitors || [];
        const genericKeywords = ['service', 'system', 'provider', 'traditional', 'existing', 'general', 'other', 'unknown', 'various'];

        const hasGenericCompetitors = currentCompetitors.some(c =>
            genericKeywords.some(keyword => c.toLowerCase().includes(keyword))
        );

        if (currentCompetitors.length >= 3 && !hasGenericCompetitors) {
            return currentCompetitors;
        }

        const instruction = `
            Find the top 5 REAL, SPECIFIC direct competitors for:
            Company: "${contextSummary.companyName}"
            Industry: "${contextSummary.industry}"
            Value Prop: "${contextSummary.valueProposition || "Unknown"}"
            
            CRITICAL: Return ONLY specific brand names (e.g. "FedEx", "DHL", "Amazon Hub").
            DO NOT return generic categories like "Traditional couriers" or "Local shops".
            
            Return ONLY a raw JSON array of strings. Example: ["Competitor A", "Competitor B"]
        `;

        try {
            console.log("[Genesis] Researching competitors...");
            const agentOutput = await this.research(instruction);

            if (agentOutput) {
                try {
                    let finalResult = null;
                    const jsonMatch = agentOutput.match(/\[.*\]/s);
                    if (jsonMatch) {
                        finalResult = JSON.parse(jsonMatch[0]);
                    } else {
                        finalResult = JSON.parse(agentOutput);
                    }

                    if (Array.isArray(finalResult) && finalResult.length > 0) {
                        console.log("[Genesis] Competitors found:", finalResult.length);
                        return finalResult;
                    }
                } catch (e) {
                    // Parsing failed, try fallback
                }

                if (typeof agentOutput === 'string') {
                    return agentOutput.split('\n')
                        .filter(line => line.trim().length > 0)
                        .map(l => l.replace(/^- /, '').replace(/^\d+\.\s*/, '').replace(/"/g, '').replace(/,$/, '').trim())
                        .filter(l => l.length > 0 && !l.startsWith('[') && !l.startsWith(']'));
                }
            }
        } catch (err) {
            console.error("[Genesis] Competitor discovery failed:", err.message);
        }

        return contextSummary.competitors || [];
    }

    /**
     * Helper to clean and parse JSON
     */
    safeParse(text) {
        try {
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            console.error("[Genesis] JSON Parse Failed. Raw text preview:", text.substring(0, 200));
            throw new Error("Invalid JSON response from AI");
        }
    }

    /**
     * Helper to execute AI call with retry logic
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
                console.warn(`[Genesis] AI Attempt ${i + 1}/${retries + 1} failed:`, error.message);
                if (i === retries) {
                    throw new GenesisError(`AI completion failed after ${retries + 1} attempts`, error);
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    /**
     * Generate Strategy (Enhanced with new features)
     * Creates the "Starter Docs" including idea validation and audience hangouts.
     */
    async generateStrategy(contextSummary) {
        // Run idea validation and audience hangouts in parallel for speed
        console.log("[Genesis] Generating comprehensive strategy...");

        const [ideaValidation, audienceHangouts] = await Promise.all([
            this.validateBusinessIdea(contextSummary).catch(err => {
                console.warn("[Genesis] Idea validation skipped:", err.message);
                return null;
            }),
            this.findAudienceHangouts(contextSummary).catch(err => {
                console.warn("[Genesis] Audience hangouts skipped:", err.message);
                return null;
            })
        ]);

        const prompt = `
      Based on the following business context, generate a research strategy for a survey campaign.

      Context: ${JSON.stringify(contextSummary)}
      
      ${ideaValidation ? `Idea Validation Results: ${JSON.stringify(ideaValidation)}` : ""}
      ${audienceHangouts ? `Audience Research: ${JSON.stringify(audienceHangouts)}` : ""}

      **CRITICAL INSTRUCTIONS:**
      1. **BE SPECIFIC:** Do NOT generalize the target audience. Use the EXACT demographics provided.
      2. **BE RELEVANT:** Ensure the objectives and hypotheses are directly tied to the specific industry and value proposition.
      3. **NO FLUFF:** Keep the output concise and actionable.
      4. **LEVERAGE RESEARCH:** If idea validation or audience data is provided, incorporate those insights.
      5. **FACTUALITY CHECK:** If the input context does not mention a specific constraint, DO NOT INVENT ONE.

      Output JSON Schema:
      {
        "objectives": ["string"],
        "hypotheses": ["string"],
        "targetDemographics": ["string"],
        "keyMetrics": ["string"],
        "suggestedChannels": ["string"]
      }
    `;

        const coreStrategy = await this.completeWithRetry(prompt, MODELS.SMART, true, TOKEN_LIMITS.STRATEGY);

        // Combine into enriched strategy
        const enrichedStrategy = {
            ...coreStrategy,
            ideaValidation: ideaValidation || null,
            audienceHangouts: audienceHangouts || null,
        };

        if (enrichedStrategy) {
            trainingLogger.log("GENERATE_STRATEGY", { contextSummary }, enrichedStrategy, MODELS.SMART);
        }

        console.log("[Genesis] Strategy generation complete");
        return enrichedStrategy;
    }

    /**
     * Generate Survey
     * Creates the questions.json based on the strategy.
     */
    async generateSurvey(contextSummary, strategy, userInstruction = "") {
        const prompt = `
      Create a branching survey based on the following context and strategy.
      
      Context: ${JSON.stringify(contextSummary)}
      Strategy: ${JSON.stringify(strategy)}
      
      ${userInstruction ? `**USER INSTRUCTION:** ${userInstruction}\n(You MUST prioritize this instruction strictly.)` : ""}

      **TONE & STYLE GUIDELINES:**
      1. **Conversational & Human:** Write like a friendly researcher, not a robot.
         - BAD: "Rate your satisfaction with the delivery speed."
         - GOOD: "How was the delivery speed? Did it arrive when you expected?"
      2. **Hyper-Specific Context:** You are a specialist in the "${contextSummary.industry}" industry.
         - Every question must contain specific keywords related to "${contextSummary.companyName}" or "${contextSummary.valueProposition}".
      3. **Engaging:** People hate surveys. Make this one feel like a conversation.

      **QUESTION RULES:**
      1. **Rating Scales:** ALWAYS use a **1-5 scale**. NEVER use 1-10.
      2. **Question Count:** Generate **18-25 questions** unless user specifies otherwise.
      3. **Cognitive Load:** Keep options simple and clear.

      **BRANCHING RULES:**
      1. Include at least 2 questions where different options lead to DIFFERENT questions.
      2. Do NOT create fake branching where all options go to the same next question.

      Output JSON Schema:
      {
          "title": "string",
          "description": "string",
          "questions": {
              "Q1": {
                  "type": "multiple_choice" | "text" | "rating",
                  "question": "string",
                  "options": ["string"],
                  "required": boolean,
                  "branches": [{ "if": "string", "next": "Q#" }],
                  "next": "Q#"
              }
          }
      }
    `;

        const result = await this.completeWithRetry(prompt, MODELS.FAST, true, TOKEN_LIMITS.SURVEY);

        if (result) {
            trainingLogger.log("GENERATE_SURVEY", { contextSummary, strategy, userInstruction }, result, MODELS.FAST);
        }

        return result;
    }

    /**
     * Analyze Competitor (Deep Dive with Manus)
     */
    async analyzeCompetitor(competitorName, industry, goal = "") {
        let instruction = "";
        const lowerGoal = goal.toLowerCase();

        if (lowerGoal.includes('pric') || lowerGoal.includes('cost') || lowerGoal.includes('subscription')) {
            instruction = `
            ACT AS: A Competitor Pricing Analyst.
            TASK: Find the EXACT pricing model for "${competitorName}" (${industry}).
            
            **EXECUTION STEPS:**
            1. Navigate directly to their Pricing page.
            2. If hidden, look for FAQ or Support pages mentioning costs.
            3. Extract: Free Tier limits, Pro Plan cost, Enterprise triggers.
            
            **OUTPUT JSON:**
            {
                "pricingModel": "Detailed breakdown of tiers and costs",
                "uniqueSellingPoint": "What is their value metric?",
                "strengths": ["Standard pricing features"],
                "weaknesses": ["Hidden fees, rigid contracts, expensive add-ons"]
            }
            `;
        } else if (lowerGoal.includes('review') || lowerGoal.includes('sentiment')) {
            instruction = `
            ACT AS: A UX Researcher.
            TASK: Find what real users think about "${competitorName}".
            
            **EXECUTION STEPS:**
            1. Ignore their landing page.
            2. Search Reddit, G2, Capterra, and Twitter for reviews.
            3. Synthesize the emotional sentiment.
            
            **OUTPUT JSON:**
            {
                "customerSentiment": "Summary of user reactions",
                "strengths": ["Top 3 things users praise"],
                "weaknesses": ["Top 3 complaints"],
                "keyFeatures": ["Features users mention most"]
            }
            `;
        } else {
            instruction = `
            Perform a deep-dive market analysis on "${competitorName}" in the "${industry}" sector.
            ${goal ? `**FOCUS GOAL:** "${goal}". Prioritize finding this info.` : ""}

            Return a JSON object with:
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
            CRITICAL: Output JSON directly. Do not create files or include conversational filler.
        `;

        try {
            console.log(`[Genesis] Analyzing competitor "${competitorName}"...`);
            const agentOutput = await manus.runTask(instruction);

            if (agentOutput) {
                return this.parseManusOutput(agentOutput, competitorName);
            }
        } catch (err) {
            console.error("[Genesis] Manus analysis failed:", err.message);
            throw new GenesisError(`Failed to analyze competitor "${competitorName}"`, err);
        }

        return null;
    }

    /**
     * Helper to parse Manus agent output
     */
    parseManusOutput(agentOutput, competitorName) {
        let textToParse = agentOutput;

        try {
            let parsedOutput = typeof agentOutput === 'string' ? JSON.parse(agentOutput) : agentOutput;

            if (Array.isArray(parsedOutput)) {
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
            // Not JSON, treat as raw string
        }

        try {
            const jsonMatch = textToParse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            const cleanText = textToParse.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (e) {
            console.warn(`[Genesis] Failed to parse Manus output for ${competitorName}`);
            return {
                pricingModel: "See detailed analysis in strengths",
                keyFeatures: ["See detailed analysis in strengths"],
                targetAudience: "See detailed analysis in strengths",
                marketingChannels: ["See detailed analysis in strengths"],
                customerSentiment: "See detailed analysis in strengths",
                strengths: [textToParse],
                weaknesses: ["See detailed analysis in strengths"],
                uniqueSellingPoint: "See detailed analysis in strengths"
            };
        }
    }

    /**
     * Generate Theme (AI Design)
     */
    async generateTheme(prompt) {
        const instruction = `
            Create a UI theme based on this description: "${prompt}".
            Return a JSON object with:
            - primaryColor: hex code
            - backgroundColor: hex code
            - textColor: hex code
            - accentColor: hex code
            - fontFamily: string (one of: "Inter", "Playfair Display", "Roboto Mono", "Comic Sans MS")
            - borderRadius: string (e.g. "0.5rem", "1rem", "0px")
            
            Return ONLY valid JSON.
        `;

        return this.completeWithRetry(instruction, MODELS.CREATIVE, true, 1000);
    }

    /**
     * Summarize Knowledge (for PDF/Context Injection)
     */
    async summarizeKnowledge(rawText) {
        const prompt = `
            You are an expert analyst. Summarize the following document into key actionable insights for a business context.
            
            Document Content:
            "${rawText.substring(0, 15000)}"

            Goal: Extract the "Need to Know" information.
            - Key facts, figures, and dates.
            - Strategic goals or problems mentioned.
            - Competitor mentions.
            
            Output format: Bullet points, concise and dense.
        `;

        return this.completeWithRetry(prompt, MODELS.FAST, false, 1000);
    }

    /**
     * Gap Analysis
     */
    async generateGapAnalysis(contextSummary, competitors) {
        let marketTrends = "";
        try {
            console.log("[Genesis] Researching market trends...");
            const trendsPrompt = `
                What are the current emerging trends and customer complaints in the "${contextSummary.industry}" industry right now?
                Focus on: Unmet customer needs, new technologies, features customers are asking for.
            `;
            marketTrends = await this.research(trendsPrompt);
        } catch (err) {
            console.warn("[Genesis] Market trends research failed:", err.message);
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

            === LIVE MARKET TRENDS ===
            ${marketTrends}

            Identify:
            1. 3 Market Gaps (Needs that competitors are ignoring)
            2. 3 Strategic Opportunities (How we can win)
            3. 3 Specific Recommendations (Actionable steps)

            Output JSON Schema:
            {
                "gaps": [{ "title": "string", "description": "string" }],
                "opportunities": [{ "title": "string", "description": "string" }],
                "recommendations": ["string"]
            }
        `;

        return this.completeWithRetry(prompt, MODELS.FAST, true, TOKEN_LIMITS.ANALYSIS);
    }

    /**
     * Chat with Brain (Context Q&A)
     */
    async chatWithBrain(context, messages) {
        const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content} `).join('\n');

        const prompt = `
        You are Geniy, an expert market researcher and successful business co-founder. 
        Your goal is to help the user build a solid business strategy by being direct, insightful, and proactive.

        === KNOWLEDGE BASE ===
        ${context}
        ======================

        **CORE INSTRUCTIONS:**
        1. **Context is King:** ALWAYS answer based on the KNOWLEDGE BASE first.
        2. **Be Honest:** If the answer isn't there, ask for more information.
        3. **Cofounder Persona:**
           - Be relatable and human, like a smart business partner.
           - If ideas are vague, ask probing questions.
           - Challenge risky assumptions gently.
           - Be proactive - suggest next steps.
        4. **Formatting:** Use Markdown with double newlines between paragraphs.
        5. **Agentic Actions:** You can trigger "ANALYZE_COMPETITOR" if needed.
           - Check if already analyzed before triggering.
           - Confirm with user before starting.

        Output JSON Schema:
        {
            "message": "string",
            "memory": "string | null", 
            "action": "CHAT" | "ANALYZE_COMPETITOR",
            "actionTarget": "string | null",
            "actionGoal": "string | null"
        }

        Conversation History:
        ${conversationHistory}

        ASSISTANT:
        `;

        return this.completeWithRetry(prompt, MODELS.FAST, true, TOKEN_LIMITS.CHAT);
    }

    /**
     * Chat with Context (Survey generation focused)
     */
    async chatWithContext(context, messages) {
        const conversationHistory = messages.map(m => `${m.role.toUpperCase()}: ${m.content} `).join('\n');

        const prompt = `
      You are Geniy, an expert market research co-founder helping a user define their survey campaign.
      
      === BUSINESS CONTEXT ===
      ${context}
      ========================

      **Tone & Style:**
      - Be a savvy, successful co-founder. Direct, meaningful, slightly casual.
      - If context is vague, ask clarifying questions instead of generating generic output.
      - Use the provided Industry and Audience in your examples.
      - No fluff - start with the insight.

      **Capabilities:**
      - File Uploads: Users can upload PDFs, Docs, or Text files via the "Upload Business Context" button.
      - Context Awareness: The BUSINESS CONTEXT section contains their uploaded content.

      **Actions:**
      - "ANALYZE_COMPETITOR" - if user asks to analyze a competitor
      - "GENERATE" - ONLY if user explicitly confirms they're ready
      - "CHAT" - default for conversation

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

        return this.completeWithRetry(prompt, MODELS.FAST, true, TOKEN_LIMITS.STRATEGY);
    }
}

/**
 * Custom error class for Genesis Agent errors
 */
class GenesisError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'GenesisError';
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

module.exports = new GenesisAgent();
module.exports.GenesisError = GenesisError;
module.exports.MODELS = MODELS;
