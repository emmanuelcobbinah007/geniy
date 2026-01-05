const prisma = require('../config/db');
const genesisAgent = require('./ai/genesis');

/**
 * DigestService - Compiles proactive digests for workspaces
 * 
 * Generates "Geniy's Weekly/Daily Briefing" with:
 * - Competitor changes detected by radar
 * - New survey responses summary
 * - AI-generated recommendations
 * - Knowledge gaps to address
 */
class DigestService {

    /**
     * Compile a digest for a specific workspace
     * @param {string} workspaceId 
     * @param {string} period - 'daily' or 'weekly'
     * @returns {object} Digest object with sections
     */
    async compileDigest(workspaceId, period = 'daily') {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                competitors: true,
                campaigns: {
                    include: {
                        surveys: {
                            include: {
                                responses: {
                                    orderBy: { submittedAt: 'desc' },
                                    take: 50
                                }
                            }
                        }
                    }
                },
                gapAnalysis: true,
                businessContext: true,
                integrations: true
            }
        });

        if (!workspace) return null;

        // Calculate time window
        const now = new Date();
        const windowStart = period === 'weekly'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Build digest sections
        const digest = {
            workspaceId,
            workspaceName: workspace.name,
            generatedAt: now.toISOString(),
            period,
            sections: {}
        };

        // 1. Competitor Updates Section
        digest.sections.competitors = await this.getCompetitorUpdates(workspace, windowStart);

        // 2. Survey Responses Section
        digest.sections.responses = this.getResponseSummary(workspace, windowStart);

        // 3. Actionable Recommendations
        digest.sections.recommendations = await this.getRecommendations(workspace);

        // 4. Knowledge Gaps
        digest.sections.gaps = this.getKnowledgeGaps(workspace);

        // 5. Quick Stats
        digest.sections.stats = this.getQuickStats(workspace, windowStart);

        return digest;
    }

    /**
     * Get competitor updates from the radar
     */
    async getCompetitorUpdates(workspace, since) {
        const updates = [];

        if (!workspace.competitors || !Array.isArray(workspace.competitors)) {
            return { count: 0, items: [] };
        }

        for (const competitor of workspace.competitors) {
            if (!competitor || typeof competitor !== 'object') continue;

            // Check if competitor has recent changes
            if (competitor.lastScanned && new Date(competitor.lastScanned) > since) {
                if (competitor.changesDetected) {
                    updates.push({
                        name: competitor.name,
                        type: 'change_detected',
                        summary: `Changes detected on ${competitor.name}'s website`,
                        details: competitor.analysis?.recentChanges || []
                    });
                }
            }

            // Check for new competitors discovered
            if (competitor.discoveredAt && new Date(competitor.discoveredAt) > since) {
                updates.push({
                    name: competitor.name,
                    type: 'new_competitor',
                    summary: `New competitor discovered: ${competitor.name}`,
                    details: competitor.analysis?.summary || ''
                });
            }
        }

        return {
            count: updates.length,
            items: updates.slice(0, 5) // Top 5 updates
        };
    }

    /**
     * Summarize survey responses in the time window
     */
    getResponseSummary(workspace, since) {
        let totalResponses = 0;
        const campaignStats = [];

        for (const campaign of workspace.campaigns || []) {
            let campaignResponses = 0;

            for (const survey of campaign.surveys || []) {
                const recentResponses = (survey.responses || []).filter(
                    r => new Date(r.submittedAt) > since
                );
                campaignResponses += recentResponses.length;
            }

            if (campaignResponses > 0) {
                campaignStats.push({
                    name: campaign.name,
                    newResponses: campaignResponses
                });
            }
            totalResponses += campaignResponses;
        }

        return {
            totalNew: totalResponses,
            campaigns: campaignStats.slice(0, 3), // Top 3 campaigns
            hasActivity: totalResponses > 0
        };
    }

    /**
     * Generate AI-powered recommendations
     */
    async getRecommendations(workspace) {
        // Quick heuristic recommendations (fast, no AI call needed)
        const recommendations = [];

        // Check for incomplete context
        if (!workspace.businessContext?.context || workspace.businessContext.context.length < 100) {
            recommendations.push({
                priority: 'high',
                text: 'Your business context is incomplete. Add more details to get better survey questions.',
                action: 'Complete Business Context',
                link: `/dashboard/${workspace.id}/context`
            });
        }

        // Check for no campaigns
        if (!workspace.campaigns || workspace.campaigns.length === 0) {
            recommendations.push({
                priority: 'high',
                text: 'You haven\'t created any campaigns yet. Start gathering customer insights!',
                action: 'Create First Survey',
                link: `/create-survey?workspaceId=${workspace.id}`
            });
        }

        // Check for low response rates
        const totalResponses = workspace.campaigns?.reduce((sum, c) =>
            sum + (c.surveys?.reduce((s, survey) => s + (survey.responses?.length || 0), 0) || 0), 0
        ) || 0;

        if (workspace.campaigns?.length > 0 && totalResponses < 5) {
            recommendations.push({
                priority: 'medium',
                text: 'Your surveys have few responses. Consider sharing them more widely or enabling voice surveys.',
                action: 'View Campaigns',
                link: `/dashboard/${workspace.id}/campaigns`
            });
        }

        // Check for unanalyzed competitors
        const unanalyzed = (workspace.competitors || []).filter(c => !c?.analysis);
        if (unanalyzed.length > 0) {
            recommendations.push({
                priority: 'medium',
                text: `${unanalyzed.length} competitor(s) haven't been deeply analyzed yet.`,
                action: 'Run Deep Analysis',
                link: `/dashboard/${workspace.id}/context?tab=competitors`
            });
        }

        return {
            count: recommendations.length,
            items: recommendations.slice(0, 3)
        };
    }

    /**
     * Extract knowledge gaps
     */
    getKnowledgeGaps(workspace) {
        const gaps = [];

        if (workspace.gapAnalysis) {
            // Extract top gaps from stored analysis
            const gapData = workspace.gapAnalysis.gaps || [];
            for (const gap of gapData.slice(0, 3)) {
                gaps.push({
                    area: gap.category || gap.area || 'General',
                    description: gap.description || gap.gap || 'Knowledge gap identified',
                    priority: gap.priority || 'medium'
                });
            }
        }

        return {
            count: gaps.length,
            items: gaps
        };
    }

    /**
     * Quick stats for the digest
     */
    getQuickStats(workspace, since) {
        const totalCampaigns = workspace.campaigns?.length || 0;
        const activeCampaigns = workspace.campaigns?.filter(c =>
            c.surveys?.some(s => s.isPublished)
        ).length || 0;

        const totalResponses = workspace.campaigns?.reduce((sum, c) =>
            sum + (c.surveys?.reduce((s, survey) => s + (survey.responses?.length || 0), 0) || 0), 0
        ) || 0;

        const newResponses = workspace.campaigns?.reduce((sum, c) =>
            sum + (c.surveys?.reduce((s, survey) =>
                s + (survey.responses?.filter(r => new Date(r.submittedAt) > since).length || 0), 0
            ) || 0), 0
        ) || 0;

        const competitorCount = (workspace.competitors || []).length;

        return {
            totalCampaigns,
            activeCampaigns,
            totalResponses,
            newResponses,
            competitorCount
        };
    }

    /**
     * Format digest for Slack/Discord delivery
     */
    formatForNotification(digest) {
        const { sections, workspaceName, period } = digest;
        const periodLabel = period === 'weekly' ? 'Weekly' : 'Daily';

        let message = '';

        // Stats overview
        if (sections.stats) {
            message += `📊 **Quick Stats**: ${sections.stats.newResponses} new responses, ${sections.stats.activeCampaigns} active campaigns\n\n`;
        }

        // Competitor updates
        if (sections.competitors?.count > 0) {
            message += `🎯 **Competitor Intel**: ${sections.competitors.count} update(s) detected\n`;
            sections.competitors.items.slice(0, 2).forEach(item => {
                message += `  • ${item.summary}\n`;
            });
            message += '\n';
        }

        // Recommendations
        if (sections.recommendations?.count > 0) {
            message += `💡 **Recommendations**:\n`;
            sections.recommendations.items.slice(0, 2).forEach(rec => {
                message += `  • ${rec.text}\n`;
            });
        }

        return {
            title: `📋 Geniy's ${periodLabel} Briefing`,
            message: message || 'All quiet on the front! Check back later for updates.',
            type: 'info',
            data: sections.recommendations?.items?.map(r => ({
                title: r.action,
                context: r.text
            })),
            link: `${process.env.FRONTEND_URL}/dashboard/${digest.workspaceId}`
        };
    }
}

module.exports = new DigestService();
