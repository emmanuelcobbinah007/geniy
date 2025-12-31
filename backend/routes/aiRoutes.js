const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { checkLimit, requireFeature, requireTier, countCompetitors } = require('../middleware/gatingMiddleware');

// Protect all AI routes with authentication
router.use(protect);

// Context analysis - Available to all (core functionality)
router.post('/analyze-context', aiController.analyzeContext);

// Generate strategy reports
// GATED: Requires strategyReports feature (PRO+)
router.post('/generate-strategy', requireFeature('strategyReports'), aiController.generateStrategy);

// Generate survey from context - Available to all (core functionality)
router.post('/generate-survey', aiController.generateSurvey);

// Chat with context (Geniy Chat) - Available to all tiers
router.post('/chat', aiController.chatWithContext);

// Analyze/add competitor
// GATED: Competitor limit (FREE: 1, STARTER: 3, PRO: 10)
router.post('/analyze-competitor', checkLimit('competitors', countCompetitors), aiController.analyzeCompetitor);

// Generate theme - Available to all (survey customization)
router.post('/generate-theme', aiController.generateTheme);

// Generate gap analysis
// GATED: Requires gapAnalysis feature (STARTER: basic, PRO: full)
router.post('/generate-gap-analysis', requireFeature('gapAnalysis'), aiController.generateGapAnalysis);

// Delete competitor - Available to all (cleanup)
router.post('/delete-competitor', aiController.deleteCompetitor);

// Scan competitor for updates
// GATED: Requires realTimeScans feature (PRO+)
router.post('/scan-competitor', requireFeature('realTimeScans'), aiController.scanCompetitor);

module.exports = router;
