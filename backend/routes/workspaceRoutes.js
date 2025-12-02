const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    updateWorkspace,
    getWorkspaceMembers,
    createWorkspace,
    addMember
} = require('../controllers/workspaceController');
const { getDashboardStats, getWorkspaceHealth } = require('../controllers/dashboardController');

router.put('/:id', protect, updateWorkspace);
router.post('/', protect, createWorkspace);
router.get('/:id/members', protect, getWorkspaceMembers);
router.post('/:id/members', protect, addMember);
router.get('/dashboard', protect, getDashboardStats);
router.get('/:id/health', protect, getWorkspaceHealth);

module.exports = router;
