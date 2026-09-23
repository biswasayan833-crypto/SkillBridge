const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Start HTTP server (bind to 0.0.0.0 for cross-platform local resolution)
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 SkillBridge Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health\n`);
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️  Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        console.log('🛑 HTTP server closed.');
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close(false);
          console.log('🛑 MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`💥 Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`❌ Server Initialization Failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
