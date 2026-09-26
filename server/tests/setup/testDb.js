const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Configure isolated test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_skillbridge_qa_2026';
process.env.JWT_EXPIRES_IN = '7d';

/**
 * Connect to the in-memory database before running tests.
 */
const connectTestDB = async () => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create({
      binary: { version: '7.0.14' },
    });
  }
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
};

/**
 * Clear all collections between individual tests for strict isolation.
 */
const clearTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

/**
 * Disconnect and stop the in-memory database after tests complete.
 */
const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    } catch (_err) {
      // ignore in cleanup
    }
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
};

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

module.exports = {
  connectTestDB,
  clearTestDB,
  closeTestDB,
};
