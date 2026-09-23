const mongoose = require('mongoose');

/**
 * Connect to MongoDB database using Mongoose ODM.
 * Reads connection string securely from process.env.MONGODB_URI.
 */
let cachedConnection = null;

const connectDB = async () => {
  // If already connected, reuse existing connection (crucial for serverless warm starts)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ FATAL ERROR: MONGODB_URI environment variable is not defined.');
    console.error('👉 Please configure MONGODB_URI in your server/.env file or Vercel Environment Variables.');
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  try {
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    const conn = await cachedConnection;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    cachedConnection = null;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('👉 Ensure your MongoDB server is running or your MongoDB Atlas URI & IP whitelist are configured.');
    throw error;
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected.');
});

module.exports = connectDB;
