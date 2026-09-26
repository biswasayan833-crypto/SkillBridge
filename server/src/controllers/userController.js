const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { UPLOAD_DIR } = require('../middleware/uploadMiddleware');

/**
 * Format user profile object for client responses, ensuring sensitive fields are omitted.
 */
const formatSafeProfile = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  location: user.location || '',
  college: user.college || '',
  degree: user.degree || '',
  graduationYear: user.graduationYear || null,
  bio: user.bio || '',
  skills: user.skills || [],
  github: user.github || '',
  linkedin: user.linkedin || '',
  resume: user.resume || { url: '', filename: '', uploadedAt: null },
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * @desc    Get profile of the currently authenticated user
 * @route   GET /api/users/profile
 * @access  Private (All authenticated roles)
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: formatSafeProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update profile fields for the authenticated user
 * @route   PUT /api/users/profile
 * @access  Private (All authenticated roles)
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Whitelist allowed profile fields
    const allowedFields = [
      'name',
      'phone',
      'location',
      'college',
      'degree',
      'graduationYear',
      'bio',
      'skills',
      'github',
      'linkedin',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: formatSafeProfile(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload or replace resume for authenticated student
 * @route   POST /api/users/resume
 * @access  Private (Student only)
 */
const uploadResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      // Remove freshly uploaded file if user unexpectedly not found
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const previousFilename = user.resume?.filename;
    const relativeUrl = `/uploads/resumes/${req.file.filename}`;

    // Update metadata on User document
    user.resume = {
      url: relativeUrl,
      filename: req.file.filename,
      uploadedAt: new Date(),
    };

    // Save to database first
    await user.save();

    // After DB persistence succeeds, safely clean up previous physical file if replacing
    if (previousFilename) {
      const oldSafeFilename = path.basename(previousFilename);
      const oldFilePath = path.join(UPLOAD_DIR, oldSafeFilename);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (cleanupErr) {
          console.warn('Non-fatal: Failed to delete previous resume file:', cleanupErr.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully.',
      resume: user.resume,
    });
  } catch (error) {
    // If DB update failed, clean up the newly uploaded file to avoid orphan file
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_err) {
        // ignore
      }
    }
    next(error);
  }
};

/**
 * @desc    View/Download own resume
 * @route   GET /api/users/resume
 * @access  Private (Authenticated user)
 */
const getResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resume || !user.resume.filename) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this account.',
      });
    }

    // Path traversal prevention: Extract only the basename
    const safeFilename = path.basename(user.resume.filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found on server.',
      });
    }

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete own resume (clears DB metadata and deletes file from disk)
 * @route   DELETE /api/users/resume
 * @access  Private (Student only)
 */
const deleteResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.resume || !user.resume.filename) {
      return res.status(404).json({
        success: false,
        message: 'No resume found to delete.',
      });
    }

    const safeFilename = path.basename(user.resume.filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    // Remove physical file from disk if it exists
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn('Non-fatal: Failed to delete physical resume file:', unlinkErr.message);
      }
    }

    // Clear metadata in database
    user.resume = {
      url: '',
      filename: '',
      uploadedAt: null,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  getResume,
  deleteResume,
};
