require('dotenv').config();
try {
    const authController = require('./controllers/authController');
    console.log('authController loaded successfully');
} catch (error) {
    console.error('Failed to load authController:', error);
}
