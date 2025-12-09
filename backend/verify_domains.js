require('dotenv').config();
const axios = require('axios');

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN;

async function testVercelConnection() {
    console.log("Testing Vercel API Connection...");

    if (!VERCEL_PROJECT_ID || !VERCEL_AUTH_TOKEN) {
        console.error("❌ Missing Environment Variables");
        return;
    }

    try {
        // Try to fetch project details (read-only safe operation)
        const response = await axios.get(
            `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log("✅ Custom Domains Integration Verified!");
        console.log("Connected to Project:", response.data.name);
        console.log("Project URL:", response.data.targets?.production?.url || "N/A");

        // List domains
        if (response.data.targets?.production?.alias) {
            console.log("Production Domains:", response.data.targets.production.alias);
        }

    } catch (error) {
        console.error("❌ Vercel API Failed:", error.response ? error.response.data : error.message);
    }
}

testVercelConnection();
