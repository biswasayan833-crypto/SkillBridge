const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/jwt');
const { UPLOAD_DIR } = require('../../src/middleware/uploadMiddleware');

describe('Backend Integration Tests — Profile & Resume API (/api/users)', () => {
  let studentUser;
  let studentToken;
  let recruiterUser;
  let recruiterToken;
  const createdTestFiles = [];

  beforeEach(async () => {
    studentUser = await User.create({
      name: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      password: 'Password123!',
      role: 'student',
      college: 'Cyberdyne Tech',
      degree: 'B.S. Security Engineering',
      graduationYear: 2026,
      bio: 'Cybersecurity and software enthusiast.',
      skills: ['c++', 'python', 'security'],
    });
    studentToken = generateToken(studentUser._id, studentUser.role);

    recruiterUser = await User.create({
      name: 'Miles Dyson',
      email: 'miles.dyson@example.com',
      password: 'Password123!',
      role: 'recruiter',
    });
    recruiterToken = generateToken(recruiterUser._id, recruiterUser.role);
  });

  afterEach(() => {
    // Clean up any test files created on disk
    while (createdTestFiles.length > 0) {
      const filename = createdTestFiles.pop();
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (_e) {
          // ignore cleanup error
        }
      }
    }
  });

  // 1. Authenticated user retrieves profile
  it('1. should retrieve current authenticated user profile on GET /api/users/profile (200)', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(studentUser.email);
    expect(res.body.user.college).toBe('Cyberdyne Tech');
    expect(res.body.user.password).toBeUndefined();
  });

  // 2. User updates profile
  it('2. should update allowed profile fields on PUT /api/users/profile (200)', async () => {
    const updateData = {
      name: 'Sarah Connor Updated',
      phone: '+1 555-0100',
      location: 'Los Angeles, CA',
      bio: 'Leading autonomous systems and resilience.',
      skills: 'python, kubernetes, go',
      github: 'https://github.com/sarahconnor',
      linkedin: 'https://linkedin.com/in/sarahconnor',
    };

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(updateData)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Sarah Connor Updated');
    expect(res.body.user.phone).toBe('+1 555-0100');
    expect(res.body.user.location).toBe('Los Angeles, CA');
    expect(res.body.user.skills).toContain('kubernetes');

    // Confirm persisted in database
    const dbUser = await User.findById(studentUser._id);
    expect(dbUser.name).toBe('Sarah Connor Updated');
    expect(dbUser.location).toBe('Los Angeles, CA');
  });

  // 3. Forbidden fields cannot be modified
  it('3. should reject modification of protected fields (password, role, email) with 400', async () => {
    const forbiddenPayloads = [
      { role: 'admin' },
      { password: 'HackedPassword123!' },
      { email: 'newemail@example.com' },
      { _id: '60c72b2f9b1d8b2bad6e1a34' },
      { resume: { url: 'fake' } },
    ];

    for (const payload of forbiddenPayloads) {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot be updated through the profile endpoint');
    }
  });

  // 4. Student uploads valid resume
  it('4. should allow student to upload a valid PDF resume (200)', async () => {
    const fakePdf = Buffer.from('%PDF-1.4 test resume content for student');

    const res = await request(app)
      .post('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', fakePdf, {
        filename: 'connor_resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.resume).toBeDefined();
    expect(res.body.resume.url).toContain('/uploads/resumes/');
    expect(res.body.resume.filename).toBeDefined();

    createdTestFiles.push(res.body.resume.filename);

    // Confirm in DB
    const dbUser = await User.findById(studentUser._id);
    expect(dbUser.resume.filename).toBe(res.body.resume.filename);
  });

  // 5. Invalid resume type rejected
  it('5. should reject unsupported file format upload with 400', async () => {
    const fakeText = Buffer.from('plain text file');

    const res = await request(app)
      .post('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', fakeText, {
        filename: 'resume.txt',
        contentType: 'text/plain',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Only PDF (.pdf) and DOCX (.docx) documents are permitted');
  });

  // 6. Oversized resume rejected
  it('6. should reject resume exceeding 5MB limit with 400', async () => {
    const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0);

    const res = await request(app)
      .post('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', oversizedBuffer, {
        filename: 'large_resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Maximum permitted file size is 5 MB');
  });

  // 7. Student downloads own resume
  it('7. should allow student to download their uploaded resume on GET /api/users/resume (200)', async () => {
    // 1. Upload resume first
    const fakePdf = Buffer.from('%PDF-1.4 test resume download');
    const uploadRes = await request(app)
      .post('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', fakePdf, {
        filename: 'download_test.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    createdTestFiles.push(uploadRes.body.resume.filename);

    // 2. Download resume
    const downloadRes = await request(app)
      .get('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(downloadRes.headers['content-type']).toContain('pdf');
    expect(downloadRes.body.toString()).toContain('%PDF-1.4');
  });

  // 8. Student deletes resume
  it('8. should delete uploaded resume and clear metadata on DELETE /api/users/resume (200)', async () => {
    // 1. Upload resume
    const fakePdf = Buffer.from('%PDF-1.4 test resume delete');
    const uploadRes = await request(app)
      .post('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('resume', fakePdf, {
        filename: 'delete_test.pdf',
        contentType: 'application/pdf',
      })
      .expect(200);

    const uploadedFilename = uploadRes.body.resume.filename;
    createdTestFiles.push(uploadedFilename);

    // 2. Delete resume
    const deleteRes = await request(app)
      .delete('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(deleteRes.body.success).toBe(true);
    expect(deleteRes.body.message).toContain('deleted successfully');

    // 3. Confirm file deleted from disk
    const filePath = path.join(UPLOAD_DIR, uploadedFilename);
    expect(fs.existsSync(filePath)).toBe(false);

    // 4. Confirm DB record cleared
    const dbUser = await User.findById(studentUser._id);
    expect(dbUser.resume.filename).toBe('');
    expect(dbUser.resume.url).toBe('');
  });

  // 9. Unauthenticated access is rejected
  it('9. should reject unauthenticated requests to profile and resume endpoints (401)', async () => {
    await request(app).get('/api/users/profile').expect(401);
    await request(app).put('/api/users/profile').send({}).expect(401);
    await request(app).get('/api/users/resume').expect(401);
    await request(app).delete('/api/users/resume').expect(401);
  });

  // 10. Recruiter cannot upload student resume
  it('10. should prevent recruiters from uploading resumes on student resume endpoint (403)', async () => {
    const fakePdf = Buffer.from('%PDF-1.4 recruiter payload');

    const res = await request(app)
      .post('/api/users/resume')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .attach('resume', fakePdf, {
        filename: 'recruiter.pdf',
        contentType: 'application/pdf',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // 11. GET /api/users/resume when no resume uploaded returns 404
  it('11. should return 404 on GET /api/users/resume when user has no uploaded resume', async () => {
    const res = await request(app)
      .get('/api/users/resume')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No resume found');
  });
});
