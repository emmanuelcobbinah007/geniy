const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// Verify payment and activate subscription (after Paystack callback)
router.post('/verify', protect, paymentController.verifyPayment);

// Initialize subscription (returns Paystack authorization URL)
router.post('/subscribe', protect, paymentController.initializeSubscription);

// Paystack webhook (no auth - uses signature verification)
router.post('/webhook', paymentController.handleWebhook);

// Cancel subscription
router.post('/cancel', protect, paymentController.cancelSubscription);

module.exports = router;
