const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { generateToken, verifyToken } = require('../../src/utils/jwt');
const User = require('../../src/models/User');

describe('Backend Unit Tests — Authentication & JWT', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  describe('JWT Utility Functions', () => {
    it('should generate a valid signed JWT containing user id', () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const token = generateToken(mockUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, originalSecret);
      expect(decoded.id).toBe(mockUserId.toString());
      expect(decoded.role).toBeUndefined();
    });

    it('should include role in the JWT payload when provided', () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const role = 'recruiter';
      const token = generateToken(mockUserId, role);

      const decoded = jwt.verify(token, originalSecret);
      expect(decoded.id).toBe(mockUserId.toString());
      expect(decoded.role).toBe('recruiter');
    });

    it('should throw an error during generateToken if JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      const mockUserId = new mongoose.Types.ObjectId();

      expect(() => generateToken(mockUserId)).toThrow(
        'JWT_SECRET environment variable is missing.'
      );
    });

    it('should verify and decode a valid token successfully', () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const token = generateToken(mockUserId, 'student');

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUserId.toString());
      expect(decoded.role).toBe('student');
    });

    it('should reject a tampered JWT with JsonWebTokenError', () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const validToken = generateToken(mockUserId);
      const tamperedToken = validToken.slice(0, -6) + 'xyz123';

      expect(() => verifyToken(tamperedToken)).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject a malformed JWT token string', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      expect(() => verifyToken(malformedToken)).toThrow();
    });

    it('should reject an expired JWT with TokenExpiredError', () => {
      // Create a token that expired 10 seconds ago
      const expiredToken = jwt.sign(
        { id: new mongoose.Types.ObjectId().toString(), role: 'student' },
        originalSecret,
        { expiresIn: '-10s' }
      );

      expect(() => verifyToken(expiredToken)).toThrow(jwt.TokenExpiredError);
    });

    it('should throw an error during verifyToken if JWT_SECRET is missing', () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const token = generateToken(mockUserId);

      delete process.env.JWT_SECRET;
      expect(() => verifyToken(token)).toThrow(
        'JWT_SECRET environment variable is missing.'
      );
    });
  });

  describe('User Model — Password Hashing & Comparison', () => {
    it('should automatically hash plain text password on save using bcrypt', async () => {
      const plainPassword = 'SuperSecretPassword123!';
      const user = new User({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: plainPassword,
        role: 'student',
      });

      await user.save();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('should not re-hash the password when updating other user fields', async () => {
      const user = await User.create({
        name: 'Alice Smith',
        email: 'alice.smith@example.com',
        password: 'Password123!',
        role: 'student',
      });

      const initialHash = user.password;

      // Update name only
      user.name = 'Alice Johnson';
      await user.save();

      expect(user.password).toBe(initialHash);
    });

    it('should correctly re-hash when the password field is explicitly modified', async () => {
      const user = await User.create({
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        password: 'FirstPassword123!',
        role: 'recruiter',
      });

      const firstHash = user.password;

      user.password = 'SecondPassword456!';
      await user.save();

      expect(user.password).not.toBe(firstHash);
      const isMatchNew = await user.comparePassword('SecondPassword456!');
      expect(isMatchNew).toBe(true);
    });

    it('should return true for matching candidate password via comparePassword', async () => {
      const plainPassword = 'CorrectPassword999';
      const user = await User.create({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: plainPassword,
        role: 'student',
      });

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect candidate password via comparePassword', async () => {
      const user = await User.create({
        name: 'Dave Miller',
        email: 'dave@example.com',
        password: 'ValidPassword123!',
        role: 'student',
      });

      const isMatch = await user.comparePassword('WrongPassword123!');
      expect(isMatch).toBe(false);
    });

    it('should reject a password with less than 6 characters during validation', async () => {
      const shortUser = new User({
        name: 'Short Pass',
        email: 'short@example.com',
        password: '12345',
        role: 'student',
      });

      let error;
      try {
        await shortUser.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
      expect(error.errors.password.message).toContain('at least 6 characters');
    });

    it('should reject an invalid email address format during validation', async () => {
      const badEmailUser = new User({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'Password123!',
        role: 'student',
      });

      let error;
      try {
        await badEmailUser.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    });

    it('should reject invalid role outside enum definition', async () => {
      const badRoleUser = new User({
        name: 'Bad Role',
        email: 'badrole@example.com',
        password: 'Password123!',
        role: 'superadmin',
      });

      let error;
      try {
        await badRoleUser.validate();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
      expect(error.errors.role.message).toContain('is not a valid role');
    });
  });
});
