const prisma = require('../config/db');

/**
 * Admin Controller
 * Provides statistics and metrics for the admin dashboard
 */

/**
 * Get all admin stats
 * @route GET /api/admin/stats
 */
exports.getStats = async (req, res) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Run all queries in parallel
        const [
            // User stats
            totalUsers,
            usersLast7Days,
            usersLast30Days,

            // Workspace stats by plan tier
            totalWorkspaces,
            freeWorkspaces,
            starterWorkspaces,
            proWorkspaces,

            // Subscription stats
            activeSubscriptions,
            trialingSubscriptions,
            cancelledSubscriptions,

            // Content stats
            totalSurveys,
            totalResponses,

            // Transaction stats
            transactions,

            // Recent signups
            recentUsers,

            // Early adopters
            earlyAdopters
        ] = await Promise.all([
            // Users
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

            // Workspaces by tier
            prisma.workspace.count(),
            prisma.workspace.count({ where: { planTier: 'FREE' } }),
            prisma.workspace.count({ where: { planTier: 'STARTER' } }),
            prisma.workspace.count({ where: { planTier: 'PRO' } }),

            // Subscriptions with details
            prisma.subscription.findMany({
                where: { status: 'active' },
                select: {
                    id: true,
                    planTier: true,
                    currentPeriodEnd: true,
                    workspace: {
                        select: {
                            name: true,
                            owner: { select: { name: true, email: true } }
                        }
                    }
                }
            }),
            prisma.subscription.findMany({
                where: { status: 'trialing' },
                select: {
                    id: true,
                    planTier: true,
                    currentPeriodEnd: true,
                    workspace: {
                        select: {
                            name: true,
                            owner: { select: { name: true, email: true } }
                        }
                    }
                }
            }),
            prisma.subscription.findMany({
                where: { status: 'cancelled' },
                select: {
                    id: true,
                    planTier: true,
                    currentPeriodEnd: true,
                    workspace: {
                        select: {
                            name: true,
                            owner: { select: { name: true, email: true } }
                        }
                    }
                }
            }),

            // Content
            prisma.survey.count(),
            prisma.response.count(),

            // Transactions (all successful)
            prisma.transaction.findMany({
                where: { status: 'success' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                    planTier: true,
                    createdAt: true,
                    workspace: {
                        select: { name: true }
                    }
                }
            }),

            // Recent signups (last 10)
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    workspaces: {
                        select: { name: true, planTier: true },
                        take: 1
                    }
                }
            }),

            // Early adopters count
            prisma.workspace.count({ where: { isEarlyAdopter: true } })
        ]);

        // Calculate total revenue
        const allTransactions = await prisma.transaction.findMany({
            where: { status: 'success' },
            select: { amount: true }
        });
        const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);

        res.json({
            users: {
                total: totalUsers,
                last7Days: usersLast7Days,
                last30Days: usersLast30Days
            },
            workspaces: {
                total: totalWorkspaces,
                byTier: {
                    free: freeWorkspaces,
                    starter: starterWorkspaces,
                    pro: proWorkspaces
                },
                earlyAdopters
            },
            subscriptions: {
                active: { count: activeSubscriptions.length, list: activeSubscriptions },
                trialing: { count: trialingSubscriptions.length, list: trialingSubscriptions },
                cancelled: { count: cancelledSubscriptions.length, list: cancelledSubscriptions }
            },
            content: {
                surveys: totalSurveys,
                responses: totalResponses
            },
            revenue: {
                total: totalRevenue,
                currency: 'GHS'
            },
            recentUsers,
            recentTransactions: transactions
        });

    } catch (error) {
        console.error('[Admin] Stats error:', error);
        res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
};
