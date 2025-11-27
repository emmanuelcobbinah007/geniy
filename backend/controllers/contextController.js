const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get workspace context and documents
// @route   GET /api/context
// @access  Private
// @desc    Get workspace context and documents
// @route   GET /api/context
// @access  Private
const getContext = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        if (!workspaceId) {
            return res.status(400).json({ message: 'Workspace ID required' });
        }

        // Verify user belongs to this workspace
        const isMember = req.user.workspaces.some(w => w.id === workspaceId) ||
            req.user.sharedWorkspaces.some(w => w.id === workspaceId);

        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to access this workspace' });
        }

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { documents: true }
        });

        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        res.json({
            businessContext: workspace.businessContext,
            documents: workspace.documents
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update business context text
// @route   PUT /api/context
// @access  Private
const updateContext = async (req, res) => {
    const { businessContext, workspaceId } = req.body;

    if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID required' });
    }

    try {
        // Verify user belongs to this workspace
        const isMember = req.user.workspaces.some(w => w.id === workspaceId) ||
            req.user.sharedWorkspaces.some(w => w.id === workspaceId);

        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to access this workspace' });
        }

        const workspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { businessContext }
        });

        res.json(workspace);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upload document
// @route   POST /api/context/upload
// @access  Private
const uploadDocument = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Please upload a file' });
    }

    const { workspaceId } = req.body;

    if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID required' });
    }

    try {
        // Verify user belongs to this workspace (Note: req.user is populated by auth middleware)
        // We need to fetch user again or rely on what's in req.user. 
        // Assuming req.user has workspaces and sharedWorkspaces populated.
        const isMember = req.user.workspaces.some(w => w.id === workspaceId) ||
            req.user.sharedWorkspaces.some(w => w.id === workspaceId);

        if (!isMember) {
            return res.status(403).json({ message: 'Not authorized to access this workspace' });
        }

        const { originalname, mimetype, size, path, filename } = req.file;

        // 1. Save Document record
        const document = await prisma.document.create({
            data: {
                workspaceId,
                name: originalname,
                type: mimetype,
                size: size,
                url: path // Cloudinary URL
            }
        });

        // 2. Simulate text extraction (append filename to context for now)
        // In a real app, use OCR/Text extraction service
        await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                businessContext: {
                    // Append to existing context if not null, else set it
                    // Note: Prisma doesn't support append easily for string, so we fetch first or just overwrite/concat in memory if needed.
                    // For simplicity here, we won't auto-append text to avoid overwriting user edits blindly.
                    // We'll just acknowledge the upload.
                }
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getContext,
    updateContext,
    uploadDocument
};
