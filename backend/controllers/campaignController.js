const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const genesisAgent = require('../services/ai/genesis');

// Create a new Campaign and Survey
exports.createCampaign = async (req, res) => {
    try {
        const { workspaceId, name, description, surveyTitle, questions, contextData, themeConfig } = req.body;

        if (!workspaceId || !name || !surveyTitle) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate a simple public slug (8 chars)
        const publicSlug = crypto.randomUUID().split('-')[0] + Math.floor(Math.random() * 1000);

        // 1. Create Campaign
        const campaign = await prisma.campaign.create({
            data: {
                workspaceId,
                name,
                description,
            },
        });

        // 2. Create Survey
        const survey = await prisma.survey.create({
            data: {
                campaignId: campaign.id,
                title: surveyTitle,
                jsonSchema: questions || {}, // Store the provided JSON
                publicSlug: publicSlug,
                isPublished: true, // Auto-publish for MVP as requested
                themeConfig: themeConfig || undefined,
            },
        });

        // 3. Update Workspace Context if provided
        if (contextData && contextData.analysis) {
            const { analysis, strategy } = contextData;
            let contextString = `Company: ${analysis.companyName}\nIndustry: ${analysis.industry}\nTarget Audience: ${analysis.targetAudience.join(', ')}\n\n`;

            if (strategy) {
                contextString += `Strategy Objectives:\n- ${strategy.objectives.join('\n- ')}\n`;
            }

            await prisma.workspace.update({
                where: { id: workspaceId },
                data: {
                    businessContext: contextString
                }
            });
        }

        const result = { campaign, survey };

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Failed to create campaign' });
    }
};

// Get all campaigns for a workspace
exports.getCampaigns = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ error: 'Workspace ID required' });
        }

        const campaigns = await prisma.campaign.findMany({
            where: {
                workspaceId,
                isDeleted: false
            },
            include: {
                surveys: true,
                _count: {
                    select: { surveys: true } // We might want to count responses later
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
};

// Get a single campaign with details
exports.getCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                surveys: {
                    include: {
                        _count: {
                            select: { responses: true }
                        },
                        responses: {
                            select: {
                                submittedAt: true,
                                metadata: true,
                                rawAnswers: true
                            }
                        }
                    }
                }
            }
        });

        if (!campaign || campaign.isDeleted) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json(campaign);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
};

// Get a survey by its public slug (for respondents)
exports.getSurveyBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const survey = await prisma.survey.findUnique({
            where: { publicSlug: slug },
            include: {
                campaign: {
                    select: {
                        name: true,
                        workspace: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        res.json(survey);
    } catch (error) {
        console.error('Error fetching survey by slug:', error);
        res.status(500).json({ error: 'Failed to fetch survey' });
    }
};

// Submit a response to a survey
exports.submitResponse = async (req, res) => {
    try {
        const { slug } = req.params;
        const { answers, metadata } = req.body;

        const survey = await prisma.survey.findUnique({
            where: { publicSlug: slug }
        });

        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        const response = await prisma.response.create({
            data: {
                surveyId: survey.id,
                rawAnswers: answers,
                metadata: metadata || {}
            }
        });

        res.status(201).json(response);
    } catch (error) {
        console.error('Error submitting response:', error);
        res.status(500).json({ error: 'Failed to submit response' });
    }
};
// Get all responses for a campaign
exports.getCampaignResponses = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if campaign exists and is not deleted
        const campaign = await prisma.campaign.findUnique({
            where: { id },
            select: { isDeleted: true }
        });

        if (!campaign || campaign.isDeleted) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Verify campaign exists and belongs to user's workspace (optional security check)
        // For now, we just fetch responses linked to surveys in this campaign
        const responses = await prisma.response.findMany({
            where: {
                survey: {
                    campaignId: id
                }
            },
            include: {
                survey: {
                    select: { title: true, jsonSchema: true }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        res.json(responses);
    } catch (error) {
        console.error('Error fetching responses:', error);
        res.status(500).json({ error: 'Failed to fetch responses' });
    }
};

// Delete a campaign
exports.deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete: Update isDeleted flag instead of removing record
        await prisma.campaign.update({
            where: { id },
            data: { isDeleted: true }
        });

        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Failed to delete campaign' });
    }
};

// Get analytics for a campaign
exports.getCampaignAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Campaign with Surveys and Responses
        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                surveys: {
                    include: {
                        responses: true
                    }
                }
            }
        });

        if (!campaign || campaign.isDeleted) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // For MVP, we focus on the first survey
        const survey = campaign.surveys[0];
        if (!survey) {
            return res.json({ totalResponses: 0, analytics: {} });
        }

        const responses = survey.responses;
        const totalResponses = responses.length;
        const questions = survey.jsonSchema.questions || {};

        // 2. Aggregate Data
        const analytics = {};

        // Initialize buckets for each question
        Object.entries(questions).forEach(([key, q]) => {
            if (['multiple_choice', 'rating'].includes(q.type)) {
                analytics[key] = {
                    type: q.type,
                    question: q.question,
                    counts: {}
                };
            } else if (q.type === 'ranking') {
                analytics[key] = {
                    type: q.type,
                    question: q.question,
                    counts: {} // { "Option A": { 0: 5, 1: 2 } }
                };
            } else if (['text', 'short_text', 'long_text'].includes(q.type)) {
                analytics[key] = {
                    type: q.type,
                    question: q.question,
                    recentAnswers: []
                };
            }
        });

        // Process responses
        responses.forEach(r => {
            const answers = r.rawAnswers;
            Object.entries(answers).forEach(([qId, value]) => {
                if (!analytics[qId]) return;

                if (analytics[qId].type === 'multiple_choice' || analytics[qId].type === 'rating') {
                    const valStr = String(value);
                    analytics[qId].counts[valStr] = (analytics[qId].counts[valStr] || 0) + 1;
                } else if (analytics[qId].type === 'ranking') {
                    if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            if (!analytics[qId].counts[item]) analytics[qId].counts[item] = {};
                            analytics[qId].counts[item][index] = (analytics[qId].counts[item][index] || 0) + 1;
                        });
                    }
                } else if (['text', 'short_text', 'long_text'].includes(analytics[qId].type)) {
                    // Store last 50 answers for text analysis
                    if (analytics[qId].recentAnswers.length < 50) {
                        analytics[qId].recentAnswers.push(value);
                    }
                }
            });
        });

        res.json({
            surveyId: survey.id,
            totalResponses,
            analytics
        });

    } catch (error) {
        console.error('Error generating analytics:', error);
        res.status(500).json({ error: 'Failed to generate analytics' });
    }
};


// Update a survey (e.g. theme)
exports.updateSurvey = async (req, res) => {
    try {
        const { id } = req.params; // Campaign ID
        const { themeConfig } = req.body;

        // Find the survey associated with this campaign
        const survey = await prisma.survey.findFirst({
            where: { campaignId: id }
        });

        if (!survey) {
            return res.status(404).json({ error: 'Survey not found for this campaign' });
        }

        const updatedSurvey = await prisma.survey.update({
            where: { id: survey.id },
            data: {
                themeConfig: themeConfig || survey.themeConfig
            }
        });

        res.json(updatedSurvey);
    } catch (error) {
        console.error('Error updating survey:', error);
        res.status(500).json({ error: 'Failed to update survey' });
    }
};

// Generate AI Insights
const insightService = require('../services/ai/insightService');

exports.generateInsights = async (req, res) => {
    try {
        const { id } = req.params;
        const insights = await insightService.generateInsights(id);
        res.json(insights);
    } catch (error) {
        console.error("Insight Generation Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate insights" });
    }
};

exports.getInsights = async (req, res) => {
    try {
        const { id } = req.params;
        const insights = await insightService.getInsights(id);
        res.json(insights || null);
    } catch (error) {
        console.error("Fetch Insights Error:", error);
        res.status(500).json({ error: "Failed to fetch insights" });
    }
};

// Chat with Geniy (Conversational Agent)
exports.chatWithGeniy = async (req, res) => {
    try {
        const { message, messages, context } = req.body;

        // Support both single message (legacy/simple) and full history
        let conversationHistory = messages;
        if (!conversationHistory && message) {
            conversationHistory = [{ role: 'user', content: message }];
        }

        if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
            return res.status(400).json({ error: 'Message or conversation history is required' });
        }

        const response = await genesisAgent.chatWithContext(context, conversationHistory);

        // If action is ANALYZE_COMPETITOR, perform the analysis
        if (response.action === 'ANALYZE_COMPETITOR' && response.competitorName) {
            // Extract industry from context (simple regex or passed in)
            const industryMatch = context.match(/Industry:\s*(.+?)(\n|$)/);
            const industry = industryMatch ? industryMatch[1].trim() : "General";

            const analysis = await genesisAgent.analyzeCompetitor(response.competitorName, industry);

            // Attach analysis to response
            response.competitorAnalysis = analysis;
        }

        res.json(response);
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Failed to process chat' });
    }
};

