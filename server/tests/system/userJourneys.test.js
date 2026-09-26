const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Opportunity = require('../../src/models/Opportunity');
const Application = require('../../src/models/Application');
const { UPLOAD_DIR } = require('../../src/middleware/uploadMiddleware');

describe('System / UAT Testing — End-to-End User Journeys & Scenarios', () => {
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
  // SCENARIO 1: COMPLETE STUDENT LIFECYCLE JOURNEY
  // ==========================================
  describe('Scenario 1: Complete Student User Journey', () => {
    it('should complete the entire student lifecycle: Register -> Profile -> Resume -> Discover -> Apply -> Track -> Download', async () => {
      // 1. Student Registration
      const studentPayload = {
        name: 'Elena Rostova',
        email: 'elena.rostova@university.edu',
        password: 'SecurePassword2026!',
        role: 'student',
      };

      const regRes = await request(app)
        .post('/api/auth/register')
        .send(studentPayload)
        .expect(201);

      expect(regRes.body.success).toBe(true);
      const studentToken = regRes.body.token;
      expect(studentToken).toBeDefined();

      // 2. Student sets up profile
      const profileUpdate = {
        phone: '+1 555-0144',
        college: 'Metropolitan State University',
        degree: 'B.S. Software Engineering',
        graduationYear: 2026,
        bio: 'Aspiring full-stack engineer with hands-on MERN and cloud experience.',
        skills: 'react, node.js, express, mongodb, typescript, git',
        github: 'https://github.com/elenarostova',
        linkedin: 'https://linkedin.com/in/elenarostova',
      };

      const profileRes = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(profileUpdate)
        .expect(200);

      expect(profileRes.body.success).toBe(true);
      expect(profileRes.body.user.college).toBe('Metropolitan State University');
      expect(profileRes.body.user.skills).toContain('mongodb');
      expect(profileRes.body.user.skills).toContain('react');

      // 3. Student uploads resume (PDF)
      const fakePdfContent = Buffer.from('%PDF-1.4 Elena Rostova Official Resume 2026');
      const uploadRes = await request(app)
        .post('/api/users/resume')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('resume', fakePdfContent, {
          filename: 'elena_rostova_resume.pdf',
          contentType: 'application/pdf',
        })
        .expect(200);

      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.resume.filename).toBeDefined();
      createdTestFiles.push(uploadRes.body.resume.filename);

      // 4. Student verifies resume download
      const downloadRes = await request(app)
        .get('/api/users/resume')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(downloadRes.headers['content-type']).toContain('pdf');
      expect(downloadRes.body.toString()).toContain('%PDF-1.4 Elena Rostova');

      // Seed an active opportunity posted by a recruiter
      const recruiter = await User.create({
        name: 'Nexus Talent Recruiter',
        email: 'talent@nexuscorp.com',
        password: 'Password123!',
        role: 'recruiter',
      });

      const opportunity = await Opportunity.create({
        title: 'Full Stack Web Developer Intern',
        company: 'Nexus Innovations',
        description: 'Design and deploy modern web apps using React and Node.js.',
        type: 'internship',
        workMode: 'remote',
        location: 'Remote, US',
        skills: ['react', 'node.js', 'mongodb'],
        stipend: '$3000/month',
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        recruiter: recruiter._id,
        isActive: true,
      });

      // 5. Student discovers opportunity via public search and filters
      const searchRes = await request(app)
        .get('/api/opportunities?search=Full+Stack&type=internship&workMode=remote')
        .expect(200);

      expect(searchRes.body.success).toBe(true);
      expect(searchRes.body.count).toBe(1);
      expect(searchRes.body.data[0]._id.toString()).toBe(opportunity._id.toString());

      // 6. Student submits application
      const applyRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          opportunity: opportunity._id.toString(),
          coverLetter: 'I have built multiple full-stack applications with React and Express.',
        })
        .expect(201);

      expect(applyRes.body.success).toBe(true);
      expect(applyRes.body.data.status).toBe('Applied');

      // 7. Student checks application tracking view (GET /api/applications/my)
      const myAppsRes = await request(app)
        .get('/api/applications/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(myAppsRes.body.success).toBe(true);
      expect(myAppsRes.body.count).toBe(1);
      expect(myAppsRes.body.data[0].status).toBe('Applied');
      expect(myAppsRes.body.data[0].opportunity.title).toBe('Full Stack Web Developer Intern');

      // 8. Student attempts to submit duplicate application
      const dupRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          opportunity: opportunity._id.toString(),
          coverLetter: 'Second attempt should fail',
        })
        .expect(409);

      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toContain('already exists');
    });
  });

  // ==========================================
  // SCENARIO 2: COMPLETE RECRUITER LIFECYCLE JOURNEY
  // ==========================================
  describe('Scenario 2: Complete Recruiter User Journey', () => {
    it('should complete recruiter lifecycle: Register -> Create Post -> Review Candidate -> Advance Pipeline -> Deactivate', async () => {
      // 1. Recruiter Registration
      const recruiterRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Marcus Vance',
          email: 'marcus.vance@quantumtech.io',
          password: 'RecruiterSecure123!',
          role: 'recruiter',
        })
        .expect(201);

      const recruiterToken = recruiterRes.body.token;
      const recruiterId = recruiterRes.body.user._id;

      // 2. Recruiter posts a new opportunity
      const postRes = await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send({
          title: 'Cloud Infrastructure Intern',
          company: 'Quantum Tech Solutions',
          description: 'Assist in automating CI/CD pipelines and Docker containerization.',
          type: 'internship',
          workMode: 'remote',
          location: 'San Francisco, CA',
          skills: 'docker, kubernetes, aws, linux',
          stipend: '$3500/month',
          applicationDeadline: '2026-11-15',
        })
        .expect(201);

      const opportunityId = postRes.body.data._id;
      expect(postRes.body.data.recruiter.toString()).toBe(recruiterId.toString());

      // 3. Recruiter verifies posting appears in "My Opportunities"
      const myOppRes = await request(app)
        .get('/api/opportunities/my')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(myOppRes.body.count).toBe(1);
      expect(myOppRes.body.data[0]._id.toString()).toBe(opportunityId.toString());

      // Seed candidate student application
      const candidateUser = await User.create({
        name: 'Jordan Lee',
        email: 'jordan.lee@college.edu',
        password: 'Password123!',
        role: 'student',
        college: 'Tech Institute',
        skills: ['docker', 'linux'],
      });

      const appDoc = await Application.create({
        student: candidateUser._id,
        opportunity: opportunityId,
        coverLetter: 'Strong experience with Docker container orchestration.',
        status: 'Applied',
      });

      // 4. Recruiter reviews applicants for the opportunity
      const applicantsRes = await request(app)
        .get(`/api/applications/opportunity/${opportunityId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(applicantsRes.body.count).toBe(1);
      expect(applicantsRes.body.data[0].student.name).toBe('Jordan Lee');
      expect(applicantsRes.body.data[0].status).toBe('Applied');

      // 5. Recruiter steps applicant through the 5-stage workflow
      const statusTransitions = [
        'Under Review',
        'Shortlisted',
        'Interview',
        'Selected',
      ];

      for (const newStatus of statusTransitions) {
        const updateStatusRes = await request(app)
          .put(`/api/applications/${appDoc._id}/status`)
          .set('Authorization', `Bearer ${recruiterToken}`)
          .send({ status: newStatus })
          .expect(200);

        expect(updateStatusRes.body.data.status).toBe(newStatus);
      }

      // Verify candidate's view reflects the final Selected status
      const candidateToken = (
        await request(app)
          .post('/api/auth/login')
          .send({ email: candidateUser.email, password: 'Password123!' })
      ).body.token;

      const candidateAppView = await request(app)
        .get(`/api/applications/${appDoc._id}`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .expect(200);

      expect(candidateAppView.body.data.status).toBe('Selected');

      // 6. Recruiter deactivates the opportunity
      const deleteRes = await request(app)
        .delete(`/api/opportunities/${opportunityId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .expect(200);

      expect(deleteRes.body.message).toContain('deactivated');

      // Verify opportunity is no longer discoverable in public listings
      const publicCheck = await request(app)
        .get('/api/opportunities')
        .expect(200);

      expect(publicCheck.body.count).toBe(0);
    });
  });

  // ==========================================
  // SCENARIO 3: MULTI-TENANT RBAC & CROSS-TENANT ISOLATION
  // ==========================================
  describe('Scenario 3: Multi-Tenant RBAC & Cross-Tenant Isolation', () => {
    it('should strictly isolate recruiters and students from cross-tenant data access', async () => {
      // Recruiter A & Opportunity A
      const recA = (
        await request(app)
          .post('/api/auth/register')
          .send({ name: 'Recruiter A', email: 'rec.a@comp.com', password: 'Password123!', role: 'recruiter' })
      ).body;

      const oppA = (
        await request(app)
          .post('/api/opportunities')
          .set('Authorization', `Bearer ${recA.token}`)
          .send({
            title: 'Role A',
            company: 'Company A',
            description: 'Desc A',
            type: 'internship',
            workMode: 'remote',
            location: 'Remote',
          })
      ).body.data;

      // Recruiter B & Opportunity B
      const recB = (
        await request(app)
          .post('/api/auth/register')
          .send({ name: 'Recruiter B', email: 'rec.b@comp.com', password: 'Password123!', role: 'recruiter' })
      ).body;

      const oppB = (
        await request(app)
          .post('/api/opportunities')
          .set('Authorization', `Bearer ${recB.token}`)
          .send({
            title: 'Role B',
            company: 'Company B',
            description: 'Desc B',
            type: 'internship',
            workMode: 'remote',
            location: 'Remote',
          })
      ).body.data;

      // Student 1 & Student 2
      const stu1 = (
        await request(app)
          .post('/api/auth/register')
          .send({ name: 'Student 1', email: 'stu1@univ.edu', password: 'Password123!', role: 'student' })
      ).body;

      const stu2 = (
        await request(app)
          .post('/api/auth/register')
          .send({ name: 'Student 2', email: 'stu2@univ.edu', password: 'Password123!', role: 'student' })
      ).body;

      // Student 1 applies to Opportunity A
      const app1 = (
        await request(app)
          .post('/api/applications')
          .set('Authorization', `Bearer ${stu1.token}`)
          .send({ opportunity: oppA._id, coverLetter: 'Student 1 cover' })
      ).body.data;

      // Student 2 applies to Opportunity B
      const app2 = (
        await request(app)
          .post('/api/applications')
          .set('Authorization', `Bearer ${stu2.token}`)
          .send({ opportunity: oppB._id, coverLetter: 'Student 2 cover' })
      ).body.data;

      // 1. Recruiter A cannot view applicants for Opportunity B
      await request(app)
        .get(`/api/applications/opportunity/${oppB._id}`)
        .set('Authorization', `Bearer ${recA.token}`)
        .expect(403);

      // 2. Recruiter A cannot update status of Student 2's application
      await request(app)
        .put(`/api/applications/${app2._id}/status`)
        .set('Authorization', `Bearer ${recA.token}`)
        .send({ status: 'Interview' })
        .expect(403);

      // 3. Recruiter A cannot edit Opportunity B
      await request(app)
        .put(`/api/opportunities/${oppB._id}`)
        .set('Authorization', `Bearer ${recA.token}`)
        .send({ title: 'Tampered Title' })
        .expect(403);

      // 4. Recruiter A cannot delete Opportunity B
      await request(app)
        .delete(`/api/opportunities/${oppB._id}`)
        .set('Authorization', `Bearer ${recA.token}`)
        .expect(403);

      // 5. Student 1 cannot view Student 2's application details
      await request(app)
        .get(`/api/applications/${app2._id}`)
        .set('Authorization', `Bearer ${stu1.token}`)
        .expect(403);

      // 6. Student 1 cannot update application status (recruiter-only)
      await request(app)
        .put(`/api/applications/${app1._id}/status`)
        .set('Authorization', `Bearer ${stu1.token}`)
        .send({ status: 'Selected' })
        .expect(403);

      // 7. Student 1 cannot create opportunities
      await request(app)
        .post('/api/opportunities')
        .set('Authorization', `Bearer ${stu1.token}`)
        .send({ title: 'Student Role' })
        .expect(403);

      // 8. Recruiter A cannot submit an application
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${recA.token}`)
        .send({ opportunity: oppB._id })
        .expect(403);
    });
  });

  // ==========================================
  // SCENARIO 4: BOUNDARY, RESILIENCE & SECURITY INPUTS
  // ==========================================
  describe('Scenario 4: Boundary, Resilience & Security Scenarios', () => {
    it('should safely resist malicious ReDoS and NoSQL operator payloads', async () => {
      // 1. ReDoS payload in search query does not hang server
      const reDosPayload = '((a+)+)+$';
      const searchRes = await request(app)
        .get(`/api/opportunities?search=${encodeURIComponent(reDosPayload)}`)
        .expect(200);

      expect(searchRes.body.success).toBe(true);

      // 2. NoSQL injection attack in JSON body keys is neutralized
      const student = (
        await request(app)
          .post('/api/auth/register')
          .send({ name: 'Sec User', email: 'sec.user@test.com', password: 'Password123!', role: 'student' })
      ).body;

      const sanitizedProfileRes = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${student.token}`)
        .send({
          name: 'Clean Name',
          $where: 'sleep(5000)',
          'profile.role': 'admin',
          bio: 'Safe profile with standard pricing figure $2500 and domain test.com',
        })
        .expect(200);

      expect(sanitizedProfileRes.body.user.name).toBe('Clean Name');
      expect(sanitizedProfileRes.body.user.role).toBe('student'); // Not escalated
      expect(sanitizedProfileRes.body.user.bio).toContain('$2500'); // Valid string preserved
    });

    it('should complete password rotation and verify old credentials are fully revoked', async () => {
      const email = 'rotation.user@example.com';
      const initialPassword = 'InitialPassword123!';
      const newPassword = 'RotatedPassword456!';

      // 1. Register
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Rotation User', email, password: initialPassword, role: 'student' })
        .expect(201);

      const token = userRes.body.token;

      // 2. Update password
      await request(app)
        .put('/api/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: initialPassword, newPassword })
        .expect(200);

      // 3. Old password rejected on login
      await request(app)
        .post('/api/auth/login')
        .send({ email, password: initialPassword })
        .expect(401);

      // 4. New password accepted on login
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email, password: newPassword })
        .expect(200);

      expect(newLogin.body.token).toBeDefined();
    });
  });
});
