const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    opportunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: [true, 'Opportunity reference is required'],
      index: true,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'],
        message: '{VALUE} is not a valid status. Allowed values: Applied, Under Review, Shortlisted, Interview, Selected, Rejected',
      },
      default: 'Applied',
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * UNIQUE Compound Index: student + opportunity
 * Guarantees at the database engine level that no student can apply to the same opportunity more than once.
 */
applicationSchema.index({ student: 1, opportunity: 1 }, { unique: true });

// Secondary indexes for optimized querying
applicationSchema.index({ opportunity: 1, status: 1 });
applicationSchema.index({ student: 1, createdAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
