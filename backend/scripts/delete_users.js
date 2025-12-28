const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailsToDelete = [
    'jc7968682@gmail.com',
    'ecobbinahbuz@gmail.com',
    'aurorasoftwarelabs@gmail.com'
];

async function deleteUser(email) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            workspaces: {
                select: { id: true }
            }
        }
    });

    if (!user) {
        console.log(`User ${email} not found.`);
        return;
    }

    console.log(`Deleting user: ${email} (${user.id})`);

    const workspaceIds = user.workspaces.map(w => w.id);

    if (workspaceIds.length > 0) {
        // ... (simplified logic for brevity if needed, but copying full logic is safer)
        const campaigns = await prisma.campaign.findMany({ where: { workspaceId: { in: workspaceIds } }, select: { id: true } });
        const campaignIds = campaigns.map(c => c.id);
        const surveys = await prisma.survey.findMany({ where: { campaignId: { in: campaignIds } }, select: { id: true } });
        const surveyIds = surveys.map(s => s.id);

        await prisma.aIInsight.deleteMany({ where: { OR: [{ campaignId: { in: campaignIds } }, { surveyId: { in: surveyIds } }] } });
        await prisma.response.deleteMany({ where: { surveyId: { in: surveyIds } } });
        await prisma.activityLog.deleteMany({ where: { OR: [{ workspaceId: { in: workspaceIds } }, { campaignId: { in: campaignIds } }, { surveyId: { in: surveyIds } }] } });
        await prisma.survey.deleteMany({ where: { campaignId: { in: campaignIds } } });
        await prisma.campaign.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
        await prisma.document.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
        await prisma.domain.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
        await prisma.transaction.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
        await prisma.subscription.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
        await prisma.workspaceMember.deleteMany({ where: { workspaceId: { in: workspaceIds } } });
        await prisma.workspace.deleteMany({ where: { id: { in: workspaceIds } } });
    }

    await prisma.workspaceMember.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`✅ Successfully deleted ${email}`);
}

async function main() {
    for (const email of emailsToDelete) {
        await deleteUser(email);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
