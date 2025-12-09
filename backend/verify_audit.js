require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const auditService = require('./services/auditService');

const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("Verifying Audit Logs...");

        console.log("Verifying Audit Logs...");

        // 1. Create a dummy user to satisfy FK constraint
        const testEmail = `test-${Date.now()}@example.com`;
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash: 'temp',
                name: 'Audit Tester'
            }
        });
        const testUserId = user.id;

        console.log("Writing test log...");
        await auditService.log({
            userId: testUserId,
            workspaceId: null, // Test without workspace for now
            action: 'VERIFY_AUDIT_LOG',
            metadata: { test: true }
        });

        // 2. Retrieve it from DB
        console.log("Reading from DB...");
        const log = await prisma.activityLog.findFirst({
            where: {
                userId: testUserId,
                action: 'VERIFY_AUDIT_LOG'
            }
        });

        if (log) {
            console.log("✅ Audit Log verified!");
            console.log("Log Details:", log);
        } else {
            console.error("❌ Failed to find audit log entry.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
