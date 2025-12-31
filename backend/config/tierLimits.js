/**
 * Tier Limits Configuration
 * Defines feature limits for each plan tier
 */

const TIER_ORDER = ['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'];

const TIER_LIMITS = {
    FREE: {
        surveys: 1,
        responses: 25,
        competitors: 1,
        teamSeats: 1,
        features: {
            integrations: false,      // Slack/Discord
            aiInsights: false,        // AI-generated insights
            csvExport: false,         // Export responses
            gapAnalysis: false,       // Gap analysis
            strategyReports: false,   // Strategy reports
            geniyChat: true,          // Chat with Geniy (available to all)
            realTimeScans: false,     // Real-time competitor scans
        }
    },
    STARTER: {
        surveys: Infinity,
        responses: Infinity,
        competitors: 3,
        teamSeats: 1,
        features: {
            integrations: false,
            aiInsights: true,
            csvExport: true,
            gapAnalysis: 'basic',     // Basic gap analysis
            strategyReports: false,
            geniyChat: true,
            realTimeScans: false,     // Daily scans only
        }
    },
    PRO: {
        surveys: Infinity,
        responses: Infinity,
        competitors: 10,
        teamSeats: 5,
        features: {
            integrations: true,       // Slack/Discord enabled
            aiInsights: true,
            csvExport: true,
            gapAnalysis: 'full',      // Full SWOT + recommendations
            strategyReports: true,
            geniyChat: true,
            realTimeScans: true,      // Real-time scans
        }
    },
    BUSINESS: {
        surveys: Infinity,
        responses: Infinity,
        competitors: 25,
        teamSeats: 15,
        features: {
            integrations: true,
            aiInsights: true,
            csvExport: true,
            gapAnalysis: 'full',
            strategyReports: true,
            geniyChat: true,
            realTimeScans: true,
        }
    },
    ENTERPRISE: {
        surveys: Infinity,
        responses: Infinity,
        competitors: Infinity,
        teamSeats: Infinity,
        features: {
            integrations: true,
            aiInsights: true,
            csvExport: true,
            gapAnalysis: 'full',
            strategyReports: true,
            geniyChat: true,
            realTimeScans: true,
            whiteLabel: true,        // Enterprise-only
            customAI: true,          // Enterprise-only
            sso: true,               // Enterprise-only
        }
    }
};

/**
 * Get limits for a specific tier
 */
function getLimits(tier) {
    return TIER_LIMITS[tier] || TIER_LIMITS.FREE;
}

/**
 * Check if a tier has access to a specific feature
 */
function hasFeature(tier, featureName) {
    const limits = getLimits(tier);
    return limits.features[featureName] || false;
}

/**
 * Get numeric limit for a specific resource
 */
function getLimit(tier, resource) {
    const limits = getLimits(tier);
    return limits[resource] !== undefined ? limits[resource] : 0;
}

/**
 * Check if tier A is at least as high as tier B
 */
function tierAtLeast(currentTier, requiredTier) {
    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const requiredIndex = TIER_ORDER.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
}

module.exports = {
    TIER_LIMITS,
    TIER_ORDER,
    getLimits,
    hasFeature,
    getLimit,
    tierAtLeast
};
