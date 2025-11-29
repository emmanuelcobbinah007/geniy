const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Create a new Campaign and Survey
exports.createCampaign = async (req, res) => {
    try {
        const { workspaceId, name, description, surveyTitle, questions, contextData } = req.body;

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
            where: { workspaceId },
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
                        }
                    }
                }
            }
        });

        if (!campaign) {
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


