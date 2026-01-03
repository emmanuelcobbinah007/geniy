const axios = require('axios');
const prisma = require('../config/db');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Plan codes from Paystack dashboard
const PLAN_CODES = {
    STARTER: process.env.PAYSTACK_PLAN_STARTER || 'PLN_3ul9ai1ohn1zq82',
    PRO: process.env.PAYSTACK_PLAN_PRO || 'PLN_laqkv5cmj0t447d',
};

// Trial period in days
const TRIAL_DAYS = 14;

/**
 * Payment Service for managing Paystack transactions and subscriptions
 */
const PaymentService = {

    /**
     * Verify a transaction via Paystack API
     * @param {string} reference - The transaction reference from the frontend
     * @returns {Promise<Object>} - The verification data
     */
    async verifyTransaction(reference) {
        try {
            const response = await axios.get(
                `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error verifying Paystack transaction:', error.response?.data || error.message);
            throw new Error('Transaction verification failed');
        }
    },

    /**
     * Initialize a Paystack subscription with trial period
     * Returns an authorization URL for the user to complete payment/card authorization
     * @param {string} email - Customer email
     * @param {string} planTier - STARTER or PRO
     * @param {string} workspaceId - Workspace ID to attach to metadata
     * @param {boolean} hasTrial - Whether to include 14-day trial
     * @param {boolean} isUpgrade - Whether this is an upgrade (not new workspace)
     * @param {string} workspaceName - Name for new workspace (if applicable)
     * @returns {Promise<{authorization_url: string, reference: string}>}
     */
    async initializePaystackSubscription({ email, planTier, workspaceId, hasTrial = false, isUpgrade = false, workspaceName = null }) {
        const planCode = PLAN_CODES[planTier];

        if (!planCode) {
            throw new Error(`Invalid plan tier: ${planTier}`);
        }

        // Plan amounts must match exactly what's in Paystack dashboard (in pesewas)
        const PLAN_AMOUNTS = {
            STARTER: 29000,  // GHS 290
            PRO: 79000,      // GHS 790 (as per Paystack dashboard)
        };

        const amount = PLAN_AMOUNTS[planTier];
        if (!amount) {
            throw new Error(`No amount configured for plan: ${planTier}`);
        }

        // Calculate trial end date (14 days from now)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

        try {
            // Initialize transaction that will create a subscription
            // Amount must match the plan's amount in Paystack
            const response = await axios.post(
                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                {
                    email,
                    amount, // Must match plan amount exactly
                    plan: planCode,
                    callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
                    metadata: {
                        workspaceId,
                        planTier,
                        hasTrial,
                        isUpgrade,
                        workspaceName,
                        custom_fields: [
                            {
                                display_name: "Plan",
                                variable_name: "plan_name",
                                value: planTier
                            },
                            {
                                display_name: "Type",
                                variable_name: "payment_type",
                                value: isUpgrade ? "Upgrade" : "New Subscription"
                            }
                        ]
                    },
                    // If trial (and not upgrade), set start_date to 14 days from now (first charge delayed)
                    ...(hasTrial && !isUpgrade && { start_date: trialEndDate.toISOString() })
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Failed to initialize subscription');
            }

            return {
                authorization_url: response.data.data.authorization_url,
                reference: response.data.data.reference,
                access_code: response.data.data.access_code
            };
        } catch (error) {
            console.error('Error initializing Paystack subscription:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to initialize subscription');
        }
    },

    /**
     * Initialize a subscription for a workspace
     * This is typically called after a successful initial payment to store the subscription details
     */
    async createSubscription({ workspaceId, planTier, customerEmail, reference, amount }) {
        // 1. Verify the transaction first to be safe
        const verification = await this.verifyTransaction(reference);

        if (verification.data.status !== 'success') {
            throw new Error('Payment verification failed');
        }

        // 2. Try to fetch the actual Paystack subscription code
        let subscriptionCode = verification.data.authorization?.authorization_code;
        const verifiedEmail = verification.data.customer?.email || customerEmail;

        if (verifiedEmail) {
            try {
                // Wait a moment for Paystack to process the subscription
                await new Promise(r => setTimeout(r, 2000));

                // Fetch customer's subscriptions from Paystack
                const subsRes = await axios.get(`${PAYSTACK_BASE_URL}/subscription?customer=${encodeURIComponent(verifiedEmail)}`, {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                    }
                });

                if (subsRes.data.status && subsRes.data.data?.length > 0) {
                    // Get the most recent active subscription
                    const activeSub = subsRes.data.data.find(s => s.status === 'active') || subsRes.data.data[0];
                    subscriptionCode = activeSub.subscription_code;
                    console.log("[PaymentService] Found Paystack subscription:", subscriptionCode);
                }
            } catch (subErr) {
                console.warn("[PaymentService] Could not fetch subscription:", subErr.message);
            }
        }

        // 3. Determine period (defaulting to 30 days for monthly)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);

        // 4. Create or Update Subscription in DB
        const subscription = await prisma.subscription.upsert({
            where: { workspaceId },
            update: {
                planTier,
                status: 'active',
                paystackEmailToken: verifiedEmail,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
                paystackSubscriptionCode: subscriptionCode,
            },
            create: {
                workspaceId,
                planTier,
                status: 'active',
                paystackEmailToken: verifiedEmail,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
                paystackSubscriptionCode: subscriptionCode,
            },
        });

        // 4. Log the transaction (upsert to handle duplicate webhook/callback calls)
        await prisma.transaction.upsert({
            where: { reference },
            update: {
                status: 'success',
            },
            create: {
                workspaceId,
                amount: amount,
                currency: verification.data.currency,
                status: 'success',
                reference: reference,
                planTier: planTier,
                metadata: verification.data.metadata || {},
            },
        });

        // 5. Update Workspace Plan
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { planTier: planTier },
        });

        return subscription;
    },

    /**
     * Check if a workspace has an active subscription for a specific feature tier
     */
    async checkGate(workspaceId, requiredTier) {
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { planTier: true }
        });

        if (!workspace) return false;

        // Hierarchy: FREE < PRO < BUSINESS < ENTERPRISE
        const tiers = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'];
        const currentLevel = tiers.indexOf(workspace.planTier);
        const requiredLevel = tiers.indexOf(requiredTier);

        return currentLevel >= requiredLevel;
    },

    /**
     * Cancel a workspace subscription
     * - Disables the subscription in Paystack
     * - Downgrades workspace to FREE plan
     * - Updates subscription status in database
     */
    async cancelSubscription(workspaceId) {
        console.log('[PaymentService] Cancelling subscription for workspace:', workspaceId);

        // 1. Find the subscription record
        const subscription = await prisma.subscription.findUnique({
            where: { workspaceId },
        });

        if (!subscription) {
            throw new Error('No active subscription found for this workspace');
        }

        // 2. Cancel in Paystack if we have a subscription code
        if (subscription.paystackSubscriptionCode) {
            try {
                console.log('[PaymentService] Disabling Paystack subscription:', subscription.paystackSubscriptionCode);

                // Paystack uses token and code for disabling
                const response = await axios.post(
                    `${PAYSTACK_BASE_URL}/subscription/disable`,
                    {
                        code: subscription.paystackSubscriptionCode,
                        token: subscription.paystackEmailToken
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('[PaymentService] Paystack disable response:', response.data);
            } catch (error) {
                console.error('[PaymentService] Error disabling Paystack subscription:', error.response?.data || error.message);
                // Continue with local cancellation even if Paystack fails
            }
        }

        // 3. Update subscription record
        await prisma.subscription.update({
            where: { workspaceId },
            data: {
                status: 'cancelled',
                cancelledAt: new Date(),
            }
        });

        // 4. Downgrade workspace to FREE
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: { planTier: 'FREE' }
        });

        console.log('[PaymentService] Subscription cancelled successfully');
        return { success: true, message: 'Subscription cancelled. Your workspace has been downgraded to the Free plan.' };
    }
};

module.exports = PaymentService;
