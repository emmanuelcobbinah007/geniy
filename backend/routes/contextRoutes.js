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

const { upload } = require('../services/uploadService');

// DEPRECATED: Inline Cloudinary Config moved to services/uploadService.js
/*
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// ...
*/

router.get('/', protect, getContext);
router.put('/', protect, updateContext);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.delete('/', protect, clearContext);

module.exports = router;
