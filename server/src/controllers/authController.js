const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * @desc    Register a new student or recruiter
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Create user (password automatically hashed by User pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Return safe user payload (excluding password)
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user and explicitly include password hash for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare candidate password against stored bcrypt hash
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Construct safe user object without password
    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      college: user.college,
      bio: user.bio,
      skills: user.skills,
      education: user.education,
      experience: user.experience,
      github: user.github,
      linkedin: user.linkedin,
      resume: user.resume,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires valid JWT)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by verifyToken middleware (already stripped of password)
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (Stateless JWT token invalidation guidance)
 * @route   POST /api/auth/logout
 * @access  Public / Private
 */
const logout = async (req, res) => {
  // In a stateless JWT architecture, the client removes the token from storage.
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear your token on the client.',
  });
};

/**
 * @desc    Update password for the logged-in user
 * @route   PUT /api/auth/update-password
 * @access  Private (Requires valid JWT)
 */
const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Retrieve user including password hash
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    // Verify current password
    const isCurrentMatch = await user.comparePassword(currentPassword);
    if (!isCurrentMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    // Assign new password; save triggers pre-save bcrypt hashing hook
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updatePassword,
};
