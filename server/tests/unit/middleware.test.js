const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('../../src/middleware/authMiddleware');
const sanitize = require('../../src/middleware/sanitize');
const validate = require('../../src/middleware/validate');
const User = require('../../src/models/User');
const { generateToken } = require('../../src/utils/jwt');

describe('Backend Unit Tests — Middleware', () => {
  // ==========================================
  // 1. AUTHENTICATION MIDDLEWARE (verifyToken)
  // ==========================================
  describe('verifyToken Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
      mockReq = {
        headers: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it('should return 401 if Authorization header is missing', async () => {
      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No authorization token provided'),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if Authorization header does not use Bearer scheme', async () => {
      mockReq.headers.authorization = 'Basic dXNlcjpwYXNz';

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('No authorization token provided'),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if Bearer token is empty', async () => {
      mockReq.headers.authorization = 'Bearer    ';

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token signature is invalid or tampered', async () => {
      mockReq.headers.authorization = 'Bearer invalid.tampered.token';

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid authorization token.',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token has expired', async () => {
      const expiredToken = jwt.sign(
        { id: new mongoose.Types.ObjectId().toString(), role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '-10s' }
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authorization token has expired. Please log in again.',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if user belonging to token does not exist in DB', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const validToken = generateToken(nonExistentUserId, 'student');
      mockReq.headers.authorization = `Bearer ${validToken}`;

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User belonging to this token no longer exists.',
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should attach user to req.user and call next() if token and user are valid', async () => {
      const user = await User.create({
        name: 'Middleware Test User',
        email: 'middleware_user@example.com',
        password: 'Password123!',
        role: 'student',
      });

      const validToken = generateToken(user._id, user.role);
      mockReq.headers.authorization = `Bearer ${validToken}`;

      await verifyToken(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(user._id.toString());
      expect(mockReq.user.password).toBeUndefined(); // ensure password was excluded
    });
  });

  // ==========================================
  // 2. ROLE-BASED ACCESS CONTROL (checkRole)
  // ==========================================
  describe('checkRole Authorization Middleware', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it('should return 401 if req.user is undefined', () => {
      const middleware = checkRole('recruiter', 'admin');
      middleware(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Authentication required before role verification'),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not authorized', () => {
      mockReq.user = { role: 'student' };
      const middleware = checkRole('recruiter', 'admin');
      middleware(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Role 'student' is not authorized"),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should call next() if user role is one of the allowed roles', () => {
      mockReq.user = { role: 'recruiter' };
      const middleware = checkRole('recruiter', 'admin');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() if admin accesses recruiter/admin endpoint', () => {
      mockReq.user = { role: 'admin' };
      const middleware = checkRole('recruiter', 'admin');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow student role when checkRole strictly requires student', () => {
      mockReq.user = { role: 'student' };
      const middleware = checkRole('student');
      middleware(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 3. SANITIZATION MIDDLEWARE (sanitize)
  // ==========================================
  describe('Sanitization Middleware (sanitize)', () => {
    let mockReq;
    let mockRes;
    let nextFunction;

    beforeEach(() => {
      mockReq = {};
      mockRes = {};
      nextFunction = jest.fn();
    });

    it('should strip keys starting with "$" to prevent NoSQL operator injection', () => {
      mockReq.body = {
        email: { $gt: '' },
        password: 'Password123!',
      };

      sanitize(mockReq, mockRes, nextFunction);

      expect(mockReq.body.email).toEqual({});
      expect(mockReq.body.password).toBe('Password123!');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should strip dotted property path keys to prevent nested path injection', () => {
      mockReq.body = {
        'profile.role': 'admin',
        validKey: 'validValue',
      };

      sanitize(mockReq, mockRes, nextFunction);

      expect(mockReq.body['profile.role']).toBeUndefined();
      expect(mockReq.body.validKey).toBe('validValue');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should recursively clean nested objects and arrays', () => {
      mockReq.body = {
        nested: {
          $where: 'sleep(1000)',
          safeField: 'safe',
        },
        list: [
          { $ne: null, normal: 'test' },
          'regular-string',
        ],
      };

      sanitize(mockReq, mockRes, nextFunction);

      expect(mockReq.body.nested.$where).toBeUndefined();
      expect(mockReq.body.nested.safeField).toBe('safe');
      expect(mockReq.body.list[0].$ne).toBeUndefined();
      expect(mockReq.body.list[0].normal).toBe('test');
      expect(mockReq.body.list[1]).toBe('regular-string');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should preserve legitimate string values containing "$" and "." characters', () => {
      mockReq.body = {
        email: 'john.doe@sub.example.com',
        price: '$50.00/hr',
        website: 'https://skillbridge.dev/portal',
      };

      sanitize(mockReq, mockRes, nextFunction);

      expect(mockReq.body.email).toBe('john.doe@sub.example.com');
      expect(mockReq.body.price).toBe('$50.00/hr');
      expect(mockReq.body.website).toBe('https://skillbridge.dev/portal');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should sanitize req.query and req.params as well', () => {
      mockReq.query = { $ne: 'malicious', search: 'developer' };
      mockReq.params = { 'id.nested': 'bad', id: '12345' };

      sanitize(mockReq, mockRes, nextFunction);

      expect(mockReq.query.$ne).toBeUndefined();
      expect(mockReq.query.search).toBe('developer');
      expect(mockReq.params['id.nested']).toBeUndefined();
      expect(mockReq.params.id).toBe('12345');
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 4. VALIDATION FORMATTER MIDDLEWARE (validate)
  // ==========================================
  describe('validate Formatter Middleware', () => {
    it('should call next() if there are no validation errors', () => {
      const mockReq = {
        // Mock express-validator result
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const nextFunction = jest.fn();

      // When req has no express-validator errors, validationResult(mockReq).isEmpty() is true
      validate(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
