const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const genesisAgent = require('./services/ai/genesis');

async function testControllerLogic() {
    const workspaceId = "062c7f43-0f41-49d7-a2bd-f9c6cb04d308";
    const context = "Test context";
    const messages = [{ role: "user", content: "Hello" }];

    try {
        console.log("Testing Prisma fetch...");
        const campaigns = await prisma.campaign.findMany({
            where: { workspaceId },
            include: {
                surveys: {
                    include: {
                        responses: {
                            orderBy: { submittedAt: 'desc' },
                            take: 5
                        }
                    }
                }
            }
        });
        console.log("Campaigns fetched:", campaigns.length);

        console.log("Testing Genesis Chat with context...");
        const result = await genesisAgent.chatWithBrain(context, messages);
        console.log("Genesis result:", result);

    } catch (error) {
        console.error("Controller logic failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testControllerLogic();
