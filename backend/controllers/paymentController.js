const PaymentService = require('../services/paymentService');

exports.verifyPayment = async (req, res) => {
    try {
        const { reference, workspaceId, planTier, amount } = req.body;

        if (!reference || !workspaceId || !planTier) {
            return res.status(400).json({ error: 'Missing required payment details' });
        }

        const subscription = await PaymentService.createSubscription({
            workspaceId,
            planTier,
            reference,
            amount
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified and subscription activated',
            subscription
        });

    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ error: error.message || 'Payment verification failed' });
    }
};
