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

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'geniy/business_context_documents',
            resource_type: 'raw',
            public_id: file.originalname.replace(/\.[^/.]+$/, "") + "-" + Date.now(),
        };
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.get('/', protect, getContext);
router.put('/', protect, updateContext);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.delete('/', protect, clearContext);

module.exports = router;
