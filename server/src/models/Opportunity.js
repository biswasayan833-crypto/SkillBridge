const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Opportunity title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters long'],
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Opportunity type is required'],
      lowercase: true,
      trim: true,
      enum: {
        values: ['internship', 'full-time', 'part-time', 'contract'],
        message: '{VALUE} is not a valid opportunity type. Allowed types: internship, full-time, part-time, contract',
      },
    },
    workMode: {
      type: String,
      required: [true, 'Work mode is required'],
      lowercase: true,
      trim: true,
      enum: {
        values: ['remote', 'hybrid', 'onsite'],
        message: '{VALUE} is not a valid work mode. Allowed modes: remote, hybrid, onsite',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    stipend: {
      type: String,
      trim: true,
      default: '',
    },
    salary: {
      type: String,
      trim: true,
      default: '',
    },
    eligibility: {
      type: String,
      trim: true,
      default: '',
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter reference is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Targeted indexes for high-frequency queries and filtering
opportunitySchema.index({ recruiter: 1 });
opportunitySchema.index({ isActive: 1, createdAt: -1 });
opportunitySchema.index({ isActive: 1, type: 1 });
opportunitySchema.index({ isActive: 1, workMode: 1 });
opportunitySchema.index({ location: 1 });
opportunitySchema.index({ applicationDeadline: 1 });

// Full-text search index for general keyword lookups
opportunitySchema.index(
  {
    title: 'text',
    company: 'text',
    description: 'text',
    skills: 'text',
    location: 'text',
  },
  {
    weights: {
      title: 10,
      skills: 8,
      company: 5,
      location: 3,
      description: 1,
    },
    name: 'OpportunityTextIndex',
  }
);

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

module.exports = Opportunity;
