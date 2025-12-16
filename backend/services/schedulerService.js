const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const radarService = require('./radarService');
const prisma = new PrismaClient();

class SchedulerService {
    constructor() {
        this.jobs = [];
    }

    init() {
        console.log('⏰ Initializing Scheduler Service...');

        // Schedule Daily Competitor Scan (Midnight)
        // Cron: "0 0 * * *" = At 00:00 every day
        this.scheduleJob('0 0 * * *', async () => {
            console.log('⏰ Starting Daily Competitor Radar Scan...');
            await this.runBatchScan();
        });

        console.log('✅ Scheduler initialized.');
    }

    scheduleJob(cronExpression, task) {
        const job = cron.schedule(cronExpression, task);
        this.jobs.push(job);
    }

    /**
     * Iterates through all workspaces and scans all competitors.
     * Note: In production, this should be a queue (BullMQ/Redis), not a loop.
     */
    async runBatchScan() {
        try {
            const workspaces = await prisma.workspace.findMany({
                where: {
                    competitors: {
                        not: PrismaClient.JsonNull
                    }
                }
            });

            console.log(`⏰ Found ${workspaces.length} workspaces to scan.`);

            for (const workspace of workspaces) {
                const competitors = workspace.competitors;
                if (!Array.isArray(competitors) || competitors.length === 0) continue;

                console.log(`   > Scanning ${competitors.length} competitors for Workspace ${workspace.id}`);

                for (const comp of competitors) {
                    try {
                        // Rate limiting protection: Wait 5 seconds between scans
                        await new Promise(r => setTimeout(r, 5000));
                        await radarService.scanCompetitor(workspace.id, comp.name);
                    } catch (err) {
                        console.error(`   ❌ Failed to scan ${comp.name}:`, err.message);
                    }
                }
            }
            console.log('✅ Daily Radar Scan Complete.');

        } catch (error) {
            console.error("Critical Scheduler Error:", error);
        }
    }
}

module.exports = new SchedulerService();
