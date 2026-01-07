/**
 * Feature Gating Middleware
 * Enforces tier-based access control for features and resource limits
 */

const prisma = require('../config/db');
const { getLimits, hasFeature, getLimit, tierAtLeast } = require('../config/tierLimits');

/**
 * Middleware to require a minimum tier for a route
 * Usage: router.post('/route', requireTier('PRO'), controller.method)
 */
function requireTier(requiredTier) {
    return async (req, res, next) => {
        try {
            const workspaceId = req.query.workspaceId || req.body.workspaceId || req.params.workspaceId;

            if (!workspaceId) {
                return res.status(400).json({
                    error: 'Workspace ID required',
                    gated: true
                });
            }

            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { planTier: true }
            });

            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found' });
            }

            if (!tierAtLeast(workspace.planTier, requiredTier)) {
                return res.status(403).json({
                    error: `This feature requires ${requiredTier} plan or higher`,
                    gated: true,
                    requiredTier,
                    currentTier: workspace.planTier,
                    upgradeUrl: '/pricing'
                });
            }

            req.workspaceTier = workspace.planTier;
            next();
        } catch (error) {
            console.error('Tier check error:', error);
            res.status(500).json({ error: 'Failed to verify plan tier' });
        }
    };
}

/**
 * Middleware to require a specific feature
 * Usage: router.post('/route', requireFeature('integrations'), controller.method)
 */
function requireFeature(featureName) {
    return async (req, res, next) => {
        try {
            // Check common places for workspaceId (including :id param which may be workspaceId)
            let workspaceId = req.query.workspaceId || req.body.workspaceId || req.params.workspaceId || req.params.id;

            // If we have an ID but it's not a valid workspace, it might be a campaign ID
            if (workspaceId) {
                const workspace = await prisma.workspace.findUnique({
                    where: { id: workspaceId },
                    select: { id: true }
                });

                // If not a workspace, try looking it up as a campaign
                if (!workspace) {
                    const campaign = await prisma.campaign.findUnique({
                        where: { id: workspaceId },
                        select: { workspaceId: true }
                    });
                    if (campaign) {
                        workspaceId = campaign.workspaceId;
                    } else {
                        workspaceId = null; // Not a valid workspace or campaign
                    }
                }
            }

            if (!workspaceId) {
                console.log('[Gating] No workspaceId found for feature check:', featureName);
                return res.status(400).json({
                    error: 'Workspace ID required',
                    gated: true
                });
            }

            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { planTier: true }
            });

            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found' });
            }

            const featureEnabled = hasFeature(workspace.planTier, featureName);

            if (!featureEnabled) {
                return res.status(403).json({
                    error: `${featureName} is not available on your current plan`,
                    gated: true,
                    feature: featureName,
                    currentTier: workspace.planTier,
                    upgradeUrl: '/pricing'
                });
            }

            req.workspaceTier = workspace.planTier;
            req.featureLevel = featureEnabled; // Could be true or 'basic'/'full'
            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({ error: 'Failed to verify feature access' });
        }
    };
}

/**
 * Check resource limit (surveys, competitors, team members)
 * Returns a middleware that checks current count against tier limit
 * Usage: router.post('/surveys', checkLimit('surveys', countSurveys), controller.create)
 */
function checkLimit(resourceName, countFunction) {
    return async (req, res, next) => {
        try {
            const workspaceId = req.query.workspaceId || req.body.workspaceId || req.params.workspaceId;

            if (!workspaceId) {
                return res.status(400).json({
                    error: 'Workspace ID required',
                    gated: true
                });
            }

            const workspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { planTier: true }
            });

            if (!workspace) {
                return res.status(404).json({ error: 'Workspace not found' });
            }

            const limit = getLimit(workspace.planTier, resourceName);

            // If limit is Infinity, allow
            if (limit === Infinity) {
                req.workspaceTier = workspace.planTier;
                return next();
            }

            // Count current resources
            const currentCount = await countFunction(workspaceId);

            if (currentCount >= limit) {
                return res.status(403).json({
                    error: `You've reached the limit of ${limit} ${resourceName} on your current plan`,
                    gated: true,
                    resource: resourceName,
                    limit,
                    current: currentCount,
                    currentTier: workspace.planTier,
                    upgradeUrl: '/pricing'
                });
            }

            req.workspaceTier = workspace.planTier;
            req.resourceLimit = limit;
            req.resourceCount = currentCount;
            next();
        } catch (error) {
            console.error('Limit check error:', error);
            res.status(500).json({ error: 'Failed to verify resource limit' });
        }
    };
}

// ============ COUNT FUNCTIONS ============

/**
 * Count surveys for a workspace (through campaigns)
 */
async function countSurveys(workspaceId) {
    const count = await prisma.survey.count({
        where: {
            campaign: {
                workspaceId,
                isDeleted: false
            }
        }
    });
    return count;
}

/**
 * Count total responses for a workspace
 */
async function countResponses(workspaceId) {
    const count = await prisma.response.count({
        where: {
            survey: {
                campaign: {
                    workspaceId
                }
            }
        }
    });
    return count;
}

/**
 * Count competitors for a workspace
 */
async function countCompetitors(workspaceId) {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { competitors: true }
    });

    if (!workspace?.competitors) return 0;

    const competitors = Array.isArray(workspace.competitors)
        ? workspace.competitors
        : [];

    return competitors.length;
}

/**
 * Count team members for a workspace
 */
async function countTeamMembers(workspaceId) {
    const count = await prisma.workspaceMember.count({
        where: { workspaceId }
    });
    // Add 1 for the owner who isn't in members table
    return count + 1;
}

// ============ HELPER FOR CONTROLLERS ============

/**
 * Get gating info for a workspace (useful for frontend)
 */
async function getGatingInfo(workspaceId) {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { planTier: true }
    });

    if (!workspace) return null;

    const limits = getLimits(workspace.planTier);

    const [surveyCount, responseCount, competitorCount, memberCount] = await Promise.all([
        countSurveys(workspaceId),
        countResponses(workspaceId),
        countCompetitors(workspaceId),
        countTeamMembers(workspaceId)
    ]);

    return {
        tier: workspace.planTier,
        limits: {
            surveys: { limit: limits.surveys, current: surveyCount },
            responses: { limit: limits.responses, current: responseCount },
            competitors: { limit: limits.competitors, current: competitorCount },
            teamSeats: { limit: limits.teamSeats, current: memberCount },
        },
        features: limits.features
    };
}

module.exports = {
    requireTier,
    requireFeature,
    checkLimit,
    countSurveys,
    countResponses,
    countCompetitors,
    countTeamMembers,
    getGatingInfo
};
