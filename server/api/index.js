const app = require('../src/app');

/**
 * Vercel Serverless Function Handler
 * Exports the Express application directly so @vercel/node manages the serverless request lifecycle.
 */
module.exports = app;
