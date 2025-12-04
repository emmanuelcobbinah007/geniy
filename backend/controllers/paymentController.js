const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder'; // User needs to provide this

const initializeTransaction = async (req, res) => {
    const { email, amount, workspaceId } = req.body;

    try {
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email,
                amount: amount * 100, // Paystack expects amount in kobo
                metadata: {
                    workspaceId
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Paystack initialization error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Payment initialization failed', error: error.response?.data || error.message });
    }
};

const verifyTransaction = async (req, res) => {
    const { reference } = req.body;

    try {
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const { status, metadata } = response.data.data;

        if (status === 'success') {
            const workspaceId = metadata.workspaceId;

            // Update workspace status
            await prisma.workspace.update({
                where: { id: workspaceId },
                data: {
                    isEarlyAdopter: true,
                    earlyAdopterJoinedAt: new Date()
                }
            });

            res.status(200).json({ message: 'Payment verified and workspace updated', data: response.data.data });
        } else {
            res.status(400).json({ message: 'Payment verification failed', status });
        }
    } catch (error) {
        console.error('Paystack verification error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Payment verification failed', error: error.response?.data || error.message });
    }
};

module.exports = {
    initializeTransaction,
    verifyTransaction
};
