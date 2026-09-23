const jwt = require('jsonwebtoken');

/**
 * Generate a signed JSON Web Token for an authenticated user.
 * @param {string|mongoose.Types.ObjectId} userId - User's MongoDB ObjectId
 * @param {string} [role] - Optional user role
 * @returns {string} Signed JWT string
 */
const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }

  const payload = { id: userId.toString() };
  if (role) {
    payload.role = role;
  }

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JSON Web Token.
 * @param {string} token - The raw JWT string
 * @returns {object} Decoded JWT payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }

  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
