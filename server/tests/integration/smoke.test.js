const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');

describe('Backend Integration Test Foundation Smoke Test', () => {
  it('should respond with 200 OK on GET /api/health against in-memory DB', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('SkillBridge API is running');
    expect(res.body.database).toBe('connected');
  });

  it('should verify connection is pointing to in-memory server, not live DB', () => {
    const host = mongoose.connection.host;
    expect(host).toBe('127.0.0.1');
  });
});
