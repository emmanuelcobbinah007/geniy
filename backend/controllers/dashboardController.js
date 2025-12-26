const prisma = require('../config/db');

const gapAgent = require('../services/ai/gapAgent');
const { decrypt } = require('../utils/encryption');

exports.getDashboardStats = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
        }

        // 1. Get Workspace Details (Context Health)
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                _count: {
                    select: { campaigns: true, documents: true }
                }
            }
        });

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Calculate Context Health Score (Static for fast load)
        let healthScore = 0;
        if (workspace.businessContext && workspace.businessContext.length > 50) healthScore += 50;
        if (workspace._count.documents > 0) healthScore += 25;
        if (workspace._count.campaigns > 0) healthScore += 25;

        // 2. Get Total Responses & Conversion Rate (Mocked conversion for now)
        const totalResponses = await prisma.response.count({
            where: {
                survey: {
                    campaign: {
                        workspaceId: workspaceId
                    }
                }
            }
        });

        // 3. Get Recent Activity (Pulse)
        const recentResponses = await prisma.response.findMany({
            where: {
                survey: {
                    campaign: {
                        workspaceId: workspaceId
                    }
                }
            },
            take: 5,
            orderBy: {
                submittedAt: 'desc'
            },
            include: {
                survey: {
                    select: { title: true }
                }
            }
        });

        // 4. Mock Strategy Feed (For now, until we have an Insight model populated)
        // In the future, this will query prisma.aIInsight
        const strategyFeed = [
            {
                title: "Context Analysis Ready",
                desc: "Your business context has been processed. Ready to generate surveys.",
                action: "Create Survey",
                color: "green",
                link: `/create-survey?workspaceId=${workspaceId}`
            }
        ];

        if (totalResponses > 10) {
            strategyFeed.unshift({
                title: "New Insights Available",
                desc: `You have ${totalResponses} responses. Time to analyze?`,
                action: "View Insights",
                color: "blue",
                link: "#" // TODO: Link to analytics
            });
        }

        // SELF-HEALING: Normalize competitors if they are strings (legacy data)
        let competitors = workspace.competitors || [];
        let modified = false;

        const normalizedCompetitors = competitors.map(c => {
            if (typeof c === 'string') {
                console.log(`⚠️  Auto-fixing string competitor: "${c}"`);
                modified = true;
                return {
                    name: c,
                    url: '', // Empty URL will trigger auto-discovery next scan
                    radarStatus: 'stable',
                    lastScrapedAt: null,
                    contentHash: null
                };
            }
            return c;
        });

        if (modified) {
            await prisma.workspace.update({
                where: { id: workspaceId },
                data: { competitors: normalizedCompetitors }
            });
            console.log("✅ Competitors data normalized and saved to DB.");
        }

        console.log(`📊 Dashboard sending ${normalizedCompetitors.length} competitors.`);

        res.json({
            stats: {
                totalResponses,
                conversionRate: 0, // Placeholder
                healthScore,
                campaignCount: workspace._count.campaigns
            },
            recentActivity: recentResponses.map(r => ({
                id: r.id,
                surveyTitle: r.survey.title,
                submittedAt: r.submittedAt,
                timeAgo: getTimeAgo(r.submittedAt)
            })),
            strategyFeed,
            competitors: normalizedCompetitors
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};

exports.getWorkspaceHealth = async (req, res) => {
    try {
        const { id: workspaceId } = req.params;
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { documents: true }
        });

        if (!workspace) return res.status(404).json({ error: "Workspace not found" });

        // Decrypt business context
        const decryptedContext = decrypt(workspace.businessContext || "");

        // Call Gap Agent
        const analysis = await gapAgent.analyze(
            decryptedContext,
            workspace.documents.map(d => d.filename)
        );

        res.json(analysis);
    } catch (error) {
        console.error("Health Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze health" });
    }
};

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}
