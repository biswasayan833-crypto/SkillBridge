const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Backend Integration Tests — Authentication API (/api/auth)', () => {
  const studentCredentials = {
    name: 'Alice Student',
    email: 'alice.student@example.com',
    password: 'Password123!',
    role: 'student',
  };

  const recruiterCredentials = {
    name: 'Bob Recruiter',
    email: 'bob.recruiter@example.com',
    password: 'Password123!',
    role: 'recruiter',
  };

  // 1. Successful student registration
  it('1. should successfully register a new student account (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(studentCredentials)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(studentCredentials.email);
    expect(res.body.user.role).toBe('student');
    expect(res.body.user.password).toBeUndefined();

    // Verify persisted in DB
    const savedUser = await User.findOne({ email: studentCredentials.email });
    expect(savedUser).not.toBeNull();
  });

  // 2. Successful recruiter registration
  it('2. should successfully register a new recruiter account (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(recruiterCredentials)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('recruiter');
  });

  // 3. Duplicate email registration rejected (409)
  it('3. should reject registration with an already registered email (409)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(studentCredentials)
      .expect(201);

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({
        ...studentCredentials,
        name: 'Another Name',
      })
      .expect(409);

    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.message).toContain('already exists');
  });

  // 4. Invalid registration data rejected (400)
  it('4. should reject registration with invalid data (400)', async () => {
    const invalidPayloads = [
      { email: 'invalid-email', password: '123', name: '', role: 'student' },
      { email: 'valid@example.com', password: 'Password123!', name: 'Valid', role: 'admin' }, // admin role forbidden
      { email: '', password: 'Password123!', name: 'Valid', role: 'student' },
    ];

    for (const payload of invalidPayloads) {
      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    }
  });

  // 5. Successful login
  it('5. should authenticate registered user and return a JWT token (200)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(studentCredentials);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentCredentials.email,
        password: studentCredentials.password,
      })
      .expect(200);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.email).toBe(studentCredentials.email);
    expect(loginRes.body.user.password).toBeUndefined();
  });

  // 6. Incorrect password rejected
  it('6. should reject login with incorrect password (401)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(studentCredentials);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentCredentials.email,
        password: 'CompletelyWrongPassword!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  // 7. Non-existent account rejected
  it('7. should reject login with non-existent email account (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ghost_account_qa@example.com',
        password: 'Password123!',
      })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  // 8. GET /api/auth/me with valid JWT
  it('8. should return authenticated user data on GET /api/auth/me (200)', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(studentCredentials);

    const token = regRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user).toBeDefined();
    expect(meRes.body.user.email).toBe(studentCredentials.email);
    expect(meRes.body.user.password).toBeUndefined();
  });

  // 9. GET /api/auth/me without JWT
  it('9. should reject GET /api/auth/me without Authorization header (401)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No authorization token provided');
  });

  // 10. GET /api/auth/me with invalid JWT
  it('10. should reject GET /api/auth/me with an invalid or corrupted JWT (401)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.corrupted.token')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid authorization token');
  });

  // 11. Password update with valid credentials
  it('11. should update password with valid credentials and allow login with new password (200)', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(studentCredentials);

    const token = regRes.body.token;
    const newPassword = 'BrandNewPassword456!';

    // Update password
    const updateRes = await request(app)
      .put('/api/auth/update-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: studentCredentials.password,
        newPassword,
      })
      .expect(200);

    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.message).toContain('Password updated successfully');

    // Confirm old password no longer works
    await request(app)
      .post('/api/auth/login')
      .send({
        email: studentCredentials.email,
        password: studentCredentials.password,
      })
      .expect(401);

    // Confirm new password succeeds
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: studentCredentials.email,
        password: newPassword,
      })
      .expect(200);

    expect(newLoginRes.body.success).toBe(true);
    expect(newLoginRes.body.token).toBeDefined();
  });

  // 12. Password update with incorrect current password
  it('12. should reject password update if current password does not match (400)', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(studentCredentials);

    const token = regRes.body.token;

    const res = await request(app)
      .put('/api/auth/update-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongCurrentPassword!',
        newPassword: 'BrandNewPassword456!',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Incorrect current password');
  });

  // 13. Logout endpoint
  it('13. should handle logout request cleanly (200)', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Logged out successfully');
  });

  // 14. Role-guarded endpoint (/api/auth/recruiter-only)
  it('14. should grant recruiter access to recruiter-only route and deny student access (403)', async () => {
    // Register student
    const studentRes = await request(app).post('/api/auth/register').send(studentCredentials);
    // Register recruiter
    const recruiterRes = await request(app).post('/api/auth/register').send(recruiterCredentials);

    // Student denied
    const studentAccess = await request(app)
      .get('/api/auth/recruiter-only')
      .set('Authorization', `Bearer ${studentRes.body.token}`)
      .expect(403);
    expect(studentAccess.body.success).toBe(false);

    // Recruiter granted
    const recruiterAccess = await request(app)
      .get('/api/auth/recruiter-only')
      .set('Authorization', `Bearer ${recruiterRes.body.token}`)
      .expect(200);
    expect(recruiterAccess.body.success).toBe(true);
  });
});
