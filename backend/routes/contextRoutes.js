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
router.post('/upload-asset', protect, imageUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    // Cloudinary returns path (secure_url)
    const fileUrl = req.file.path;
    res.json({ url: fileUrl });
});

module.exports = router;
