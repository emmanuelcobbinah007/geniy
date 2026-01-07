const express = require('express');
const router = express.Router();
const slackController = require('../controllers/slackController');
const discordController = require('../controllers/discordController');
const oauthController = require('../controllers/integrationOAuthController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Integration Routes - Slack & Discord Chat Integrations
 * 
 * These endpoints allow users to interact with Geniy from their chat channels.
 */

// =============================================================================
// SLACK OAUTH ROUTES
// =============================================================================

/**
 * Start Slack OAuth flow
 * GET /api/integrations/slack/oauth/start?workspaceId=xxx
 */
router.get('/slack/oauth/start', protect, oauthController.initiateSlackOAuth);

/**
 * Slack OAuth callback
 * GET /api/integrations/slack/oauth/callback
 */
router.get('/slack/oauth/callback', oauthController.handleSlackCallback);

/**
 * Disconnect Slack
 * POST /api/integrations/slack/disconnect
 */
router.post('/slack/disconnect', protect, oauthController.disconnectSlack);

// =============================================================================
// DISCORD OAUTH ROUTES
// =============================================================================

/**
 * Start Discord OAuth flow
 * GET /api/integrations/discord/oauth/start?workspaceId=xxx
 */
router.get('/discord/oauth/start', protect, oauthController.initiateDiscordOAuth);

/**
 * Discord OAuth callback
 * GET /api/integrations/discord/oauth/callback
 */
router.get('/discord/oauth/callback', oauthController.handleDiscordCallback);

/**
 * Disconnect Discord
 * POST /api/integrations/discord/disconnect
 */
router.post('/discord/disconnect', protect, oauthController.disconnectDiscord);

// =============================================================================
// SLACK COMMAND/EVENT ROUTES
// =============================================================================

/**
 * Slack slash command endpoint
 * POST /api/integrations/slack/command
 * 
 * Receives: /geniy ask [question] | /geniy competitor [name] | etc.
 */
router.post('/slack/command',
    express.urlencoded({ extended: true }),
    slackController.handleSlackCommand
);

/**
 * Slack events endpoint (for @mentions and messages)
 * POST /api/integrations/slack/events
 */
router.post('/slack/events',
    express.json(),
    slackController.handleSlackEvents
);

// =============================================================================
// DISCORD COMMAND/EVENT ROUTES
// =============================================================================

/**
 * Discord interactions endpoint (slash commands)
 * POST /api/integrations/discord/webhook
 */
router.post('/discord/webhook',
    express.json(),
    discordController.handleDiscordWebhook
);

/**
 * Discord message endpoint (for !geniy prefix commands)
 * POST /api/integrations/discord/message
 */
router.post('/discord/message',
    express.json(),
    discordController.handleDiscordMessage
);

module.exports = router;
