const { verifyToken: verifyJwt } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication Middleware: verifyToken
 * Validates the JWT Bearer token from the Authorization header and attaches the user to req.user.
 */
const verifyToken = async (req, res, next) => {
  try {
    let token;

    // Check for Authorization header with Bearer scheme
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied: No authorization token provided.',
      });
    }

    // Verify token signature and expiration
    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authorization token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token.',
      });
    }

    // Fetch active user from database (excluding password hash)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in auth middleware:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

/**
 * Authorization Middleware: checkRole
 * Restricts access to users having one of the specified roles.
 * @param  {...string} roles - Allowed roles (e.g. 'recruiter', 'admin')
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  checkRole,
};
