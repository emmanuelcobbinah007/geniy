const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { protect: authenticateToken } = require('../middleware/authMiddleware');

// POST /api/campaigns - Create a new campaign and survey
router.post('/', campaignController.createCampaign);

// GET /api/campaigns - Get all campaigns for a workspace
router.get('/', campaignController.getCampaigns);

// GET /api/campaigns/public/:slug - Get survey by public slug
router.get('/public/:slug', campaignController.getSurveyBySlug);

// POST /api/campaigns/public/:slug/response - Submit survey response
router.post('/public/:slug/response', campaignController.submitResponse);

// GET /api/campaigns/:id - Get a single campaign details
router.get('/:id', campaignController.getCampaign);

// GET /api/campaigns/:id/responses - Get all responses for a campaign
router.get('/:id/responses', campaignController.getCampaignResponses);

// GET /api/campaigns/:id/analytics - Get aggregated analytics for a campaign
router.get('/:id/analytics', campaignController.getCampaignAnalytics);

// GET /api/campaigns/:id/export - Export responses as CSV
router.get('/:id/export', campaignController.exportCampaignResponses);

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', campaignController.deleteCampaign);

// PUT /api/campaigns/:id/survey - Update survey (theme, etc)
router.put('/:id/survey', campaignController.updateSurvey);

// POST /api/campaigns/:id/insights - Generate AI insights
router.post('/:id/insights', campaignController.generateInsights);

// GET /api/campaigns/:id/insights - Get existing insights
router.get('/:id/insights', campaignController.getInsights);

// Chat with Geniy
router.post('/chat', authenticateToken, campaignController.chatWithGeniy);

module.exports = router;
