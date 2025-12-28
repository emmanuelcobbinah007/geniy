const axios = require('axios');
const prisma = require('../config/db');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

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
