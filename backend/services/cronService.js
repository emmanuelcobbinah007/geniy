const cron = require('node-cron');
const db = require('../config/db');
const radarService = require('./radarService');

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
    }
}

module.exports = new CronService();
