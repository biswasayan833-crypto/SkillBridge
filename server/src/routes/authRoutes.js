const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout,
  updatePassword,
} = require('../controllers/authController');

const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');
const {
  registerValidation,
  loginValidation,
  updatePasswordValidation,
} = require('../utils/validationSchemas');

// Public Auth Endpoints (Rate-limited & Validated)
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/logout', logout);

// Protected Auth Endpoints
router.get('/me', verifyToken, getMe);
router.put('/update-password', verifyToken, authLimiter, updatePasswordValidation, validate, updatePassword);

// Role-guarded endpoint to verify checkRole middleware
router.get('/recruiter-only', verifyToken, checkRole('recruiter', 'admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to recruiter/admin resource.',
    role: req.user.role,
  });
});

module.exports = router;
