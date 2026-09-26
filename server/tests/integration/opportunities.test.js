const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Opportunity = require('../../src/models/Opportunity');
const { generateToken } = require('../../src/utils/jwt');

describe('Backend Integration Tests — Opportunities API (/api/opportunities)', () => {
  let recruiterUser;
  let recruiterToken;
  let otherRecruiterUser;
  let otherRecruiterToken;
  let studentUser;
  let studentToken;

  beforeEach(async () => {
    // Seed primary recruiter
    recruiterUser = await User.create({
      name: 'Primary Recruiter',
      email: 'recruiter1@example.com',
      password: 'Password123!',
      role: 'recruiter',
    });
    recruiterToken = generateToken(recruiterUser._id, recruiterUser.role);

    // Seed secondary recruiter
    otherRecruiterUser = await User.create({
      name: 'Other Recruiter',
      email: 'recruiter2@example.com',
      password: 'Password123!',
      role: 'recruiter',
    });
    otherRecruiterToken = generateToken(otherRecruiterUser._id, otherRecruiterUser.role);

    // Seed student
    studentUser = await User.create({
      name: 'Test Student',
      email: 'student@example.com',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = generateToken(studentUser._id, studentUser.role);
  });

  // 1. Public opportunity listing
  it('1. should return active opportunities on public GET /api/opportunities (200)', async () => {
    await Opportunity.create({
      title: 'Frontend Developer Intern',
      company: 'Tech Innovators',
      description: 'Work with React, HTML, CSS.',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      skills: ['react', 'javascript'],
      recruiter: recruiterUser._id,
      isActive: true,
    });

    // Inactive opportunity should NOT appear
    await Opportunity.create({
      title: 'Archived Role',
      company: 'Old Corp',
      description: 'Expired position.',
      type: 'full-time',
      workMode: 'onsite',
      location: 'Chicago, IL',
      recruiter: recruiterUser._id,
      isActive: false,
    });

    const res = await request(app)
      .get('/api/opportunities')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('Frontend Developer Intern');
  });

  // 2. Search
  it('2. should match opportunities by keyword search in title or skills (200)', async () => {
    await Opportunity.create([
      {
        title: 'Backend Node.js Engineer',
        company: 'Cloud Corp',
        description: 'Design RESTful APIs.',
        type: 'full-time',
        workMode: 'remote',
        location: 'Remote',
        skills: ['node.js', 'mongodb'],
        recruiter: recruiterUser._id,
        isActive: true,
      },
      {
        title: 'Data Analyst Intern',
        company: 'DataMetrics',
        description: 'SQL and Python reporting.',
        type: 'internship',
        workMode: 'onsite',
        location: 'Boston, MA',
        skills: ['python', 'sql'],
        recruiter: recruiterUser._id,
        isActive: true,
      },
    ]);

    const res = await request(app)
      .get('/api/opportunities?search=Backend')
      .expect(200);

    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('Backend Node.js Engineer');
  });

  // 3. Filtering
  it('3. should filter opportunities by type and workMode (200)', async () => {
    await Opportunity.create([
      {
        title: 'Remote Internship',
        company: 'Alpha Inc',
        description: 'Internship role.',
        type: 'internship',
        workMode: 'remote',
        location: 'Remote',
        recruiter: recruiterUser._id,
        isActive: true,
      },
      {
        title: 'Onsite Full-time',
        company: 'Beta Corp',
        description: 'Full time position.',
        type: 'full-time',
        workMode: 'onsite',
        location: 'New York, NY',
        recruiter: recruiterUser._id,
        isActive: true,
      },
    ]);

    const res = await request(app)
      .get('/api/opportunities?type=internship&workMode=remote')
      .expect(200);

    expect(res.body.count).toBe(1);
    expect(res.body.data[0].title).toBe('Remote Internship');
  });

  // 4. Pagination
  it('4. should correctly paginate opportunities with page and limit (200)', async () => {
    for (let i = 1; i <= 5; i++) {
      await Opportunity.create({
        title: `Opportunity #${i}`,
        company: `Company ${i}`,
        description: `Description for role ${i}`,
        type: 'internship',
        workMode: 'remote',
        location: 'Remote',
        recruiter: recruiterUser._id,
        isActive: true,
      });
    }

    const res = await request(app)
      .get('/api/opportunities?page=1&limit=2')
      .expect(200);

    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.pages).toBe(3);
    expect(res.body.data.length).toBe(2);
  });

  // 5. Sorting
  it('5. should sort opportunities by newest / oldest (200)', async () => {
    await Opportunity.create({
      title: 'First Created Opportunity',
      company: 'Company A',
      description: 'Role A',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiterUser._id,
      createdAt: new Date('2026-01-01'),
      isActive: true,
    });

    await Opportunity.create({
      title: 'Second Created Opportunity',
      company: 'Company B',
      description: 'Role B',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiterUser._id,
      createdAt: new Date('2026-02-01'),
      isActive: true,
    });

    const resOldest = await request(app)
      .get('/api/opportunities?sort=oldest')
      .expect(200);
    expect(resOldest.body.data[0].title).toBe('First Created Opportunity');

    const resNewest = await request(app)
      .get('/api/opportunities?sort=newest')
      .expect(200);
    expect(resNewest.body.data[0].title).toBe('Second Created Opportunity');
  });

  // 6. Get individual opportunity
  it('6. should return opportunity details for a valid active opportunity ID (200)', async () => {
    const opp = await Opportunity.create({
      title: 'Mobile App Developer',
      company: 'AppWorks',
      description: 'React Native development.',
      type: 'contract',
      workMode: 'hybrid',
      location: 'Seattle, WA',
      recruiter: recruiterUser._id,
      isActive: true,
    });

    const res = await request(app)
      .get(`/api/opportunities/${opp._id}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Mobile App Developer');
    expect(res.body.data.recruiter.name).toBe('Primary Recruiter');
  });

  // 7. Recruiter creates opportunity
  it('7. should allow authenticated recruiter to create a new opportunity (201)', async () => {
    const newOpp = {
      title: 'DevOps Engineer Intern',
      company: 'Infrastructure Pro',
      description: 'Docker, CI/CD, Kubernetes.',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      skills: 'docker, kubernetes, ci/cd',
      stipend: '$2000/month',
      applicationDeadline: '2026-11-30',
    };

    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(newOpp)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(newOpp.title);
    expect(res.body.data.recruiter.toString()).toBe(recruiterUser._id.toString());
    expect(Array.isArray(res.body.data.skills)).toBe(true);
  });

  // 8. Student cannot create opportunity
  it('8. should reject opportunity creation by a student with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Posting',
        company: 'Fake Corp',
        description: 'Desc',
        type: 'internship',
        workMode: 'remote',
        location: 'Remote',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not authorized');
  });

  // 9. Recruiter updates own opportunity
  it('9. should allow recruiter to update their own opportunity (200)', async () => {
    const opp = await Opportunity.create({
      title: 'Initial Title',
      company: 'Original Co',
      description: 'Initial description',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiterUser._id,
      isActive: true,
    });

    const res = await request(app)
      .put(`/api/opportunities/${opp._id}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Updated Senior Title',
        workMode: 'hybrid',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Senior Title');
    expect(res.body.data.workMode).toBe('hybrid');
  });

  // 10. Recruiter cannot update another recruiter's opportunity
  it("10. should prevent a recruiter from updating another recruiter's opportunity (403)", async () => {
    const opp = await Opportunity.create({
      title: 'Primary Recruiter Opp',
      company: 'Company A',
      description: 'Role',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiterUser._id,
      isActive: true,
    });

    const res = await request(app)
      .put(`/api/opportunities/${opp._id}`)
      .set('Authorization', `Bearer ${otherRecruiterToken}`)
      .send({
        title: 'Hacked Title',
      })
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });

  // 11. Recruiter soft-deletes own opportunity
  it('11. should soft-delete / deactivate opportunity when recruiter deletes it (200)', async () => {
    const opp = await Opportunity.create({
      title: 'To Be Deactivated',
      company: 'Company Z',
      description: 'Closing soon',
      type: 'internship',
      workMode: 'remote',
      location: 'Remote',
      recruiter: recruiterUser._id,
      isActive: true,
    });

    const res = await request(app)
      .delete(`/api/opportunities/${opp._id}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deactivated successfully');

    // Confirm opportunity is now marked isActive: false in DB
    const checkDb = await Opportunity.findById(opp._id);
    expect(checkDb.isActive).toBe(false);

    // Confirm it is not visible in public listing
    const publicList = await request(app).get('/api/opportunities');
    expect(publicList.body.count).toBe(0);
  });

  // 12. Unauthorized opportunity management request
  it('12. should reject opportunity management requests without JWT with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .send({ title: 'No Auth' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  // 13. Invalid opportunity data
  it('13. should reject creation with invalid or missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'AB', // too short
        company: '',
        type: 'invalid-type',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  // 14. Recruiter retrieves own postings
  it('14. should return only the authenticated recruiter postings on GET /api/opportunities/my (200)', async () => {
    // Create 2 postings for recruiter1
    await Opportunity.create([
      {
        title: 'Recruiter 1 Post A',
        company: 'Company 1',
        description: 'Desc',
        type: 'internship',
        workMode: 'remote',
        location: 'Remote',
        recruiter: recruiterUser._id,
      },
      {
        title: 'Recruiter 1 Post B',
        company: 'Company 1',
        description: 'Desc',
        type: 'internship',
        workMode: 'remote',
        location: 'Remote',
        recruiter: recruiterUser._id,
      },
      // 1 posting for recruiter2
      {
        title: 'Recruiter 2 Post C',
        company: 'Company 2',
        description: 'Desc',
        type: 'internship',
        workMode: 'remote',
        location: 'Remote',
        recruiter: otherRecruiterUser._id,
      },
    ]);

    const res = await request(app)
      .get('/api/opportunities/my')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);

    expect(res.body.count).toBe(2);
    expect(res.body.data.every((o) => o.recruiter._id.toString() === recruiterUser._id.toString())).toBe(true);
  });

  // 15. Non-existent opportunity
  it('15. should return 404 for a non-existent opportunity ID', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/opportunities/${nonExistentId}`)
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});
