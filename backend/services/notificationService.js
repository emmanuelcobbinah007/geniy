const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            const payload = {
                attachments: [
                    {
                        color: color,
                        title: event.title,
                        title_link: event.link,
                        text: event.message,
                        footer: "Geniy Competitor Radar",
                        ts: Math.floor(Date.now() / 1000)
                    }
                ]
            };
            await axios.post(webhookUrl, payload);
            console.log("✅ Sent Slack notification");
        } catch (err) {
            console.error("Failed to send to Slack:", err.message);
        }
    }

    async sendToDiscord(webhookUrl, event) {
        try {
            const color = event.type === 'warning' ? 16098066 : (event.type === 'success' ? 1096193 : 3901686);
            const payload = {
                embeds: [{
                    title: event.title,
                    url: event.link,
                    description: event.message,
                    color: color,
                    footer: { text: "Geniy Competitor Radar" },
                    timestamp: new Date().toISOString()
                }]
            };
            await axios.post(webhookUrl, payload);
            console.log("✅ Sent Discord notification");
        } catch (err) {
            console.error("Failed to send to Discord:", err.message);
        }
    }
}

module.exports = new NotificationService();
