const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID; // Optional, if using a team
const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

const getVercelHeaders = () => ({
    Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
    'Content-Type': 'application/json',
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
            { headers: getVercelHeaders() }
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

        res.status(500).json({ error: 'Failed to add domain' });
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
        res.status(500).json({ error: 'Failed to fetch domains' });
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
            { headers: getVercelHeaders() }
        );

        const domainResponse = await axios.get(
            `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${domainRecord.domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            { headers: getVercelHeaders() }
        );

        const { misconfigured } = configResponse.data;
        const { verified } = domainResponse.data;

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

        res.json(updatedDomain);

    } catch (error) {
        console.error('Error verifying domain:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to verify domain' });
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
                { headers: getVercelHeaders() }
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
        res.status(500).json({ error: 'Failed to delete domain' });
    }
};

module.exports = {
    addDomain,
    getDomains,
    verifyDomain,
    deleteDomain,
};
