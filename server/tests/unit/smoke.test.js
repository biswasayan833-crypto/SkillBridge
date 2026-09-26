const { generateToken, verifyToken } = require('../../src/utils/jwt');

describe('Backend Unit Test Foundation Smoke Test', () => {
  it('should verify test environment is set to test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should generate and verify JWT token in unit test', () => {
    const token = generateToken('6ab3b2f0e4ec6ae031160789', 'student');
    expect(token).toBeDefined();
    const decoded = verifyToken(token);
    expect(decoded.id).toBe('6ab3b2f0e4ec6ae031160789');
    expect(decoded.role).toBe('student');
  });
});
