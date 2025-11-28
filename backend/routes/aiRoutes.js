const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Protect all AI routes with authentication
router.use(protect);

router.post('/analyze-context', aiController.analyzeContext);
router.post('/generate-strategy', aiController.generateStrategy);
router.post('/generate-survey', aiController.generateSurvey);

module.exports = router;
