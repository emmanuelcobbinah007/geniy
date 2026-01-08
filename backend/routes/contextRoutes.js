const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
    getContext,
    updateContext,
    uploadDocument,
    clearContext
} = require('../controllers/contextController');

const { upload, imageUpload } = require('../services/uploadService');

router.get('/', protect, getContext);
router.put('/', protect, updateContext);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.delete('/', protect, clearContext);

// Image upload for survey assets (logos, backgrounds) - uses Cloudinary
router.post('/upload-asset', protect, (req, res, next) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ Cloudinary not configured. Missing environment variables.');
        return res.status(500).json({
            message: 'Image upload service not configured. Please set CLOUDINARY environment variables.'
        });
    }

    imageUpload.single('file')(req, res, (err) => {
        if (err) {
            console.error('❌ Image upload error:', err);
            return res.status(500).json({
                message: 'Failed to upload image',
                error: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Cloudinary returns path (secure_url)
        const fileUrl = req.file.path;
        console.log('✅ Image uploaded to Cloudinary:', fileUrl);
        res.json({ url: fileUrl });
    });
});

module.exports = router;
