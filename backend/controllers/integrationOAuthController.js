const prisma = require('../config/db');
const axios = require('axios');

/**
 * Integration OAuth Controller
 * Handles OAuth flows for Slack and Discord integrations
 */

// ============= SLACK OAUTH =============

/**
 * Initiate Slack OAuth flow
 * GET /api/integrations/slack/oauth/start?workspaceId=xxx
 */
exports.initiateSlackOAuth = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ error: 'workspaceId is required' });
        }

        // Store workspaceId in state for callback
        const state = Buffer.from(JSON.stringify({
            workspaceId,
            userId: req.user?.id
        })).toString('base64');

        const scopes = [
            'chat:write',
            'commands',
            'app_mentions:read',
            'channels:history',
            'incoming-webhook'
        ].join(',');

        const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/integrations/slack/oauth/callback`;

        const slackAuthUrl = `https://slack.com/oauth/v2/authorize?` +
            `client_id=${process.env.SLACK_CLIENT_ID}` +
            `&scope=${scopes}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}`;

        res.redirect(slackAuthUrl);
    } catch (error) {
        console.error('Slack OAuth Start Error:', error);
        res.status(500).json({ error: 'Failed to initiate Slack OAuth' });
    }
};

/**
 * Handle Slack OAuth callback
 * GET /api/integrations/slack/oauth/callback
 */
exports.handleSlackCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        if (error) {
            console.error('Slack OAuth Error:', error);
            return res.redirect(`${frontendUrl}/dashboard?integration=slack&status=error&message=${error}`);
        }

        if (!code || !state) {
            return res.redirect(`${frontendUrl}/dashboard?integration=slack&status=error&message=missing_params`);
        }

        // Decode state
        const { workspaceId, userId } = JSON.parse(Buffer.from(state, 'base64').toString());

        // Exchange code for token
        const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/integrations/slack/oauth/callback`;

        const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', null, {
            params: {
                client_id: process.env.SLACK_CLIENT_ID,
                client_secret: process.env.SLACK_CLIENT_SECRET,
                code,
                redirect_uri: redirectUri
            }
        });

        const data = tokenResponse.data;

        if (!data.ok) {
            console.error('Slack Token Error:', data.error);
            return res.redirect(`${frontendUrl}/dashboard?integration=slack&status=error&message=${data.error}`);
        }

        // Get current integrations
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { integrations: true }
        });

        const currentIntegrations = workspace?.integrations || {};

        // Update workspace with Slack tokens
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                integrations: {
                    ...currentIntegrations,
                    slackTeamId: data.team?.id,
                    slackTeamName: data.team?.name,
                    slackBotToken: data.access_token,
                    slackBotUserId: data.bot_user_id,
                    slackWebhook: data.incoming_webhook?.url,
                    slackChannelId: data.incoming_webhook?.channel_id,
                    slackChannelName: data.incoming_webhook?.channel,
                    slackConnectedAt: new Date().toISOString(),
                    slackConnectedBy: userId
                }
            }
        });

        console.log(`✅ Slack connected for workspace ${workspaceId} (Team: ${data.team?.name})`);

        // Redirect back to settings with success
        res.redirect(`${frontendUrl}/dashboard/${workspaceId}/settings?tab=integrations&integration=slack&status=success`);

    } catch (error) {
        console.error('Slack OAuth Callback Error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/dashboard?integration=slack&status=error&message=server_error`);
    }
};

// ============= DISCORD OAUTH =============

/**
 * Initiate Discord OAuth flow
 * GET /api/integrations/discord/oauth/start?workspaceId=xxx
 */
exports.initiateDiscordOAuth = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ error: 'workspaceId is required' });
        }

        // Store workspaceId in state for callback
        const state = Buffer.from(JSON.stringify({
            workspaceId,
            userId: req.user?.id
        })).toString('base64');

        // Bot permissions integer (calculated from Discord permissions)
        // Send Messages, Read Message History, Use Slash Commands, Embed Links, Add Reactions, View Channels
        const permissions = '274877991936';

        const scopes = ['bot', 'applications.commands'].join('%20');
        const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/integrations/discord/oauth/callback`;

        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?` +
            `client_id=${process.env.DISCORD_CLIENT_ID}` +
            `&permissions=${permissions}` +
            `&scope=${scopes}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&state=${state}`;

        res.redirect(discordAuthUrl);
    } catch (error) {
        console.error('Discord OAuth Start Error:', error);
        res.status(500).json({ error: 'Failed to initiate Discord OAuth' });
    }
};

/**
 * Handle Discord OAuth callback
 * GET /api/integrations/discord/oauth/callback
 */
exports.handleDiscordCallback = async (req, res) => {
    try {
        const { code, state, error, guild_id } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        if (error) {
            console.error('Discord OAuth Error:', error);
            return res.redirect(`${frontendUrl}/dashboard?integration=discord&status=error&message=${error}`);
        }

        if (!state) {
            return res.redirect(`${frontendUrl}/dashboard?integration=discord&status=error&message=missing_state`);
        }

        // Decode state
        const { workspaceId, userId } = JSON.parse(Buffer.from(state, 'base64').toString());

        // For bot authorization, Discord doesn't return a code - just guild_id
        // We use our global bot token for all operations

        let guildInfo = null;
        if (guild_id) {
            // Fetch guild info using bot token
            try {
                const guildResponse = await axios.get(`https://discord.com/api/v10/guilds/${guild_id}`, {
                    headers: {
                        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`
                    }
                });
                guildInfo = guildResponse.data;
            } catch (err) {
                console.log('Could not fetch guild info:', err.message);
            }
        }

        // Get current integrations
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { integrations: true }
        });

        const currentIntegrations = workspace?.integrations || {};

        // Update workspace with Discord info
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                integrations: {
                    ...currentIntegrations,
                    discordGuildId: guild_id,
                    discordGuildName: guildInfo?.name || 'Discord Server',
                    discordConnectedAt: new Date().toISOString(),
                    discordConnectedBy: userId
                }
            }
        });

        console.log(`✅ Discord connected for workspace ${workspaceId} (Guild: ${guildInfo?.name || guild_id})`);

        // Redirect back to settings with success
        res.redirect(`${frontendUrl}/dashboard/${workspaceId}/settings?tab=integrations&integration=discord&status=success`);

    } catch (error) {
        console.error('Discord OAuth Callback Error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/dashboard?integration=discord&status=error&message=server_error`);
    }
};

// ============= DISCONNECT =============

/**
 * Disconnect Slack integration
 * POST /api/integrations/slack/disconnect
 */
exports.disconnectSlack = async (req, res) => {
    try {
        const { workspaceId } = req.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { integrations: true }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const integrations = workspace.integrations || {};

        // Remove Slack-related fields
        delete integrations.slackTeamId;
        delete integrations.slackTeamName;
        delete integrations.slackBotToken;
        delete integrations.slackBotUserId;
        delete integrations.slackWebhook;
        delete integrations.slackChannelId;
        delete integrations.slackChannelName;
        delete integrations.slackConnectedAt;
        delete integrations.slackConnectedBy;

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { integrations }
        });

        console.log(`🔌 Slack disconnected for workspace ${workspaceId}`);
        res.json({ success: true, message: 'Slack disconnected' });

    } catch (error) {
        console.error('Disconnect Slack Error:', error);
        res.status(500).json({ error: 'Failed to disconnect Slack' });
    }
};

/**
 * Disconnect Discord integration
 * POST /api/integrations/discord/disconnect
 */
exports.disconnectDiscord = async (req, res) => {
    try {
        const { workspaceId } = req.body;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { integrations: true }
        });

        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const integrations = workspace.integrations || {};

        // Remove Discord-related fields
        delete integrations.discordGuildId;
        delete integrations.discordGuildName;
        delete integrations.discordWebhook;
        delete integrations.discordConnectedAt;
        delete integrations.discordConnectedBy;

        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { integrations }
        });

        console.log(`🔌 Discord disconnected for workspace ${workspaceId}`);
        res.json({ success: true, message: 'Discord disconnected' });

    } catch (error) {
        console.error('Disconnect Discord Error:', error);
        res.status(500).json({ error: 'Failed to disconnect Discord' });
    }
};
