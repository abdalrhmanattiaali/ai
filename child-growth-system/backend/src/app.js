const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const appConfig = require('./config/app.config');

const app = express();

// Security middleware - Relaxed for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS - Allow all origins in development
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (appConfig.app.env === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting - Disabled for setup
const limiter = rateLimit(appConfig.rateLimit);
app.use('/api/auth', limiter);
app.use('/api/whatsapp', limiter);
// Don't rate limit setup routes

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: appConfig.app.name,
    version: appConfig.app.version,
    environment: appConfig.app.env,
    timestamp: new Date().toISOString()
  });
});

// API Routes
// Setup wizard (no auth required)
app.use('/api/setup', require('./routes/setup.routes'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/whatsapp', require('./routes/whatsapp.routes'));
app.use('/api/families', require('./routes/family.routes'));
app.use('/api/children', require('./routes/child.routes'));
app.use('/api/parents', require('./routes/parent.routes'));
app.use('/api/recipients', require('./routes/recipient.routes'));
app.use('/api/schedules', require('./routes/schedule.routes'));
app.use('/api/conversations', require('./routes/conversation.routes'));
app.use('/api/recommendations', require('./routes/recommendation.routes'));
app.use('/api/ai', require('./routes/ai.routes'));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(appConfig.app.env === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = app;
