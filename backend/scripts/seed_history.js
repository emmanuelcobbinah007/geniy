const prisma = require('../config/db');

async function seedHistory() {
    console.log("🌱 Seeding Mock Radar History...");

    // 1. Find the user/workspace (Aurora Software Labs)
    const user = await prisma.user.findUnique({
        where: { email: 'aurorasoftwarelabs@gmail.com' },
        include: {
            workspaces: {
                include: {
                    members: true
                }
            }
        }
    });

    if (!user || user.workspaces.length === 0) {
        console.error("❌ User or Workspace not found. Please log in first.");
        return;
    }

    const workspaceId = user.workspaces[0].id;
    console.log(`📍 Target Workspace: ${user.workspaces[0].name} (${workspaceId})`);

    // 2. Find SurveyMonkey or creating it if missing
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    let competitors = workspace.competitors || [];

    let targetIndex = competitors.findIndex(c => c.name.toLowerCase().includes('surveymonkey'));

    if (targetIndex === -1) {
        console.log("⚠️ SurveyMonkey not found, adding it...");
        competitors.push({
            name: "SurveyMonkey",
            url: "https://www.surveymonkey.com",
            analysis: "Leading survey platform.",
            radarHistory: []
        });
        targetIndex = competitors.length - 1;
    }

    // 3. Generate 15 Mock History Entries
    const mockHistory = [];
    const interactions = [
        "Updated pricing page: 'Team Plan' increased by $5.",
        "New feature detected: 'AI Survey Generator' added to homepage.",
        "Changed hero headline from 'Easy Surveys' to 'Power Your Curiosity'.",
        "Added 'Enterprise' section to navigation menu.",
        "Removed 'Free Tier' comparison from pricing table.",
        "Blog post: 'Q4 Trends' featured on landing page.",
        "Updated footer links: Added 'Careers' and 'Trust Center'.",
        "Modified 'Solutions' dropdown: Added 'HR' and 'CX' categories.",
        "Detected layout shift on 'Features' page.",
        "New testimonial carousel added to social proof section.",
        "Changed CTA button color from Green to Gold.",
        "Added 'GDPR Compliance' badge to checkout page.",
        "Updated 'About Us' leadership team photos.",
        "New integration partner 'Slack' listed.",
        "Minor text tweaks on 'Contact' page."
    ];

    const today = new Date();

    for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i); // Go back i days

        mockHistory.push({
            date: date.toISOString(),
            status: i % 3 === 0 ? "changed" : "stable", // Make every 3rd one a change
            insight: interactions[i]
        });
    }

    // 4. Update
    competitors[targetIndex].radarHistory = mockHistory;
    competitors[targetIndex].radarStatus = 'changed'; // Validates the "Pulse" too
    competitors[targetIndex].lastScrapedAt = new Date().toISOString();

    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { competitors: competitors }
    });

    console.log("✅ Successfully seeded 15 history entries for SurveyMonkey!");
}

seedHistory()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
