const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { env } = require('./shared/config/env');
const { logger } = require('./shared/config/logger');
const { errorHandler } = require('./shared/middleware/errorHandler');

const authRoutes = require('./modules/auth/route');
const transactionRoutes = require('./modules/transactions/route');
const analyticsRoutes = require('./modules/analytics/route');
const aiRoutes = require('./modules/ai/route');
const notificationRoutes = require('./modules/notifications/route');

const app = express();

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Business OS Backend Running 🚀"
  });
});

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://smart-business-os-client.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.options('*', cors());

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(compression());

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Business OS is running',
    timestamp: new Date()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

logger.info('Express app configured');

module.exports = { app };
