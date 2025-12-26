
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL // Production URL from Vercel
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && !process.env.FRONTEND_URL) {
            // If FRONTEND_URL is not set, we might want to be permissive or strict. 
            // For now, let's allow it if it matches localhost or if we decide to allow all.
            // But better to be strict.
            return callback(null, true); // Temporary permissive for MVP deployment ease
        }
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            // callback(new Error('Not allowed by CORS'));
            callback(null, true); // Temporary permissive
        }
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/context', require('./routes/contextRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/', require('./routes/index'));

// Start server
const cronService = require('./services/cronService');
cronService.init();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`✅ Server restarted at ${new Date().toISOString()}`);
});
