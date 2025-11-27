const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Update workspace details
// @route   PUT /api/workspaces/:id
// @access  Private
const updateWorkspace = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        // Check if user is member of workspace
        const member = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: id,
                userId: req.user.id
            }
        });

        if (!member) {
            return res.status(403).json({ message: 'Not authorized to update this workspace' });
        }

        const workspace = await prisma.workspace.update({
            where: { id },
            data: { name }
        });

        res.json(workspace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get workspace members
// @route   GET /api/workspaces/:id/members
// @access  Private
const getWorkspaceMembers = async (req, res) => {
    const { id } = req.params;

    try {
        // Check if user is member
        const member = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: id,
                userId: req.user.id
            }
        });

        if (!member) {
            return res.status(403).json({ message: 'Not authorized to view members' });
        }

        const members = await prisma.workspaceMember.findMany({
            where: { workspaceId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.json(members);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
    const { name } = req.body;

    try {
        const workspace = await prisma.$transaction(async (prisma) => {
            // 1. Create Workspace
            const newWorkspace = await prisma.workspace.create({
                data: {
                    name,
                    ownerId: req.user.id,
                },
            });

            // 2. Create Workspace Member (Owner)
            await prisma.workspaceMember.create({
                data: {
                    userId: req.user.id,
                    workspaceId: newWorkspace.id,
                    role: 'OWNER',
                },
            });

            return newWorkspace;
        });

        res.status(201).json(workspace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add member to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private
const addMember = async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;

    try {
        // Check if user is owner/admin of workspace
        const requester = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: id,
                userId: req.user.id,
                role: { in: ['OWNER', 'ADMIN'] }
            }
        });

        if (!requester) {
            return res.status(403).json({ message: 'Not authorized to add members' });
        }

        // Find user to add
        const userToAdd = await prisma.user.findUnique({
            where: { email }
        });

        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already a member
        const existingMember = await prisma.workspaceMember.findFirst({
            where: {
                workspaceId: id,
                userId: userToAdd.id
            }
        });

        if (existingMember) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        // Add member
        const newMember = await prisma.workspaceMember.create({
            data: {
                workspaceId: id,
                userId: userToAdd.id,
                role: 'EDITOR' // Default role
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        res.status(201).json(newMember);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    updateWorkspace,
    getWorkspaceMembers,
    createWorkspace,
    addMember
};
