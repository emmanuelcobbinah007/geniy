const radarService = require('../services/radarService');
const prisma = require('../config/db');

async function runRealScan() {
    console.log("📡 Triggering Real Radar Scan for SurveyMonkey...");

    // 1. Get Workspace
    const user = await prisma.user.findUnique({
        where: { email: 'aurorasoftwarelabs@gmail.com' },
        include: { workspaces: true }
    });

    if (!user || !user.workspaces[0]) {
        console.error("❌ No workspace found for test user.");
        return;
    }

    const workspaceId = user.workspaces[0].id;

    // 2. Ensure SurveyMonkey exists
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace.competitors.find(c => c.name.toLowerCase().includes('surveymonkey'))) {
        console.log("➕ Adding SurveyMonkey to tracking...");
        const newCompetitors = [
            ...(workspace.competitors || []),
            { name: "SurveyMonkey", url: "https://www.surveymonkey.com", radarHistory: [] }
        ];
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { competitors: newCompetitors }
        });
    }

    // 3. Run Scan
    console.log("⏳ Scanning https://www.surveymonkey.com (This may take 10-20s)...");
    const result = await radarService.scanCompetitor(workspaceId, "SurveyMonkey");

    console.log("✅ Scan Complete!");
    console.log("--- RESULT ---");
    console.log(JSON.stringify(result, null, 2));
}

runRealScan()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
