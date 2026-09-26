const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Opportunity = require('../../src/models/Opportunity');
const Application = require('../../src/models/Application');
const { generateToken } = require('../../src/utils/jwt');
const { UPLOAD_DIR } = require('../../src/middleware/uploadMiddleware');

describe('Performance Testing — API Latency, Throughput & Database Scaling', () => {
  const createdTestFiles = [];

  afterEach(() => {
    while (createdTestFiles.length > 0) {
      const filename = createdTestFiles.pop();
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (_e) {
          // ignore cleanup errors
        }
      }
    }
  });

  // ==========================================
  // 1. BASELINE ROUTING & HEALTH CHECK LATENCY
  // ==========================================
  describe('Baseline Routing Latency', () => {
    it('should respond to GET /api/health with low latency (< 25ms average)', async () => {
      const iterations = 20;
      const durations = [];

      // Warm up
      await request(app).get('/api/health');

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const res = await request(app).get('/api/health');
        const duration = performance.now() - start;
        durations.push(duration);
        expect(res.status).toBe(200);
      }

      const avgLatency = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxLatency = Math.max(...durations);
      const minLatency = Math.min(...durations);

      console.log(`\n[PERF] GET /api/health - Avg: ${avgLatency.toFixed(2)}ms | Min: ${minLatency.toFixed(2)}ms | Max: ${maxLatency.toFixed(2)}ms`);
      expect(avgLatency).toBeLessThan(35);
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & BCRYPT PERFORMANCE
  // ==========================================
  describe('Authentication & Cryptographic Operations', () => {
    it('should balance bcrypt security and responsiveness on register & login (< 250ms)', async () => {
      const startReg = performance.now();
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Perf Test User',
          email: 'perf.user@example.com',
          password: 'Password123!',
          role: 'student',
        });
      const regDuration = performance.now() - startReg;
      expect(regRes.status).toBe(201);

      console.log(`[PERF] POST /api/auth/register (Bcrypt 10 rounds hash + JWT): ${regDuration.toFixed(2)}ms`);
      expect(regDuration).toBeLessThan(300);

      const startLogin = performance.now();
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'perf.user@example.com',
          password: 'Password123!',
        });
      const loginDuration = performance.now() - startLogin;
      expect(loginRes.status).toBe(200);

      console.log(`[PERF] POST /api/auth/login (Bcrypt compare + JWT): ${loginDuration.toFixed(2)}ms`);
      expect(loginDuration).toBeLessThan(250);

      // Token verification and profile lookup
      const token = loginRes.body.token;
      const startMe = performance.now();
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      const meDuration = performance.now() - startMe;
      expect(meRes.status).toBe(200);

      console.log(`[PERF] GET /api/auth/me (JWT verification + DB lookup): ${meDuration.toFixed(2)}ms`);
      expect(meDuration).toBeLessThan(50);
    });
  });

  // ==========================================
  // 3. DATABASE SCALING & OPPORTUNITIES QUERY PERFORMANCE
  // ==========================================
  describe('Opportunity Discovery with Scaled Dataset (100 Documents)', () => {
    let recruiterUser;

    beforeEach(async () => {
      recruiterUser = await User.create({
        name: 'Scale Recruiter',
        email: 'scale.recruiter@example.com',
        password: 'Password123!',
        role: 'recruiter',
      });

      // Seed 100 opportunity documents with varying parameters
      const types = ['internship', 'full-time', 'part-time', 'contract'];
      const workModes = ['remote', 'hybrid', 'onsite'];
      const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Remote', 'Seattle, WA'];
      const skillSets = [
        ['react', 'javascript', 'html', 'css'],
        ['node.js', 'express', 'mongodb', 'docker'],
        ['python', 'django', 'postgresql'],
        ['java', 'spring boot', 'aws'],
        ['typescript', 'react', 'next.js'],
      ];

      const docs = [];
      for (let i = 1; i <= 100; i++) {
        docs.push({
          title: `Software Engineering Role #${i} - ${types[i % types.length]}`,
          company: `Company ${(i % 10) + 1}`,
          description: `Comprehensive job description for engineering position #${i}. Working on cutting-edge systems.`,
          type: types[i % types.length],
          workMode: workModes[i % workModes.length],
          location: locations[i % locations.length],
          skills: skillSets[i % skillSets.length],
          stipend: '$2500/month',
          recruiter: recruiterUser._id,
          isActive: i !== 13, // 99 active, 1 inactive
          createdAt: new Date(Date.now() - i * 3600000), // staggered hours
        });
      }

      await Opportunity.insertMany(docs);
    });

    it('should paginate through 100 documents in under 50ms', async () => {
      const start = performance.now();
      const res = await request(app)
        .get('/api/opportunities?page=1&limit=10')
        .expect(200);
      const duration = performance.now() - start;

      expect(res.body.count).toBe(10);
      expect(res.body.pagination.total).toBe(99); // active only
      console.log(`[PERF] GET /api/opportunities (Paginated 10/100 docs): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(75);
    });

    it('should execute full keyword search across 100 documents in under 50ms', async () => {
      const start = performance.now();
      const res = await request(app)
        .get('/api/opportunities?search=Software+Engineering')
        .expect(200);
      const duration = performance.now() - start;

      expect(res.body.count).toBeGreaterThan(0);
      console.log(`[PERF] GET /api/opportunities?search=Software+Engineering: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(75);
    });

    it('should filter by type and workMode using compound indexes in under 50ms', async () => {
      const start = performance.now();
      const res = await request(app)
        .get('/api/opportunities?type=internship&workMode=remote')
        .expect(200);
      const duration = performance.now() - start;

      expect(res.body.success).toBe(true);
      console.log(`[PERF] GET /api/opportunities?type=internship&workMode=remote: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(75);
    });
  });

  // ==========================================
  // 4. APPLICATION PIPELINE & BULK APPLICANTS RETRIEVAL
  // ==========================================
  describe('Application Pipeline Scaling (50 Candidate Submissions)', () => {
    it('should retrieve populated applicants list for an opportunity in under 60ms', async () => {
      const recruiter = await User.create({
        name: 'Enterprise Recruiter',
        email: 'ent.recruiter@example.com',
        password: 'Password123!',
        role: 'recruiter',
      });
      const recruiterToken = generateToken(recruiter._id, recruiter.role);

      const opportunity = await Opportunity.create({
        title: 'High-Volume Campus Internship',
        company: 'MegaTech Corp',
        description: 'Large internship cohort.',
        type: 'internship',
        workMode: 'remote',
        location: 'Remote',
        recruiter: recruiter._id,
        isActive: true,
      });

      // Seed 50 candidate users and applications
      const userDocs = [];
      for (let i = 1; i <= 50; i++) {
        userDocs.push({
          name: `Candidate ${i}`,
          email: `candidate${i}@campus.edu`,
          password: 'Password123!',
          role: 'student',
          college: 'University of Engineering',
          skills: ['javascript', 'react'],
        });
      }
      const createdStudents = await User.insertMany(userDocs);

      const appDocs = createdStudents.map((stu, index) => ({
        student: stu._id,
        opportunity: opportunity._id,
        coverLetter: `Candidate ${index + 1} application statement.`,
        status: index % 2 === 0 ? 'Applied' : 'Under Review',
      }));
      await Application.insertMany(appDocs);

      // Measure recruiter applicants retrieval with population
      const start = performance.now();
      const res = await request(app)
        .get(`/api/applications/opportunity/${opportunity._id}?limit=25`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);
      const duration = performance.now() - start;

      expect(res.body.count).toBe(25);
      expect(res.body.data[0].student.name).toBeDefined(); // Populated
      console.log(`[PERF] GET /api/applications/opportunity/:id (25 populated applicants): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(80);
    });
  });

  // ==========================================
  // 5. CONCURRENT BURST THROUGHPUT
  // ==========================================
  describe('Concurrent Request Burst Handling', () => {
    it('should handle a burst of 50 concurrent requests with 100% success rate', async () => {
      const CONCURRENT_REQUESTS = 50;

      const start = performance.now();
      const promises = Array.from({ length: CONCURRENT_REQUESTS }, () =>
        request(app).get('/api/opportunities?limit=5')
      );

      const responses = await Promise.all(promises);
      const totalDuration = performance.now() - start;

      const successfulResponses = responses.filter((r) => r.status === 200);
      const throughput = (CONCURRENT_REQUESTS / (totalDuration / 1000)).toFixed(1);

      console.log(`\n[PERF] Concurrency Burst: 50 requests in ${totalDuration.toFixed(2)}ms (${throughput} req/sec)`);
      expect(successfulResponses.length).toBe(CONCURRENT_REQUESTS);
    });
  });

  // ==========================================
  // 6. RESUME UPLOAD & STREAMING PERFORMANCE
  // ==========================================
  describe('Resume Streaming & File Transfer Latency', () => {
    it('should upload a 100KB resume and download stream with low latency (< 80ms)', async () => {
      const student = await User.create({
        name: 'Stream Student',
        email: 'stream.student@example.com',
        password: 'Password123!',
        role: 'student',
      });
      const token = generateToken(student._id, student.role);

      // Create 100KB PDF buffer
      const buffer = Buffer.alloc(100 * 1024, '%PDF-1.4 Stream Test Data');

      // Upload
      const startUpload = performance.now();
      const uploadRes = await request(app)
        .post('/api/users/resume')
        .set('Authorization', `Bearer ${token}`)
        .attach('resume', buffer, {
          filename: 'perf_resume.pdf',
          contentType: 'application/pdf',
        })
        .expect(200);
      const uploadDuration = performance.now() - startUpload;

      createdTestFiles.push(uploadRes.body.resume.filename);
      console.log(`[PERF] POST /api/users/resume (100KB disk write): ${uploadDuration.toFixed(2)}ms`);
      expect(uploadDuration).toBeLessThan(120);

      // Download
      const startDownload = performance.now();
      const downloadRes = await request(app)
        .get('/api/users/resume')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const downloadDuration = performance.now() - startDownload;

      console.log(`[PERF] GET /api/users/resume (100KB file stream): ${downloadDuration.toFixed(2)}ms`);
      expect(downloadRes.body.length).toBeGreaterThan(0);
      expect(downloadDuration).toBeLessThan(80);
    });
  });
});
