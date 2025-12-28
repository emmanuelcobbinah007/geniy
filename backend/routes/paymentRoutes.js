const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Verify payment and activate subscription
router.post('/verify', protect, paymentController.verifyPayment);

module.exports = router;
