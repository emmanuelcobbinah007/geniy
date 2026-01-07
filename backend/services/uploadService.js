const multer = require('multer');
const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary (Legacy/Fallback)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure S3 (Target)
const s3Configured = process.env.AWS_S3_BUCKET_NAME && process.env.AWS_REGION;
let s3Client;

if (s3Configured) {
    s3Client = new S3Client({
        region: process.env.AWS_REGION,
        // SDK automatically picks up AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    });
}

/**
 * Returns a configured Multer upload middleware
 * Picks S3 if configured, otherwise falls back to Cloudinary
 */
const getUploadMiddleware = () => {
    let storage;

    if (s3Configured && process.env.UPLOAD_PROVIDER === 'S3') {
        console.log("📂 Upload Service: Using AWS S3");
        storage = multerS3({
            s3: s3Client,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path.extname(file.originalname);
                const filename = 'geniy/uploads/' + file.fieldname + '-' + uniqueSuffix + ext;
                cb(null, filename);
            }
        });
    } else {
        console.log("📂 Upload Service: Using Cloudinary (Fallback)");
        storage = new CloudinaryStorage({
            cloudinary: cloudinary,
            params: async (req, file) => {
                return {
                    folder: 'geniy/business_context_documents',
                    resource_type: 'raw',
                    public_id: file.originalname.replace(/\.[^/.]+$/, "") + "-" + Date.now(),
                };
            },
        });
    }

    return multer({
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });
};

/**
 * Cloudinary-only upload for public images (logos, backgrounds)
 * Always uses Cloudinary regardless of UPLOAD_PROVIDER setting
 */
const getImageUploadMiddleware = () => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            return {
                folder: 'geniy/survey_assets',
                resource_type: 'image',
                format: 'webp', // Optimize to webp
                transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                public_id: 'asset-' + Date.now() + '-' + Math.round(Math.random() * 1E9),
            };
        },
    });

    return multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for images
    });
};

module.exports = {
    upload: getUploadMiddleware(),
    imageUpload: getImageUploadMiddleware(),
    s3Client: s3Client
};
