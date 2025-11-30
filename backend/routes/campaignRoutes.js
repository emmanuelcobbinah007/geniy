const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

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

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
