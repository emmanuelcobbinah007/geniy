const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load the file
const envPath = path.join(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

console.log(`\n=== DIAGNOSTIC START ===`);
console.log(`Loading env from: ${envPath}`);
if (result.error) {
    console.log(`❌ ERROR loading .env file: ${result.error.message}`);
} else {
    console.log(`✅ .env file loaded successfully`);
}

const TOKEN = process.env.VERCEL_AUTH_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

console.log(`TOKEN: ${TOKEN ? (TOKEN.substring(0, 4) + '...') : 'MISSING'}`);
console.log(`TEAM_ID: ${TEAM_ID || 'MISSING'}`);
console.log(`PROJECT_ID: ${PROJECT_ID || 'MISSING'}`);

if (!TOKEN || !TEAM_ID || !PROJECT_ID) {
    console.log('❌ MISSING VARIABLES. CHECK YOUR .ENV FILE.');
    process.exit(1);
}

const VERCEL_API_URL = 'https://api.vercel.com';

async function check() {
    try {
        console.log(`\n1. Checking Token Identity...`);
        const userRes = await axios.get(`${VERCEL_API_URL}/v2/user`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        console.log(`✅ Token belongs to user: ${userRes.data.user.username}`);

        console.log(`\n2. Listing Accessible Teams...`);
        try {
            const teamsRes = await axios.get(`${VERCEL_API_URL}/v2/teams`, {
                headers: { Authorization: `Bearer ${TOKEN}` }
            });
            
            if (teamsRes.data.teams && teamsRes.data.teams.length > 0) {
                console.log(`✅ Found ${teamsRes.data.teams.length} teams.`);
                teamsRes.data.teams.forEach(t => {
                    console.log(`   - Name: "${t.name}", ID: "${t.id}"`);
                });
                
                const match = teamsRes.data.teams.find(t => t.id === TEAM_ID);
                if (match) {
                     console.log(`✅ .env Team ID matches found team: "${match.name}"`);
                } else {
                     console.log(`❌ CRITICAL: .env Team ID (${TEAM_ID}) NOT found in token's team list!`);
                     console.log(`   PLEASE UPDATE .env WITH THE CORRECT TEAM ID ABOVE.`);
                }
            } else {
                 console.log(`⚠️ Token has access to 0 teams. Did you select the team scope correctly?`);
            }

        } catch (teamErr) {
            console.log(`❌ FAILED to list Teams`);
             if (teamErr.response) {
                console.log(`Status: ${teamErr.response.status}`);
                console.log(`Message: ${teamErr.response.data.error?.message}`);
            }
        }

        console.log(`\n3. Checking Project Access (with Team ID)...`);
        const url = `${VERCEL_API_URL}/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`;

        await axios.get(url, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        console.log(`✅✅ SUCCESS! Token has access to the Project under this Team.`);

    } catch (error) {
        console.log(`\n❌ REQUEST FAILED`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Code: ${error.response.data.error?.code}`);
            console.log(`Message: ${error.response.data.error?.message}`);
        } else {
            console.log(`Error: ${error.message}`);
        }
    }
    console.log(`=== DIAGNOSTIC END ===\n`);
}

check();
