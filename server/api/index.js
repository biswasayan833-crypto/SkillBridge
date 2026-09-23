const app = require('../src/app');
const connectDB = require('../src/config/db');

/**
 * Vercel Serverless Function Handler
 * Wraps the existing Express app, ensuring database connectivity before processing incoming requests.
 */
module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless database connection error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is properly configured in Vercel Environment Variables.',
    });
  }

  return app(req, res);
};
