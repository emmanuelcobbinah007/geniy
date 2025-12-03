const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listWorkspaces() {
    try {
        const workspaces = await prisma.workspace.findMany();
        console.log("Workspaces:", workspaces);
    } catch (error) {
        console.error("Error listing workspaces:", error);
    } finally {
        await prisma.$disconnect();
    }
}

listWorkspaces();
