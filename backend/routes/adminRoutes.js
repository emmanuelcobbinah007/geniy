const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Admin email check middleware
const isAdmin = (req, res, next) => {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    const userEmail = req.user?.email?.toLowerCase();

    console.log('[Admin Check] User email:', userEmail);
    console.log('[Admin Check] Admin emails:', adminEmails);
    console.log('[Admin Check] Is admin:', adminEmails.includes(userEmail));

    if (!userEmail || !adminEmails.includes(userEmail)) {
        return res.status(403).json({ message: 'Admin access required' });
    }

    next();
};

// GET /api/admin/stats - Get all admin statistics
router.get('/stats', protect, isAdmin, adminController.getStats);

module.exports = router;
