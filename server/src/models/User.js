const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Omit password hash from query results by default
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'recruiter', 'admin'],
        message: '{VALUE} is not a valid role. Allowed roles: student, recruiter, admin',
      },
      default: 'student',
      index: true,
    },

    // Profile fields supporting the SkillBridge blueprint
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    degree: {
      type: String,
      trim: true,
      default: '',
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    education: [
      {
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        startYear: { type: Number },
        endYear: { type: Number },
        grade: { type: String, trim: true },
      },
    ],
    experience: [
      {
        title: { type: String, trim: true },
        company: { type: String, trim: true },
        startYear: { type: Number },
        endYear: { type: Number },
        description: { type: String, trim: true },
      },
    ],
    github: {
      type: String,
      trim: true,
      default: '',
    },
    linkedin: {
      type: String,
      trim: true,
      default: '',
    },
    resume: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
      uploadedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mongoose Pre-save Hook:
 * Automatically hashes the user password using bcryptjs whenever it is created or modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Instance Method: comparePassword
 * Compares an incoming plain-text candidate password against the hashed password.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
