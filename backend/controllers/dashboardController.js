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

        // SELF-HEALING: Normalize competitors first (needed for strategy feed)
        let competitors = workspace.competitors || [];
        let modified = false;

        const normalizedCompetitors = competitors.map(c => {
            if (typeof c === 'string') {
                console.log(`⚠️  Auto-fixing string competitor: "${c}"`);
                modified = true;
                return {
                    name: c,
                    url: '',
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

        // 4. Dynamic Strategy Feed (Based on actual data)
        const strategyFeed = [];

        // Check competitor changes
        const competitorChanges = normalizedCompetitors.filter(c =>
            c.radarHistory && c.radarHistory.some(h =>
                h.status === 'changed' &&
                h.insight !== 'Initial baseline established.' &&
                new Date(h.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            )
        );

        if (competitorChanges.length > 0) {
            strategyFeed.push({
                title: `${competitorChanges.length} Competitor Update${competitorChanges.length > 1 ? 's' : ''} Detected`,
                desc: `${competitorChanges.map(c => c.name).join(', ')} made changes recently.`,
                action: "View Intel",
                color: "amber",
                link: `/dashboard/${workspaceId}/context?tab=competitors`
            });
        }

        if (totalResponses >= 5) {
            strategyFeed.push({
                title: "Survey Insights Available",
                desc: `You have ${totalResponses} responses. Analyze patterns and preferences.`,
                action: "View Insights",
                color: "violet",
                link: `/dashboard/${workspaceId}/campaigns`
            });
        }

        if (workspace.gapAnalysis) {
            const gaps = workspace.gapAnalysis.gaps || [];
            const criticalGaps = gaps.filter(g => g.priority === 'high' || g.priority === 'critical');
            if (criticalGaps.length > 0) {
                strategyFeed.push({
                    title: `${criticalGaps.length} Knowledge Gap${criticalGaps.length > 1 ? 's' : ''} Found`,
                    desc: `Address ${criticalGaps[0]?.area || 'strategic areas'} to strengthen position.`,
                    action: "View Analysis",
                    color: "rose",
                    link: `/dashboard/${workspaceId}/context`
                });
            }
        }

        if (workspace._count.campaigns === 0) {
            strategyFeed.push({
                title: "Launch Your First Survey",
                desc: "Gather customer insights to inform your product strategy.",
                action: "Create Survey",
                color: "emerald",
                link: `/create-survey?workspaceId=${workspaceId}`
            });
        } else if (totalResponses < 5) {
            strategyFeed.push({
                title: "Collect More Responses",
                desc: "More responses will unlock deeper insights.",
                action: "Share Survey",
                color: "blue",
                link: `/dashboard/${workspaceId}/campaigns`
            });
        }

        if (!workspace.businessContext || workspace.businessContext.length < 100) {
            strategyFeed.push({
                title: "Complete Your Context",
                desc: "Add more business context to improve AI recommendations.",
                action: "Update Context",
                color: "zinc",
                link: `/dashboard/${workspaceId}/context`
            });
        }

        if (strategyFeed.length === 0) {
            strategyFeed.push({
                title: "Context Analysis Ready",
                desc: "Your business context has been processed. Ready to generate surveys.",
                action: "Create Survey",
                color: "green",
                link: `/create-survey?workspaceId=${workspaceId}`
            });
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
            competitors: normalizedCompetitors,
            integrations: workspace.integrations
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

exports.getActivity = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ error: "Workspace ID is required" });
        }

        // Get responses
        const recentResponses = await prisma.response.findMany({
            where: {
                survey: {
                    campaign: {
                        workspaceId: workspaceId
                    }
                }
            },
            take: 20,
            orderBy: { submittedAt: 'desc' },
            include: {
                survey: { select: { title: true } }
            }
        });

        // Get workspace for competitor activity
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { competitors: true }
        });

        const activities = [];

        // Add response activities
        recentResponses.forEach(r => {
            activities.push({
                id: `response-${r.id}`,
                type: 'response',
                title: 'New Survey Response',
                description: `Response received on "${r.survey.title}"`,
                timestamp: r.submittedAt,
                timeAgo: getTimeAgo(r.submittedAt)
            });
        });

        // Add competitor radar activities from history
        if (workspace?.competitors) {
            workspace.competitors.forEach(comp => {
                if (comp?.radarHistory) {
                    comp.radarHistory.slice(0, 5).forEach((entry, i) => {
                        if (entry.status === 'changed' && entry.insight !== 'Initial baseline established.') {
                            activities.push({
                                id: `competitor-${comp.name}-${i}`,
                                type: 'competitor',
                                title: `Competitor Update: ${comp.name}`,
                                description: entry.insight || 'Content changed detected',
                                timestamp: entry.date,
                                timeAgo: getTimeAgo(new Date(entry.date))
                            });
                        }
                    });
                }
            });
        }

        // Sort by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ activities: activities.slice(0, 50) });

    } catch (error) {
        console.error("Activity Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch activity" });
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
