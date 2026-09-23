const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for authentication endpoints (prevents brute-force credential stuffing).
 * Calibrated per environment:
 * - Production: 30 requests / 15 minutes (or configured via AUTH_RATE_LIMIT_MAX)
 * - Development: 150 requests / 15 minutes
 * - Test: 1000 requests / 15 minutes (ensures extensive automated suites run smoothly)
 */
const getAuthMax = () => {
  if (process.env.AUTH_RATE_LIMIT_MAX) {
    const parsed = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.NODE_ENV === 'production') return 30;
  if (process.env.NODE_ENV === 'test') return 1000;
  return 500;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: getAuthMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});

/**
 * Rate limiter for file upload endpoints to guard against storage denial-of-service.
 * - Production: 20 uploads / 15 minutes
 * - Development: 100 uploads / 15 minutes
 * - Test: 500 uploads / 15 minutes
 */
const getUploadMax = () => {
  if (process.env.NODE_ENV === 'production') return 20;
  if (process.env.NODE_ENV === 'test') return 500;
  return 100;
};

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: getUploadMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many file upload requests from this IP address. Please try again after 15 minutes.',
  },
});

module.exports = {
  authLimiter,
  uploadLimiter,
};
