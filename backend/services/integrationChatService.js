const prisma = require('../config/db');
const genesisAgent = require('./ai/genesis');

/**
 * IntegrationChatService - Handles chat interactions from Slack/Discord
 * 
 * This is the "lite BrainChat" - allowing users to ask Geniy questions
 * and get context-aware responses directly from their chat channels.
 */
class IntegrationChatService {

    // Personality phrases for variety - Geniy should feel human, not robotic
    personalities = {
        greetings: [
            "Hey!",
            "What's up!",
            "Good to hear from you!",
            "Always happy to help!"
        ],
        thinking: [
            "Let me dig into that...",
            "Hmm, interesting question...",
            "Give me a sec to think about this...",
            "Looking into it now..."
        ],
        transitions: [
            "Here's what I found:",
            "Based on what I know:",
            "So here's the thing:",
            "Here's my take:"
        ],
        closings: [
            "Anything else you'd like to know?",
            "Let me know if you want me to dig deeper!",
            "Happy to elaborate if needed!",
            "Feel free to ask follow-ups!"
        ]
    };

    getRandomPhrase(type) {
        const phrases = this.personalities[type];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }

    /**
     * Process a natural language message from integration channel
     * Uses intent detection to route to the right handler seamlessly
     * @param {string} workspaceId 
     * @param {string} message - The raw user message (or command for backwards compat)
     * @param {string} additionalQuery - Optional additional query text
     * @returns {object} Response to send back to channel
     */
    async processMessage(workspaceId, message, additionalQuery = '') {
        try {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                include: {
                    // Note: competitors is a JSON field, not a relation, so it's included by default
                    campaigns: {
                        include: {
                            surveys: {
                                include: {
                                    _count: { select: { responses: true } }
                                }
                            }
                        }
                    },
                    businessContext: true,
                    gapAnalysis: true
                }
            });

            if (!workspace) {
                return this.formatError("Workspace not found. Make sure your integration is connected to a valid workspace.");
            }

            // Combine message parts
            const fullMessage = `${message} ${additionalQuery}`.trim();

            // Detect intent from the natural language message
            const { intent, params } = this.detectIntent(fullMessage, workspace);

            // Route to the appropriate handler based on detected intent
            switch (intent) {
                case 'competitor':
                    return await this.handleCompetitor(workspace, params.competitorName);
                case 'status':
                    return this.handleStatus(workspace);
                case 'suggest':
                    return await this.handleSuggest(workspace);
                case 'help':
                    return this.handleHelp();
                case 'greeting':
                    return this.handleGreeting();
                default:
                    // Default to AI-powered conversation for everything else
                    return await this.handleAsk(workspace, fullMessage);
            }
        } catch (error) {
            console.error('IntegrationChat Error:', error);
            return this.formatError("Oops, something went wrong on my end. Try again in a bit!");
        }
    }

    /**
     * Backwards-compatible alias for processMessage
     */
    async processCommand(workspaceId, command, query) {
        return this.processMessage(workspaceId, command, query);
    }

    /**
     * Detect user intent from natural language
     * Returns the intent type and any extracted parameters
     */
    detectIntent(message, workspace) {
        const lowerMessage = message.toLowerCase().trim();

        // Status/overview intent
        const statusPatterns = [
            /how('?s| is| are)?\s*(we|things|it|the team|our)?\s*(doing|going)?/,
            /what('?s| is) (our |the )?(status|situation|update)/,
            /give me (a |an |the )?(status|update|overview|summary)/,
            /quick (update|summary|overview|status)/,
            /^status$/
        ];
        if (statusPatterns.some(p => p.test(lowerMessage))) {
            return { intent: 'status', params: {} };
        }

        // Suggestions/recommendations intent
        const suggestPatterns = [
            /what should (i|we) (do|focus on|work on|prioritize)/,
            /any (suggestions?|recommendations?|advice|tips)/,
            /what do you (suggest|recommend|think)/,
            /help me (prioritize|figure out|decide)/,
            /what('?s| is) next/,
            /^suggest$/
        ];
        if (suggestPatterns.some(p => p.test(lowerMessage))) {
            return { intent: 'suggest', params: {} };
        }

        // Help intent
        const helpPatterns = [
            /what can you do/,
            /how (do i|can i) use you/,
            /what (are|'re) your (commands|capabilities)/,
            /^help$/
        ];
        if (helpPatterns.some(p => p.test(lowerMessage))) {
            return { intent: 'help', params: {} };
        }

        // Greeting intent (just saying hi)
        const greetingPatterns = [
            /^(hi|hey|hello|yo|sup|what'?s up)!?$/,
            /^good (morning|afternoon|evening)/
        ];
        if (greetingPatterns.some(p => p.test(lowerMessage))) {
            return { intent: 'greeting', params: {} };
        }

        // Competitor intent - check if they're asking about a known competitor
        const competitorPatterns = [
            /(?:what('?s| is| do you know) about|tell me about|info on|intel on|update on)\s+(.+)/,
            /how('?s| is)\s+(.+?)\s+(doing|performing)/,
            /what('?s| is)\s+(.+?)\s+(up to|doing)/
        ];

        for (const pattern of competitorPatterns) {
            const match = lowerMessage.match(pattern);
            if (match) {
                const potentialName = match[2]?.trim();
                // Check if this matches a known competitor
                const competitor = (workspace.competitors || []).find(
                    c => c && c.name && c.name.toLowerCase().includes(potentialName.toLowerCase())
                );
                if (competitor) {
                    return { intent: 'competitor', params: { competitorName: competitor.name } };
                }
            }
        }

        // Also check if they just mentioned a competitor name directly
        for (const comp of (workspace.competitors || [])) {
            if (comp && comp.name && lowerMessage.includes(comp.name.toLowerCase())) {
                return { intent: 'competitor', params: { competitorName: comp.name } };
            }
        }

        // Default - treat as a general question for AI
        return { intent: 'ask', params: {} };
    }

    /**
     * Handle simple greetings
     */
    handleGreeting() {
        const responses = [
            { title: "Hey!", message: "What can I help you with today?" },
            { title: "Hi there!", message: "Ready to help. What's on your mind?" },
            { title: "Hello!", message: "Good to hear from you. What do you need?" },
            { title: "Hey!", message: "I'm here. What would you like to know?" }
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        return this.formatResponse(response.title, response.message);
    }

    /**
     * Handle free-form questions using AI
     */
    async handleAsk(workspace, question) {
        if (!question || question.trim().length === 0) {
            return this.formatResponse(
                "What would you like to know?",
                "You can ask me about your competitors, strategy, survey insights, or anything related to your business context!"
            );
        }

        // Build context for AI
        const context = this.buildContext(workspace);

        try {
            // Use Genesis agent for intelligent response
            const response = await genesisAgent.chat(
                question,
                context,
                [] // No chat history for integration channels
            );

            // Add personality touches
            const greeting = this.getRandomPhrase('greetings');
            const closing = this.getRandomPhrase('closings');

            return this.formatResponse(
                `${greeting} ${this.getRandomPhrase('transitions')}`,
                response.message || response,
                closing
            );
        } catch (err) {
            console.error('AI Error:', err);
            return this.formatResponse(
                this.getRandomPhrase('thinking'),
                "I'm having trouble processing that right now. Could you try rephrasing your question?"
            );
        }
    }

    /**
     * Handle competitor lookup
     */
    async handleCompetitor(workspace, competitorName) {
        if (!competitorName || competitorName.trim().length === 0) {
            const competitors = (workspace.competitors || [])
                .filter(c => c && typeof c === 'object')
                .map(c => c.name)
                .join(', ');

            return this.formatResponse(
                "Which competitor?",
                competitors
                    ? `I'm tracking: ${competitors}. Tell me which one you want to know about!`
                    : "You don't have any competitors set up yet. Add some in the Context page!"
            );
        }

        // Find matching competitor
        const competitor = (workspace.competitors || []).find(
            c => c && c.name && c.name.toLowerCase().includes(competitorName.toLowerCase())
        );

        if (!competitor) {
            return this.formatResponse(
                `Hmm, I don't have "${competitorName}" in my radar.`,
                "Check the Context page to add them, or maybe you meant a different name?"
            );
        }

        // Build competitor summary
        let summary = `**${competitor.name}**\n`;

        if (competitor.website) {
            summary += `${competitor.website}\n`;
        }

        if (competitor.analysis) {
            if (competitor.analysis.summary) {
                summary += `\n${competitor.analysis.summary}\n`;
            }
            if (competitor.analysis.strengths) {
                summary += `\n**Strengths**: ${competitor.analysis.strengths.slice(0, 3).join(', ')}\n`;
            }
            if (competitor.analysis.weaknesses) {
                summary += `\n**Weaknesses**: ${competitor.analysis.weaknesses.slice(0, 3).join(', ')}\n`;
            }
        } else {
            summary += `\nI haven't done a deep analysis yet. Want me to run one? Check the Context page.`;
        }

        return this.formatResponse(
            `Here's what I know about ${competitor.name}:`,
            summary
        );
    }

    /**
     * Handle strategy suggestions
     */
    async handleSuggest(workspace) {
        const suggestions = [];

        // Check business context
        if (!workspace.businessContext?.context || workspace.businessContext.context.length < 100) {
            suggestions.push({
                priority: 'high',
                text: "Your business context is pretty light. I work best when I know more about your business!",
                action: "Add more context →"
            });
        }

        // Check campaigns
        const totalResponses = workspace.campaigns?.reduce((sum, c) =>
            sum + (c.surveys?.reduce((s, survey) => s + (survey._count?.responses || 0), 0) || 0), 0
        ) || 0;

        if (workspace.campaigns?.length === 0) {
            suggestions.push({
                priority: 'high',
                text: "You haven't created any surveys yet. Time to start gathering insights!",
                action: "Create a survey →"
            });
        } else if (totalResponses < 5) {
            suggestions.push({
                priority: 'medium',
                text: "Your surveys could use more responses. Have you tried sharing them more widely?",
                action: "Promote your surveys →"
            });
        }

        // Check gap analysis
        if (workspace.gapAnalysis?.gaps?.length > 0) {
            const topGap = workspace.gapAnalysis.gaps[0];
            suggestions.push({
                priority: 'medium',
                text: `Knowledge gap spotted: ${topGap.description || topGap.gap}`,
                action: "Address this gap →"
            });
        }

        // Check competitors
        const unanalyzed = (workspace.competitors || []).filter(c => c && !c.analysis);
        if (unanalyzed.length > 0) {
            suggestions.push({
                priority: 'low',
                text: `${unanalyzed.length} competitor(s) haven't been analyzed yet.`,
                action: "Run deep analysis →"
            });
        }

        if (suggestions.length === 0) {
            return this.formatResponse(
                "Looking good!",
                "You're on top of things. Keep gathering responses and I'll surface insights as they come in."
            );
        }

        const formatted = suggestions
            .slice(0, 3)
            .map((s, i) => `${i + 1}. ${s.text}`)
            .join('\n');

        return this.formatResponse(
            "Here's what I'd focus on:",
            formatted,
            "Check your dashboard for more details!"
        );
    }

    /**
     * Handle status check
     */
    handleStatus(workspace) {
        const totalCampaigns = workspace.campaigns?.length || 0;
        const activeCampaigns = workspace.campaigns?.filter(c =>
            c.surveys?.some(s => s.isPublished)
        ).length || 0;

        const totalResponses = workspace.campaigns?.reduce((sum, c) =>
            sum + (c.surveys?.reduce((s, survey) => s + (survey._count?.responses || 0), 0) || 0), 0
        ) || 0;

        const competitorCount = (workspace.competitors || []).filter(c => c && typeof c === 'object').length;

        const status = `
**${workspace.name} Status**

**Campaigns**: ${activeCampaigns} active / ${totalCampaigns} total
**Responses**: ${totalResponses} collected
**Competitors**: ${competitorCount} being tracked
        `.trim();

        return this.formatResponse(
            "Here's your quick status:",
            status
        );
    }

    /**
     * Handle help command
     */
    handleHelp() {
        return this.formatResponse(
            "Hey! Just talk to me like you would a teammate.",
            `
**Here's what I can help with:**

Ask me anything naturally - I'll figure out what you need:
- "How are we doing?" → I'll give you a status update
- "What should we focus on?" → I'll share my recommendations  
- "Tell me about [competitor name]" → I'll pull up their intel
- "What are our gaps?" → I'll analyze what's missing
- Or just ask any question about your business!

No special commands needed - just @mention me and chat.
            `.trim()
        );
    }

    /**
     * Build context string from workspace data
     */
    buildContext(workspace) {
        let context = '';

        if (workspace.businessContext?.context) {
            context += `Business Context: ${workspace.businessContext.context}\n\n`;
        }

        if (workspace.competitors?.length > 0) {
            const competitorInfo = workspace.competitors
                .filter(c => c && typeof c === 'object')
                .map(c => `- ${c.name}: ${c.analysis?.summary || 'No analysis yet'}`)
                .join('\n');
            context += `Competitors:\n${competitorInfo}\n\n`;
        }

        if (workspace.gapAnalysis?.gaps?.length > 0) {
            const gaps = workspace.gapAnalysis.gaps
                .slice(0, 3)
                .map(g => `- ${g.description || g.gap}`)
                .join('\n');
            context += `Knowledge Gaps:\n${gaps}\n\n`;
        }

        return context || 'No business context available yet.';
    }

    /**
     * Format response for channel delivery
     */
    formatResponse(title, message, footer = null) {
        return {
            success: true,
            title,
            message,
            footer,
            type: 'info'
        };
    }

    formatError(message) {
        return {
            success: false,
            title: "Uh oh...",
            message,
            type: 'error'
        };
    }
}

module.exports = new IntegrationChatService();
