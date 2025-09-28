const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const metroRoutes = require('./routes/metro');
const hederaRoutes = require('./routes/hedera');
const carbonRoutes = require('./routes/carbon');
const fraudCheckRoutes = require('./api/fraud-check');

const errorHandler = require('./middleware/errorHandler');
const { rateLimiter, securityHeaders, ddosProtection } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(securityHeaders);
app.use(ddosProtection);
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

app.use('/api/metro', metroRoutes);
app.use('/api/hedera', hederaRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api', fraudCheckRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 EcoRide backend running on port ${PORT}`);
});