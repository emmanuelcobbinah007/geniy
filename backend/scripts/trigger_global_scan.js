const cronService = require('../services/cronService');
const prisma = require('../config/db');

async function triggerGlobalScan() {
    console.log("🌍 Triggering GLOBAL Radar Scan for ALL Workspaces...");
    console.log("⏳ This may take several minutes depending on the number of competitors...");

    try {
        // Reuse the existing logic in cronService which handles iterating all workspaces
        await cronService.runDailyScan();
        console.log("✅ Global Scan Completed Successfully!");
    } catch (error) {
        console.error("❌ Global Scan Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

triggerGlobalScan();
