const express = require('express');
const router = express.Router();
const slackController = require('../controllers/slackController');
const discordController = require('../controllers/discordController');

/**
 * Integration Routes - Slack & Discord Chat Integrations
 * 
 * These endpoints allow users to interact with Geniy from their chat channels.
 */

// =============================================================================
// SLACK ROUTES
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
// DISCORD ROUTES
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
