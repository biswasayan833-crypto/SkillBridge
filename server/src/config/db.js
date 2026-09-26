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

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ FATAL ERROR: Neither MONGODB_URI nor MONGO_URI environment variable is defined.');
    console.error('👉 Please configure MONGODB_URI in your server/.env file or Vercel Environment Variables.');
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  // Use public DNS resolvers for mongodb+srv URIs to prevent Windows local router ECONNREFUSED on SRV queries
  if (uri.startsWith('mongodb+srv://') && process.env.NODE_ENV !== 'test') {
    try {
      const dns = require('dns');
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    } catch (_dnsErr) {
      // Ignore if environment restricts custom DNS
    }
  }

  try {
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });

    const conn = await cachedConnection;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    // If remote Atlas fails (e.g. dynamic IP whitelist lockout or offline) and local MongoDB is available
    if (uri.startsWith('mongodb+srv://') && !process.env.VERCEL) {
      try {
        console.warn('⚠️  Remote MongoDB Atlas unavailable. Falling back to local MongoDB service...');
        cachedConnection = mongoose.connect('mongodb://127.0.0.1:27017/skillbridge', {
          serverSelectionTimeoutMS: 3000,
        });
        const conn = await cachedConnection;
        console.log(`✅ MongoDB Connected (Local Fallback): ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (_fallbackErr) {
        // Fall through to primary error reporting
      }
    }

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
