const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get workspace context and documents
// @route   GET /api/context
// @access  Private
// @desc    Get workspace context and documents
// @route   GET /api/context
// @access  Private
const { encrypt, decrypt } = require('../utils/encryption');
const auditService = require('../services/auditService');

// @desc    Get workspace context and documents
// @route   GET /api/context
// @access  Private
const getContext = async (req, res) => {
    try {
        const { workspaceId } = req.query;

        // Log the access even if it fails validation? Usually only successful or attempted authorized access.
        // We'll log inside the success path for now to reduce noise.

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

        // Decrypt business context before sending to frontend
        const decryptedContext = decrypt(workspace.businessContext);

        // Audit Log
        if (req.user) {
            auditService.log({
                userId: req.user.id,
                workspaceId: workspaceId,
                action: 'CONTEXT_VIEW',
                metadata: { source: 'dashboard' }
            });
        }

        res.json({
            businessContext: decryptedContext,
            documents: workspace.documents,
            competitors: workspace.competitors,
            gapAnalysis: workspace.gapAnalysis,
            chatHistory: workspace.chatHistory // Return saved chat history
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

        // Encrypt business context before saving to DB
        const encryptedContext = encrypt(businessContext);

        const workspace = await prisma.workspace.update({
            where: { id: workspaceId },
            data: { businessContext: encryptedContext }
        });

        // Return decrypted context to frontend (or just the saved object but with decrypted context?)
        // The frontend usually expects the updated object. Let's return the decrypted version.
        workspace.businessContext = businessContext; // We know what we just sent

        // Audit Log
        auditService.log({
            userId: req.user.id,
            workspaceId: workspaceId,
            action: 'CONTEXT_UPDATE',
            metadata: { length: businessContext.length }
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
                console.log(`Downloading PDF from: ${path}`);
                // Download file from Cloudinary
                const response = await axios.get(path, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(response.data);
                console.log(`PDF downloaded, buffer size: ${buffer.length}`);

                // Parse PDF
                const data = await pdf(buffer);
                console.log(`PDF parsed, text length: ${data.text.length}`);

                if (!data.text || data.text.trim().length === 0) {
                    throw new Error("PDF parsed but no text found (scanned image?)");
                }

                extractedText = `\n\n=== EXTRACTED FROM ${originalname} ===\n${data.text}\n====================================\n`;
            } catch (parseError) {
                console.error("PDF Parse Error:", parseError);
                return res.status(400).json({
                    message: 'Failed to extract text from PDF. Ensure it is a text PDF, not a scanned image.',
                    details: parseError.message
                });
            }
        }

        // 3. Update Workspace Context
        if (extractedText) {
            const contextService = require('../services/contextService');
            await contextService.analyzeAndAppend(workspaceId, extractedText, originalname);
        }

        // Audit Log
        auditService.log({
            userId: req.user.id,
            workspaceId: workspaceId,
            action: 'DOCUMENT_UPLOAD',
            metadata: {
                filename: originalname,
                size: size,
                type: mimetype,
                encrypted: true
            }
        });

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
