const express = require('express');
const router = express.Router();
const {
    signup,
    signin,
    googleAuth,
    getMe,
    updateUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/me', protect, updateUser);

module.exports = router;
