const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkLimit, requireFeature, countTeamMembers } = require('../middleware/gatingMiddleware');
const {
    updateWorkspace,
    getWorkspace,
    getWorkspaceMembers,
    createWorkspace,
    addMember,
    saveIntegrations,
    testIntegrations
} = require('../controllers/workspaceController');
const { getDashboardStats, getWorkspaceHealth } = require('../controllers/dashboardController');
const { addDomain, getDomains, verifyDomain, deleteDomain } = require('../controllers/domainController');

router.put('/:id', protect, updateWorkspace);
router.post('/', protect, createWorkspace);
router.get('/:id/members', protect, getWorkspaceMembers);

// Add team member
// GATED: Team seat limit (FREE: 1, STARTER: 1, PRO: 5)
router.post('/:id/members', protect, checkLimit('teamSeats', countTeamMembers), addMember);

router.get('/dashboard', protect, getDashboardStats);
router.get('/:id/health', protect, getWorkspaceHealth);
router.get('/:id', protect, getWorkspace);

// Save integrations (Slack/Discord webhooks)
// GATED: Requires integrations feature (PRO+)
router.put('/:id/integrations', protect, requireFeature('integrations'), saveIntegrations);

// Test integrations
// GATED: Requires integrations feature (PRO+)
router.post('/:id/integrations/test', protect, requireFeature('integrations'), testIntegrations);

// Domain Routes - Available to all (custom domain for surveys)
router.post('/:workspaceId/domains', protect, addDomain);
router.get('/:workspaceId/domains', protect, getDomains);
router.post('/:workspaceId/domains/:domainId/verify', protect, verifyDomain);
router.delete('/:workspaceId/domains/:domainId', protect, deleteDomain);

// Get gating info (limits and feature access for UI)
const { getGatingInfo } = require('../middleware/gatingMiddleware');
router.get('/:id/gating', protect, async (req, res) => {
    try {
        const info = await getGatingInfo(req.params.id);
        if (!info) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        res.json(info);
    } catch (error) {
        console.error('Gating info error:', error);
        res.status(500).json({ error: 'Failed to get gating info' });
    }
});

module.exports = router;
