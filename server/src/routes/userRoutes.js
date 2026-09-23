const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { updateProfileValidation } = require('../utils/userValidation');
const validate = require('../middleware/validate');
const { handleResumeUpload } = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiters');
const {
  getProfile,
  updateProfile,
  uploadResume,
  getResume,
  deleteResume,
} = require('../controllers/userController');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (All authenticated roles)
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private (All authenticated roles)
 */
router.put('/profile', verifyToken, updateProfileValidation, validate, updateProfile);

/**
 * @route   POST /api/users/resume
 * @desc    Upload or replace student resume (PDF or DOCX, max 5MB)
 * @access  Private (Student only)
 */
router.post('/resume', verifyToken, checkRole('student'), uploadLimiter, handleResumeUpload, uploadResume);

/**
 * @route   GET /api/users/resume
 * @desc    Download / view authenticated student's uploaded resume
 * @access  Private (Authenticated users)
 */
router.get('/resume', verifyToken, getResume);

/**
 * @route   DELETE /api/users/resume
 * @desc    Delete student's uploaded resume
 * @access  Private (Student only)
 */
router.delete('/resume', verifyToken, checkRole('student'), deleteResume);

module.exports = router;
