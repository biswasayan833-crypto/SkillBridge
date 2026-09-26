const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const sanitize = require('./middleware/sanitize');

const app = express();

// ==========================================
// 1. SECURITY & UTILITY MIDDLEWARES
// ==========================================

// Parse allowed CORS origins from CLIENT_URL (supports comma-separated origins and normalizes trailing slashes)
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://skill-bridge-dokcv8jd0-ayan-biswas.vercel.app',
];
const rawClientUrl = process.env.CLIENT_URL || '';
const configuredOrigins = rawClientUrl
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

// Helmet for secure HTTP headers (hardened with CORP and CSP)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", ...allowedOrigins],
      },
    },
  })
);

// CORS configuration (rejects untrusted origins in production, handles preflight cleanly)
const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : origin;
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server) or matching allowedOrigins or Vercel preview domains
    if (
      !normalizedOrigin ||
      allowedOrigins.includes(normalizedOrigin) ||
      /^https:\/\/skill-bridge[a-z0-9-]*\.vercel\.app$/.test(normalizedOrigin)
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL operator injection sanitization
app.use(sanitize);

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ==========================================
// 2. ROOT & HEALTH CHECK ENDPOINTS (Pre-DB check for instant responsiveness & monitoring)
// ==========================================
app.get(['/', '/api'], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'SkillBridge API Backend is running',
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected ? 'connected' : 'disconnected',
    health: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: 'SkillBridge API is running',
    environment: process.env.NODE_ENV || 'development',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Ensure database connection is ready for API requests (vital for serverless cold/warm starts)
const connectDB = require('./config/db');
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request pipeline:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is properly configured.',
    });
  }
});

// General Rate Limiting: Calibrated per environment
// - Production: 200 requests per 15 minutes (or configurable via GENERAL_RATE_LIMIT_MAX)
// - Development: 1000 requests per 15 minutes (accommodates active browser sessions & local test suites)
// - Test: 2000 requests per 15 minutes
const getGeneralMax = () => {
  if (process.env.GENERAL_RATE_LIMIT_MAX) {
    const parsed = parseInt(process.env.GENERAL_RATE_LIMIT_MAX, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.NODE_ENV === 'production') return 200;
  if (process.env.NODE_ENV === 'test') return 2000;
  return 1000;
};

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: getGeneralMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', generalLimiter);

// Serve static uploads (for resumes) with security headers and disabled directory indexing
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    next();
  },
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'ignore',
    index: false,
  })
);

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Opportunity routes
const opportunityRoutes = require('./routes/opportunityRoutes');
app.use('/api/opportunities', opportunityRoutes);

// Application routes
const applicationRoutes = require('./routes/applicationRoutes');
app.use('/api/applications', applicationRoutes);

// User and Profile/Resume routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// ==========================================
// 3. 404 NOT FOUND HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ==========================================
// 4. CENTRALIZED GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, _next) => {
  // If CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid format for identifier '${err.path || 'id'}'.`,
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: messages,
    });
  }

  const statusCode = res.statusCode === 200 ? err.statusCode || 500 : res.statusCode;

  console.error(`💥 Error [${statusCode}]: ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // In production, mask internal server error details to prevent information leakage
  const responseMessage =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred.'
      : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    errors: err.errors || undefined,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

module.exports = app;
