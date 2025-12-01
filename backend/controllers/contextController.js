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

const pdf = require('pdf-parse');
const axios = require('axios');

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
        // Verify user belongs to this workspace
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

        // 2. Extract Text (PDF Support)
        let extractedText = "";

        if (mimetype === 'application/pdf') {
            try {
                // Download file from Cloudinary
                const response = await axios.get(path, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);

                // Parse PDF
                const data = await pdf(buffer);
                extractedText = `\n\n=== EXTRACTED FROM ${originalname} ===\n${data.text}\n====================================\n`;
            } catch (parseError) {
                console.error("PDF Parse Error:", parseError);
                // Continue without text if parsing fails, but log it
            }
        }

        // 3. Update Workspace Context
        if (extractedText) {
            // Fetch current context first to append
            const currentWorkspace = await prisma.workspace.findUnique({
                where: { id: workspaceId },
                select: { businessContext: true }
            });

            const newContext = (currentWorkspace.businessContext || "") + extractedText;

            await prisma.workspace.update({
                where: { id: workspaceId },
                data: {
                    businessContext: newContext
                }
            });
        }

        res.status(201).json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Clear workspace context and documents
// @route   DELETE /api/context
// @access  Private
const clearContext = async (req, res) => {
    const { workspaceId } = req.body;

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

        // Transaction to clear context and delete documents
        await prisma.$transaction([
            prisma.workspace.update({
                where: { id: workspaceId },
                data: { businessContext: null }
            }),
            prisma.document.deleteMany({
                where: { workspaceId }
            })
        ]);

        res.json({ message: 'Context cleared successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getContext,
    updateContext,
    uploadDocument,
    clearContext
};
