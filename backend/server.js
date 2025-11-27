
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/context', require('./routes/contextRoutes'));
app.use('/api/workspaces', require('./routes/workspaceRoutes'));
app.use('/', require('./routes/index'));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
