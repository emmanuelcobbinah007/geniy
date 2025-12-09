require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
console.log("ENCRYPTION_KEY present:", !!process.env.ENCRYPTION_KEY);
if (process.env.ENCRYPTION_KEY) console.log("Key Length:", process.env.ENCRYPTION_KEY.length);
const { decrypt } = require('./utils/encryption');

const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("Verifying encryption...");

        const workspace = await prisma.workspace.findFirst({
            where: {
                businessContext: {
                    not: null
                }
            }
        });

        if (!workspace) {
            console.log("No workspace with business context found.");
            return;
        }

        console.log("Found Workspace:", workspace.id);
        console.log("Raw Business Context (DB):", workspace.businessContext.substring(0, 100) + "...");

        if (workspace.businessContext.includes(':')) {
            console.log("✅ Context appears to be encrypted (contains IV separator).");
            const decrypted = decrypt(workspace.businessContext);
            console.log("Decrypted Context:", decrypted.substring(0, 100) + "...");
        } else {
            console.log("⚠️ Context is NOT encrypted. (This is expected for old data before update)");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
