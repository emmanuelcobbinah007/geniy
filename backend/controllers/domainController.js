const prisma = require('../config/db');
const axios = require('axios');

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional, if using a team
const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

const getVercelHeaders = () => ({
    Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
    'Content-Type': 'application/json',
});

const getVercelConfig = () => ({
    headers: getVercelHeaders(),
    timeout: 10000 // 10 seconds timeout
});

const addDomain = async (req, res) => {
    const { workspaceId } = req.params;
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }

    try {
        // 1. Add to Vercel
        // https://vercel.com/docs/rest-api/endpoints/projects#add-a-domain-to-a-project
        const vercelResponse = await axios.post(
            `${VERCEL_API_URL}/v10/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            { name: domain },
            getVercelConfig()
        );

        // 2. Add to Database
        const newDomain = await prisma.domain.create({
            data: {
                domain,
                workspaceId,
                status: 'pending', // Initial status
            },
        });

        res.status(201).json(newDomain);
    } catch (error) {
        console.error('Error adding domain:', error.response?.data || error.message);

        if (error.response?.status === 409) {
            return res.status(409).json({ error: 'Domain already exists on Vercel or is owned by another account.' });
        }

        const errorMessage = error.response?.data?.error?.message || error.message;
        res.status(500).json({ error: `Failed to add domain: ${errorMessage}` });
    }
};

const getDomains = async (req, res) => {
    const { workspaceId } = req.params;

    try {
        const domains = await prisma.domain.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(domains);
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ error: `Failed to fetch domains: ${error.message}` });
    }
};

const verifyDomain = async (req, res) => {
    const { workspaceId, domainId } = req.params;

    try {
        const domainRecord = await prisma.domain.findUnique({
            where: { id: domainId },
        });

        if (!domainRecord) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        // Call Vercel to check status
        // https://vercel.com/docs/rest-api/endpoints/domains#get-a-domain-configuration
        const configResponse = await axios.get(
            `${VERCEL_API_URL}/v6/domains/${domainRecord.domain}/config${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            getVercelConfig()
        );

        const domainResponse = await axios.get(
            `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domainRecord.domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            getVercelConfig()
        );

        const { misconfigured } = configResponse.data;
        const { verified } = domainResponse.data;

        console.log('--- Domain Verification Result ---');
        console.log(`Domain: ${domainRecord.domain}`);
        console.log(`Verified: ${verified}`);
        console.log(`Misconfigured: ${misconfigured}`);

        // Extract verification error if any
        let verificationError = null;
        if (!verified) {
            // Vercel returns verification errors in the domain object sometimes
            verificationError = domainResponse.data.verification?.[0]?.reason ||
                (configResponse.data.misconfigured ? 'Configuration Missing' : null);

            if (verificationError) {
                console.log('Verification Error:', verificationError);
            }
        }

        let status = 'pending';
        if (verified && !misconfigured) {
            status = 'active';
        } else if (misconfigured) {
            status = 'misconfigured'; // Or keep as pending/error
        }

        const updatedDomain = await prisma.domain.update({
            where: { id: domainId },
            data: { status },
        });

        // Return verification details to frontend
        res.json({
            ...updatedDomain,
            verificationError
        });

    } catch (error) {
        console.error('Error verifying domain:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.error?.message || error.message;
        res.status(500).json({ error: `Failed to verify domain: ${errorMessage}` });
    }
};

const deleteDomain = async (req, res) => {
    const { workspaceId, domainId } = req.params;

    try {
        const domainRecord = await prisma.domain.findUnique({
            where: { id: domainId },
        });

        if (!domainRecord) {
            return res.status(404).json({ error: 'Domain not found' });
        }

        // Remove from Vercel
        try {
            await axios.delete(
                `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domainRecord.domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
                getVercelConfig()
            );
        } catch (vercelError) {
            console.warn("Failed to remove from Vercel (might already be gone):", vercelError.message);
        }

        // Remove from DB
        await prisma.domain.delete({
            where: { id: domainId },
        });

        res.json({ message: 'Domain deleted' });
    } catch (error) {
        console.error('Error deleting domain:', error);
        res.status(500).json({ error: `Failed to delete domain: ${error.message}` });
    }
};

module.exports = {
    addDomain,
    getDomains,
    verifyDomain,
    deleteDomain,
};
