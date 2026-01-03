const PaymentService = require('../services/paymentService');
const crypto = require('crypto');

/**
 * Verify a payment and activate subscription
 */
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

/**
 * Initialize a subscription with Paystack (for pricing modal signup or upgrade)
 * Creates authorization URL for user to enter card details
 */
exports.initializeSubscription = async (req, res) => {
    try {
        const { email, planTier, workspaceId, hasTrial, isUpgrade, isNewWorkspace, workspaceName } = req.body;

        if (!email || !planTier) {
            return res.status(400).json({ error: 'Missing required fields: email, planTier' });
        }

        // For upgrades, workspaceId is required
        if (isUpgrade && !workspaceId) {
            return res.status(400).json({ error: 'workspaceId is required for upgrades' });
        }

        // For new workspace, workspaceName is helpful but not required here
        // (workspace created after payment callback)

        // Validate tier
        if (!['STARTER', 'PRO'].includes(planTier)) {
            return res.status(400).json({ error: 'Invalid plan tier. Must be STARTER or PRO' });
        }

        const result = await PaymentService.initializePaystackSubscription({
            email,
            planTier,
            workspaceId: workspaceId || 'pending', // Use 'pending' for new workspace flows
            hasTrial: hasTrial === true && !isUpgrade, // No trial for upgrades
            isUpgrade: isUpgrade === true,
            workspaceName: workspaceName || null,
        });

        res.status(200).json({
            success: true,
            authorization_url: result.authorization_url,
            reference: result.reference,
            access_code: result.access_code
        });

    } catch (error) {
        console.error('Subscription Initialization Error:', error);
        res.status(500).json({ error: error.message || 'Failed to initialize subscription' });
    }
};

/**
 * Paystack Webhook Handler
 * Receives events from Paystack (subscription.create, charge.success, etc.)
 */
exports.handleWebhook = async (req, res) => {
    try {
        // Verify webhook signature
        const hash = crypto
            .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            console.error('Webhook signature verification failed');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body;
        console.log('Paystack Webhook Event:', event.event);

        switch (event.event) {
            case 'subscription.create':
                await handleSubscriptionCreate(event.data);
                break;

            case 'charge.success':
                await handleChargeSuccess(event.data);
                break;

            case 'subscription.not_renew':
            case 'subscription.disable':
                await handleSubscriptionCancel(event.data);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data);
                break;

            default:
                console.log('Unhandled webhook event:', event.event);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

// Webhook event handlers
async function handleSubscriptionCreate(data) {
    console.log('Subscription created:', data.subscription_code);

    const workspaceId = data.metadata?.workspaceId;
    if (!workspaceId) {
        console.error('No workspaceId in subscription metadata');
        return;
    }

    const prisma = require('../config/db');

    // Calculate period dates
    const startDate = new Date();
    const endDate = new Date(data.next_payment_date);

    await prisma.subscription.upsert({
        where: { workspaceId },
        update: {
            status: 'active',
            paystackSubscriptionCode: data.subscription_code,
            paystackEmailToken: data.customer?.email,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
        },
        create: {
            workspaceId,
            planTier: data.metadata?.planTier || 'STARTER',
            status: data.metadata?.hasTrial ? 'trialing' : 'active',
            paystackSubscriptionCode: data.subscription_code,
            paystackEmailToken: data.customer?.email,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
        },
    });

    console.log('Subscription record created/updated for workspace:', workspaceId);
}

async function handleChargeSuccess(data) {
    console.log('Charge successful:', data.reference);

    const workspaceId = data.metadata?.workspaceId;
    if (!workspaceId) return;

    const prisma = require('../config/db');

    // Log the transaction
    await prisma.transaction.create({
        data: {
            workspaceId,
            amount: data.amount / 100, // Paystack sends in kobo/pesewas
            currency: data.currency,
            status: 'success',
            reference: data.reference,
            planTier: data.metadata?.planTier || 'STARTER',
            metadata: data.metadata || {},
        },
    });

    // Update subscription status if was trialing
    await prisma.subscription.updateMany({
        where: { workspaceId, status: 'trialing' },
        data: { status: 'active' },
    });
}

async function handleSubscriptionCancel(data) {
    console.log('Subscription cancelled:', data.subscription_code);

    const prisma = require('../config/db');

    await prisma.subscription.updateMany({
        where: { paystackSubscriptionCode: data.subscription_code },
        data: { status: 'canceled' },
    });

    // Downgrade workspace to FREE
    const sub = await prisma.subscription.findFirst({
        where: { paystackSubscriptionCode: data.subscription_code },
    });

    if (sub) {
        await prisma.workspace.update({
            where: { id: sub.workspaceId },
            data: { planTier: 'FREE' },
        });
    }
}

async function handlePaymentFailed(data) {
    console.log('Payment failed:', data.subscription?.subscription_code);

    const prisma = require('../config/db');

    if (data.subscription?.subscription_code) {
        await prisma.subscription.updateMany({
            where: { paystackSubscriptionCode: data.subscription.subscription_code },
            data: { status: 'past_due' },
        });
    }
}

/**
 * Cancel a subscription
 */
exports.cancelSubscription = async (req, res) => {
    try {
        const { workspaceId } = req.body;

        if (!workspaceId) {
            return res.status(400).json({ error: 'Workspace ID is required' });
        }

        const result = await PaymentService.cancelSubscription(workspaceId);

        res.status(200).json(result);

    } catch (error) {
        console.error('Cancel Subscription Error:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
    }
};
