const axios = require('axios');
const prisma = require('../config/db');

class NotificationService {

    /**
     * Sends a notification to all configured channels for a workspace.
     * @param {string} workspaceId 
     * @param {object} event - { title, message, link, type: 'info'|'warning'|'success' }
     */
    async send(workspaceId, event) {
        try {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { integrations: true, name: true }
            });

            if (!workspace || !workspace.integrations) {
                return; // No integrations configured
            }

            const { slackWebhook, discordWebhook } = workspace.integrations;
            const promises = [];

            if (slackWebhook) {
                promises.push(this.sendToSlack(slackWebhook, event));
            }

            if (discordWebhook) {
                promises.push(this.sendToDiscord(discordWebhook, event));
            }

            await Promise.allSettled(promises);

        } catch (error) {
            console.error(`❌ Notification failed for workspace ${workspaceId}:`, error.message);
        }
    }

    async sendToSlack(webhookUrl, event) {
        try {
            const color = event.type === 'warning' ? '#f59e0b' : (event.type === 'success' ? '#10b981' : '#3b82f6');

            // Personality Injection 🤖✨
            const intros = [
                "Hey team, just spotted this:",
                "Quick update for you:",
                "Heads up, new intel just dropped:",
                "Keeping you in the loop:"
            ];
            const intro = intros[Math.floor(Math.random() * intros.length)];

            // Build Blocks for Rich Layout
            let blocks = [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*${event.title}*\n${intro} ${event.message}`
                    }
                }
            ];

            // If we have specific data insights (e.g., gap analysis points), add them as list items
            if (event.data && Array.isArray(event.data)) {
                const points = event.data.map(d => {
                    if (typeof d === 'string') return `• ${d}`;
                    // Rich object handling
                    return `*${d.title}*\n_${d.context}_`;
                }).join('\n\n');

                blocks.push({
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: points
                    }
                });
            }

            // Button/Link
            blocks.push({
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: "View Details"
                        },
                        url: event.link,
                        style: "primary"
                    }
                ]
            });

            const payload = {
                blocks: blocks,
                attachments: [
                    {
                        color: color,
                        fallback: event.message
                    }
                ]
            };

            await axios.post(webhookUrl, payload);
            console.log("✅ Sent Slack notification (Rich)");
        } catch (err) {
            console.error("Failed to send to Slack:", err.message);
        }
    }

    async sendToDiscord(webhookUrl, event) {
        try {
            const color = event.type === 'warning' ? 16098066 : (event.type === 'success' ? 1096193 : 3901686);

            // Personality Injection 🤖✨
            const intros = [
                "Hey team, just spotted this:",
                "Quick update for you:",
                "Heads up, new intel just dropped:",
                "Geniy here with an update:"
            ];
            const intro = intros[Math.floor(Math.random() * intros.length)];

            let description = `${intro} ${event.message}`;

            // Add rich data points if available
            if (event.data && Array.isArray(event.data)) {
                const points = event.data.map(d => {
                    if (typeof d === 'string') return `• ${d}`;
                    return `**${d.title}**\n*${d.context}*`;
                }).join('\n\n');
                description += "\n\n**Top Insights:**\n" + points;
            }

            const payload = {
                embeds: [{
                    title: event.title,
                    url: event.link,
                    description: description,
                    color: color,
                    footer: { text: "Geniy Competitor Radar • " + new Date().toLocaleTimeString() },
                    timestamp: new Date().toISOString()
                }]
            };
            await axios.post(webhookUrl, payload);
            console.log("✅ Sent Discord notification (Rich)");
        } catch (err) {
            console.error("Failed to send to Discord:", err.message);
        }
    }

    /**
     * Send a welcome/introduction message when Geniy is first connected
     * @param {string} workspaceId 
     * @param {string} platform - 'slack' or 'discord'
     */
    async sendWelcome(workspaceId, platform) {
        try {
            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { integrations: true, name: true }
            });

            if (!workspace || !workspace.integrations) return;

            const welcomeMessage = {
                title: `Hey there! I'm Geniy, your strategic co-pilot.`,
                message: `I'm now connected to **${workspace.name}** and here to help your team stay sharp.

**What I'll do:**
- Send you periodic briefings with competitor updates and recommendations
- Keep you in the loop when something important happens

**How to chat with me:**
Just @mention me and talk naturally - I'll figure out what you need:
- "How are we doing?" → Status update
- "What should we focus on?" → My recommendations
- "Tell me about [competitor]" → Intel on them
- Or ask anything about your business!

Looking forward to working with you.`,
                type: 'info',
                link: `${process.env.FRONTEND_URL}/dashboard/${workspaceId}`
            };

            if (platform === 'slack' && workspace.integrations.slackWebhook) {
                await this.sendToSlack(workspace.integrations.slackWebhook, welcomeMessage);
            }

            if (platform === 'discord' && workspace.integrations.discordWebhook) {
                await this.sendToDiscord(workspace.integrations.discordWebhook, welcomeMessage);
            }

            console.log(`✅ Sent welcome message to ${platform} for ${workspace.name}`);

        } catch (error) {
            console.error(`Failed to send welcome to ${platform}:`, error.message);
        }
    }
}

module.exports = new NotificationService();
