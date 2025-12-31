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
     * @returns {Promise<{authorization_url: string, reference: string}>}
     */
    async initializePaystackSubscription({ email, planTier, workspaceId, hasTrial = false }) {
        const planCode = PLAN_CODES[planTier];

        if (!planCode) {
            throw new Error(`Invalid plan tier: ${planTier}`);
        }

        // Calculate trial end date (14 days from now)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

        try {
            // Initialize transaction that will create a subscription
            const response = await axios.post(
                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                {
                    email,
                    plan: planCode,
                    callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
                    metadata: {
                        workspaceId,
                        planTier,
                        hasTrial,
                        custom_fields: [
                            {
                                display_name: "Plan",
                                variable_name: "plan_name",
                                value: planTier
                            }
                        ]
                    },
                    // If trial, set start_date to 14 days from now (first charge delayed)
                    ...(hasTrial && { start_date: trialEndDate.toISOString() })
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

        // 2. Determine period (defaulting to 30 days for monthly)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);

        // 3. Create or Update Subscription in DB
        // We use upsert to handle upgrading/downgrading gracefully
        const subscription = await prisma.subscription.upsert({
            where: { workspaceId },
            update: {
                planTier,
                status: 'active',
                paystackEmailToken: verification.data.customer?.email,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
                paystackSubscriptionCode: verification.data.authorization?.authorization_code, // Store auth code for recurring
            },
            create: {
                workspaceId,
                planTier,
                status: 'active',
                paystackEmailToken: verification.data.customer?.email,
                currentPeriodStart: startDate,
                currentPeriodEnd: endDate,
                paystackSubscriptionCode: verification.data.authorization?.authorization_code,
            },
        });

        // 4. Log the transaction
        await prisma.transaction.create({
            data: {
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
    }
};

module.exports = PaymentService;
