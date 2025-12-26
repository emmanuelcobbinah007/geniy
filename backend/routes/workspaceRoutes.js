const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
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
const { initializeTransaction, verifyTransaction } = require('../controllers/paymentController');
const { addDomain, getDomains, verifyDomain, deleteDomain } = require('../controllers/domainController');

router.put('/:id', protect, updateWorkspace);
router.post('/', protect, createWorkspace);
router.get('/:id/members', protect, getWorkspaceMembers);
router.post('/:id/members', protect, addMember);
router.get('/dashboard', protect, getDashboardStats);
router.get('/:id/health', protect, getWorkspaceHealth);
router.get('/:id', protect, getWorkspace);
router.put('/:id/integrations', protect, saveIntegrations);
router.post('/:id/integrations/test', protect, testIntegrations);
router.post('/paystack/initialize', protect, initializeTransaction);
router.post('/paystack/verify', protect, verifyTransaction);

// Domain Routes
router.post('/:workspaceId/domains', protect, addDomain);
router.get('/:workspaceId/domains', protect, getDomains);
router.post('/:workspaceId/domains/:domainId/verify', protect, verifyDomain);
router.delete('/:workspaceId/domains/:domainId', protect, deleteDomain);

module.exports = router;
