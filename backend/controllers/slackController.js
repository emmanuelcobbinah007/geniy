const integrationChatService = require('../services/integrationChatService');
const prisma = require('../config/db');
const crypto = require('crypto');

/**
 * Slack Integration Controller
 * 
 * Handles incoming Slack slash commands and interactive messages.
 * Users can interact with Geniy directly from Slack.
 */

/**
 * Handle Slack slash command: /geniy
 * POST /api/integrations/slack/command
 */
exports.handleSlackCommand = async (req, res) => {
    try {
        const {
            command,
            text,
            team_id,
            channel_id,
            user_id,
            user_name,
            response_url
        } = req.body;

        // Acknowledge immediately (Slack requires response within 3s)
        res.status(200).json({
            response_type: 'ephemeral',
            text: 'Thinking...'
        });

        // Parse command and query
        const parts = (text || '').trim().split(' ');
        const subCommand = parts[0]?.toLowerCase() || 'help';
        const query = parts.slice(1).join(' ');

        // Find workspace by Slack team ID
        const workspace = await findWorkspaceBySlackTeam(team_id);

        if (!workspace) {
            await sendSlackResponse(response_url, {
                response_type: 'ephemeral',
                text: "This Slack workspace isn't connected to a Geniy workspace yet. Ask your admin to set up the integration in Settings → Integrations."
            });
            return;
        }

        // Process the command
        const result = await integrationChatService.processCommand(
            workspace.id,
            subCommand,
            query
        );

        // Format and send response
        const slackMessage = formatSlackMessage(result);
        await sendSlackResponse(response_url, slackMessage);

    } catch (error) {
        console.error('Slack Command Error:', error);
        // Try to send error response if we have the URL
        if (req.body.response_url) {
            await sendSlackResponse(req.body.response_url, {
                response_type: 'ephemeral',
                text: "Something went wrong. Try again in a bit!"
            });
        }
    }
};

/**
 * Handle Slack events (messages, mentions, etc.)
 * POST /api/integrations/slack/events
 */
exports.handleSlackEvents = async (req, res) => {
    try {
        const { type, challenge, event } = req.body;

        // Handle URL verification challenge
        if (type === 'url_verification') {
            return res.status(200).json({ challenge });
        }

        // Acknowledge event
        res.status(200).send('OK');

        // Handle app_mention events
        if (event?.type === 'app_mention') {
            await handleAppMention(event);
        }

    } catch (error) {
        console.error('Slack Event Error:', error);
        res.status(200).send('OK'); // Always acknowledge
    }
};

/**
 * Handle when Geniy is mentioned in a channel
 */
async function handleAppMention(event) {
    const { text, channel, team } = event;

    // Remove the mention from the text
    const query = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    // Find workspace
    const workspace = await findWorkspaceBySlackTeam(team);
    if (!workspace) return;

    // Process as a question
    const result = await integrationChatService.processCommand(
        workspace.id,
        'ask',
        query
    );

    // We'd need a Slack bot token to post back
    // This is stored in workspace.integrations.slackBotToken
    const integrations = workspace.integrations || {};
    if (integrations.slackBotToken) {
        await postToSlackChannel(integrations.slackBotToken, channel, formatSlackMessage(result));
    }
}

/**
 * Find workspace by Slack team ID
 */
async function findWorkspaceBySlackTeam(teamId) {
    // Look for workspace with matching Slack team ID in integrations
    const workspaces = await prisma.workspace.findMany({
        where: {
            integrations: {
                path: ['slackTeamId'],
                equals: teamId
            }
        }
    });

    return workspaces[0] || null;
}

/**
 * Format response for Slack
 */
function formatSlackMessage(result) {
    const color = result.type === 'error' ? '#ef4444' : '#8b5cf6';

    const blocks = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${result.title}*\n${result.message}`
            }
        }
    ];

    if (result.footer) {
        blocks.push({
            type: 'context',
            elements: [
                {
                    type: 'mrkdwn',
                    text: result.footer
                }
            ]
        });
    }

    return {
        response_type: 'in_channel',
        blocks,
        attachments: [{ color, fallback: result.message }]
    };
}

/**
 * Send response to Slack response_url
 */
async function sendSlackResponse(responseUrl, message) {
    const axios = require('axios');
    try {
        await axios.post(responseUrl, message);
    } catch (err) {
        console.error('Failed to send Slack response:', err.message);
    }
}

/**
 * Post message to Slack channel (requires bot token)
 */
async function postToSlackChannel(token, channel, message) {
    const axios = require('axios');
    try {
        await axios.post('https://slack.com/api/chat.postMessage', {
            channel,
            ...message
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (err) {
        console.error('Failed to post to Slack:', err.message);
    }
}

/**
 * Verify Slack request signature
 */
exports.verifySlackSignature = (req, res, next) => {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    if (!signingSecret) {
        console.warn('SLACK_SIGNING_SECRET not configured');
        return next(); // Skip verification in development
    }

    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const body = req.rawBody;

    if (!signature || !timestamp || !body) {
        return res.status(401).json({ error: 'Missing signature headers' });
    }

    // Check timestamp to prevent replay attacks
    const time = Math.floor(Date.now() / 1000);
    if (Math.abs(time - timestamp) > 300) {
        return res.status(401).json({ error: 'Request too old' });
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const mySignature = 'v0=' + crypto
        .createHmac('sha256', signingSecret)
        .update(sigBasestring, 'utf8')
        .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(mySignature, 'utf8'), Buffer.from(signature, 'utf8'))) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
};
