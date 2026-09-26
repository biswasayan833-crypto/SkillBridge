const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Opportunity = require('../../src/models/Opportunity');
const Application = require('../../src/models/Application');
const { generateToken } = require('../../src/utils/jwt');

describe('Backend Integration Tests — Application API (/api/applications)', () => {
  let student1, student1Token;
  let student2, student2Token;
  let recruiter1, recruiter1Token;
  let recruiter2, recruiter2Token;
  let opportunity1;

  beforeEach(async () => {
    // Seed students
    student1 = await User.create({
      name: 'Student One',
      email: 'student1@example.com',
      password: 'Password123!',
      role: 'student',
    });
    student1Token = generateToken(student1._id, student1.role);

    student2 = await User.create({
      name: 'Student Two',
      email: 'student2@example.com',
      password: 'Password123!',
      role: 'student',
    });
    student2Token = generateToken(student2._id, student2.role);

    // Seed recruiters
    recruiter1 = await User.create({
      name: 'Recruiter Alpha',
      email: 'recruiter.alpha@example.com',
      password: 'Password123!',
      role: 'recruiter',
    });
    recruiter1Token = generateToken(recruiter1._id, recruiter1.role);

    recruiter2 = await User.create({
      name: 'Recruiter Beta',
      email: 'recruiter.beta@example.com',
      password: 'Password123!',
      role: 'recruiter',
    });
    recruiter2Token = generateToken(recruiter2._id, recruiter2.role);

    // Seed opportunity for recruiter1
    opportunity1 = await Opportunity.create({
      title: 'Cloud Architecture Intern',
      company: 'Alpha Cloud Ltd',
      description: 'Design microservices on AWS/GCP.',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiter1._id,
      isActive: true,
      applicationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
    });
  });

  // 1. Student submits application
  it('1. should allow student to submit an application to an active opportunity (201)', async () => {
    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        opportunity: opportunity1._id.toString(),
        coverLetter: 'I am highly passionate about cloud services and distributed systems.',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.opportunity._id.toString()).toBe(opportunity1._id.toString());
    expect(res.body.data.status).toBe('Applied');
  });

  // 2. Student views own applications
  it('2. should allow student to retrieve their own applications via GET /api/applications/my (200)', async () => {
    await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      coverLetter: 'Cover letter 1',
      status: 'Applied',
    });

    const res = await request(app)
      .get('/api/applications/my')
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].opportunity._id.toString()).toBe(opportunity1._id.toString());
  });

  // 3. Duplicate application is rejected
  it('3. should reject duplicate applications by the same student to the same opportunity (409)', async () => {
    await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        opportunity: opportunity1._id.toString(),
        coverLetter: 'First submission',
      })
      .expect(201);

    const dupRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        opportunity: opportunity1._id.toString(),
        coverLetter: 'Second submission attempt',
      })
      .expect(409);

    expect(dupRes.body.success).toBe(false);
    expect(dupRes.body.message).toContain('already exists');
  });

  // 4. Application after deadline is rejected
  it('4. should reject application if opportunity deadline has passed (400)', async () => {
    const expiredOpp = await Opportunity.create({
      title: 'Expired Opportunity',
      company: 'Past Corp',
      description: 'Deadline in past',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiter1._id,
      isActive: true,
      applicationDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    });

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        opportunity: expiredOpp._id.toString(),
        coverLetter: 'Late application',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('deadline for this opportunity has passed');
  });

  // 5. Recruiter views applicants for own opportunity
  it('5. should allow recruiter to view applicants for their opportunity (200)', async () => {
    await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      coverLetter: 'Student 1 cover letter',
    });

    await Application.create({
      student: student2._id,
      opportunity: opportunity1._id,
      coverLetter: 'Student 2 cover letter',
    });

    const res = await request(app)
      .get(`/api/applications/opportunity/${opportunity1._id}`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
  });

  // 6. Recruiter updates application status
  it('6. should allow recruiter to update applicant status to Interview (200)', async () => {
    const appDoc = await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      status: 'Applied',
    });

    const res = await request(app)
      .put(`/api/applications/${appDoc._id}/status`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({ status: 'Interview' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Interview');

    const updated = await Application.findById(appDoc._id);
    expect(updated.status).toBe('Interview');
  });

  // 7. Invalid application status rejected
  it('7. should reject invalid application status transition with 400', async () => {
    const appDoc = await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      status: 'Applied',
    });

    const res = await request(app)
      .put(`/api/applications/${appDoc._id}/status`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .send({ status: 'Hired_Unsupported_Status' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // 8. Student cannot update recruiter-only application status
  it('8. should prevent student from updating application status (403)', async () => {
    const appDoc = await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      status: 'Applied',
    });

    const res = await request(app)
      .put(`/api/applications/${appDoc._id}/status`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ status: 'Selected' })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  // 9. Recruiter cannot access another recruiter's applicants
  it("9. should prevent recruiter from accessing another recruiter's applicants (403)", async () => {
    await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      status: 'Applied',
    });

    const res = await request(app)
      .get(`/api/applications/opportunity/${opportunity1._id}`)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  // 10. Authorized user can retrieve an application
  it('10. should allow student owner and recruiter owner to retrieve application details (200)', async () => {
    const appDoc = await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      status: 'Shortlisted',
    });

    // Student owner can view
    const studentRes = await request(app)
      .get(`/api/applications/${appDoc._id}`)
      .set('Authorization', `Bearer ${student1Token}`)
      .expect(200);
    expect(studentRes.body.success).toBe(true);

    // Recruiter owner can view
    const recruiterRes = await request(app)
      .get(`/api/applications/${appDoc._id}`)
      .set('Authorization', `Bearer ${recruiter1Token}`)
      .expect(200);
    expect(recruiterRes.body.success).toBe(true);
  });

  // 11. Unauthorized user cannot retrieve another user's application
  it("11. should prevent an unrelated student or unrelated recruiter from viewing application (403)", async () => {
    const appDoc = await Application.create({
      student: student1._id,
      opportunity: opportunity1._id,
      status: 'Applied',
    });

    // Student 2 cannot view Student 1's application
    const student2Res = await request(app)
      .get(`/api/applications/${appDoc._id}`)
      .set('Authorization', `Bearer ${student2Token}`)
      .expect(403);
    expect(student2Res.body.success).toBe(false);

    // Recruiter 2 cannot view Recruiter 1's opportunity application
    const recruiter2Res = await request(app)
      .get(`/api/applications/${appDoc._id}`)
      .set('Authorization', `Bearer ${recruiter2Token}`)
      .expect(403);
    expect(recruiter2Res.body.success).toBe(false);
  });

  // 12. Application to inactive opportunity rejected
  it('12. should reject application if opportunity is inactive (404)', async () => {
    const inactiveOpp = await Opportunity.create({
      title: 'Inactive Position',
      company: 'Inactive Co',
      description: 'Position is closed',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiter1._id,
      isActive: false,
    });

    const res = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        opportunity: inactiveOpp._id.toString(),
      })
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});
