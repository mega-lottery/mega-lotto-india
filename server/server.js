const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON with raw body buffer preservation for webhook signature verification
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Serve Frontend Static Files
const staticPath = path.join(__dirname, '../');
app.use(express.static(staticPath));

// Fallback to index.html
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`  MEGA LOTTO INDIA - PRODUCTION PAYMENT SERVER     `);
        console.log(`====================================================`);
        console.log(`  Server running at: http://localhost:${PORT}`);
        console.log(`  Gateway: Razorpay & UPI 2.0 Dynamic Rail`);
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`====================================================`);
    });
}

module.exports = app;
