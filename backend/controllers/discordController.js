const integrationChatService = require('../services/integrationChatService');
const prisma = require('../config/db');
const crypto = require('crypto');

/**
 * Discord Integration Controller
 * 
 * Handles incoming Discord interactions (slash commands, messages).
 * Users can interact with Geniy directly from Discord.
 */

/**
 * Handle Discord webhook interactions
 * POST /api/integrations/discord/webhook
 */
exports.handleDiscordWebhook = async (req, res) => {
    try {
        const { type, data, guild_id, channel_id, member, token } = req.body;

        // Type 1: PING (Discord verification)
        if (type === 1) {
            return res.status(200).json({ type: 1 });
        }

        // Type 2: APPLICATION_COMMAND (slash command)
        if (type === 2) {
            // Defer response (gives us more time to process)
            res.status(200).json({
                type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
            });

            // Process the command
            await handleSlashCommand(data, guild_id, token);
            return;
        }

        // Type 3: MESSAGE_COMPONENT (button clicks, etc.)
        if (type === 3) {
            res.status(200).json({ type: 1 }); // ACK
            return;
        }

        res.status(200).json({ type: 1 });

    } catch (error) {
        console.error('Discord Webhook Error:', error);
        res.status(200).json({ type: 1 }); // Always acknowledge
    }
};

/**
 * Handle slash command from Discord
 */
async function handleSlashCommand(data, guildId, interactionToken) {
    const { name, options } = data;

    // Parse options
    const subCommand = options?.[0]?.name || name;
    const query = options?.[0]?.options?.[0]?.value || options?.[0]?.value || '';

    // Find workspace by Discord guild ID
    const workspace = await findWorkspaceByDiscordGuild(guildId);

    if (!workspace) {
        await sendDiscordFollowup(interactionToken, {
            content: "❌ This Discord server isn't connected to a Geniy workspace yet. Ask your admin to set up the integration."
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
    const discordMessage = formatDiscordMessage(result);
    await sendDiscordFollowup(interactionToken, discordMessage);
}

/**
 * Handle direct messages or mentions in Discord
 * POST /api/integrations/discord/message
 */
exports.handleDiscordMessage = async (req, res) => {
    try {
        const { content, guild_id, channel_id, author } = req.body;

        // Ignore bot messages
        if (author?.bot) {
            return res.status(200).send('OK');
        }

        res.status(200).send('OK');

        // Check if this is a mention or starts with prefix
        const prefix = '!geniy';
        if (!content.toLowerCase().startsWith(prefix)) {
            return;
        }

        // Parse message
        const query = content.slice(prefix.length).trim();
        const parts = query.split(' ');
        const subCommand = parts[0] || 'ask';
        const queryText = parts.slice(1).join(' ');

        // Find workspace
        const workspace = await findWorkspaceByDiscordGuild(guild_id);
        if (!workspace) return;

        // Process command
        const result = await integrationChatService.processCommand(
            workspace.id,
            subCommand,
            queryText
        );

        // Send response back
        const integrations = workspace.integrations || {};
        if (integrations.discordWebhook) {
            const message = formatDiscordMessage(result);
            await sendToDiscordWebhook(integrations.discordWebhook, message);
        }

    } catch (error) {
        console.error('Discord Message Error:', error);
        res.status(200).send('OK');
    }
};

/**
 * Find workspace by Discord guild ID
 */
async function findWorkspaceByDiscordGuild(guildId) {
    const workspaces = await prisma.workspace.findMany({
        where: {
            integrations: {
                path: ['discordGuildId'],
                equals: guildId
            }
        }
    });

    return workspaces[0] || null;
}

/**
 * Format response for Discord embed
 */
function formatDiscordMessage(result) {
    const color = result.type === 'error' ? 0xef4444 : 0x8b5cf6;

    return {
        embeds: [{
            title: result.title,
            description: result.message,
            color: color,
            footer: result.footer ? { text: result.footer } : undefined,
            timestamp: new Date().toISOString()
        }]
    };
}

/**
 * Send followup message after deferred response
 */
async function sendDiscordFollowup(interactionToken, message) {
    const axios = require('axios');
    const appId = process.env.DISCORD_APP_ID;

    if (!appId || !interactionToken) return;

    try {
        await axios.post(
            `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}`,
            message,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (err) {
        console.error('Discord Followup Error:', err.message);
    }
}

/**
 * Send message to Discord webhook
 */
async function sendToDiscordWebhook(webhookUrl, message) {
    const axios = require('axios');
    try {
        await axios.post(webhookUrl, message);
    } catch (err) {
        console.error('Discord Webhook Send Error:', err.message);
    }
}

/**
 * Verify Discord request signature
 */
exports.verifyDiscordSignature = (req, res, next) => {
    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!publicKey) {
        console.warn('DISCORD_PUBLIC_KEY not configured');
        return next(); // Skip in development
    }

    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const body = req.rawBody;

    if (!signature || !timestamp || !body) {
        return res.status(401).json({ error: 'Missing signature headers' });
    }

    try {
        const isValid = verifyKey(body, signature, timestamp, publicKey);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Signature verification failed' });
    }
};

/**
 * Discord signature verification helper
 */
function verifyKey(body, signature, timestamp, publicKey) {
    try {
        const nacl = require('tweetnacl');
        const message = Buffer.from(timestamp + body);
        const sig = Buffer.from(signature, 'hex');
        const key = Buffer.from(publicKey, 'hex');
        return nacl.sign.detached.verify(message, sig, key);
    } catch {
        return false;
    }
}
