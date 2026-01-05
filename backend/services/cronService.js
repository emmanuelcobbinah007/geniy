const cron = require('node-cron');
const db = require('../config/db');
const radarService = require('./radarService');
const digestService = require('./digestService');
const notificationService = require('./notificationService');

class CronService {
    constructor() {
        this.jobs = [];
    }

    init() {
        console.log('⏰ CRON: Initializing scheduled tasks...');

        // Schedule Daily Radar Scan at Midnight (00:00)
        // 0 0 * * * = At 00:00 every day
        const dailyScan = cron.schedule('0 0 * * *', async () => {
            console.log('⏰ CRON: Starting Daily Radar Scan for all workspaces...');

            try {
                // Get all workspaces with competitors
                const workspaces = await db.workspace.findMany({
                    where: {
                        competitors: {
                            not: {
                                equals: []
                            }
                        }
                    }
                });

                console.log(`⏰ CRON: Found ${workspaces.length} workspaces to scan.`);

                for (const workspace of workspaces) {
                    if (!workspace.competitors || !Array.isArray(workspace.competitors)) continue;

                    for (const competitor of workspace.competitors) {
                        try {
                            if (competitor && competitor.name) {
                                await radarService.scanCompetitor(workspace.id, competitor.name);
                                // Add a small delay between scans to avoid rate limiting
                                await new Promise(resolve => setTimeout(resolve, 5000));
                            }
                        } catch (err) {
                            console.error(`⏰ CRON: Failed to scan ${competitor.name} for workspace ${workspace.id}:`, err.message);
                        }
                    }
                }

                console.log('⏰ CRON: Daily Radar Scan completed.');

            } catch (error) {
                console.error('⏰ CRON: Critical error in daily scan:', error);
            }
        });

        this.jobs.push(dailyScan);
        console.log('✅ CRON: Daily Radar Scan scheduled (00:00).');

        // =================================================================
        // DIGEST JOBS
        // =================================================================

        // Daily Digest at 9:00 AM
        const dailyDigest = cron.schedule('0 9 * * *', async () => {
            console.log('📬 CRON: Starting Daily Digest delivery...');
            await this.sendDigests('daily');
        });

        this.jobs.push(dailyDigest);
        console.log('✅ CRON: Daily Digest scheduled (09:00).');

        // Weekly Digest on Mondays at 9:00 AM
        const weeklyDigest = cron.schedule('0 9 * * 1', async () => {
            console.log('📬 CRON: Starting Weekly Digest delivery...');
            await this.sendDigests('weekly');
        });

        this.jobs.push(weeklyDigest);
        console.log('✅ CRON: Weekly Digest scheduled (Mondays 09:00).');
    }

    /**
     * Send digests to all workspaces with configured preferences
     */
    async sendDigests(period) {
        try {
            // Get all workspaces with integrations configured
            const workspaces = await db.workspace.findMany({
                where: {
                    integrations: {
                        not: null
                    }
                }
            });

            console.log(`📬 CRON: Found ${workspaces.length} workspaces for ${period} digest.`);

            for (const workspace of workspaces) {
                try {
                    const integrations = workspace.integrations || {};

                    // Check if this workspace wants this type of digest
                    const digestFrequency = integrations.digestFrequency || 'weekly';

                    // Skip if frequency doesn't match
                    if (digestFrequency === 'off') continue;
                    if (period === 'daily' && digestFrequency !== 'daily') continue;
                    if (period === 'weekly' && digestFrequency === 'daily') continue;

                    // Check if they have any notification channels
                    if (!integrations.slackWebhook && !integrations.discordWebhook) continue;

                    // Compile and send digest
                    const digest = await digestService.compileDigest(workspace.id, period);

                    if (!digest) continue;

                    // Format for notification
                    const notification = digestService.formatForNotification(digest);

                    // Send via notification service
                    await notificationService.send(workspace.id, notification);

                    console.log(`📬 CRON: Sent ${period} digest to ${workspace.name}`);

                    // Small delay between sends
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (err) {
                    console.error(`📬 CRON: Failed to send digest to ${workspace.id}:`, err.message);
                }
            }

            console.log(`📬 CRON: ${period} digest delivery completed.`);

        } catch (error) {
            console.error(`📬 CRON: Critical error in ${period} digest:`, error);
        }
    }
}

module.exports = new CronService();
