const mongoose = require('mongoose');
const Application = require('../models/Application');
const Opportunity = require('../models/Opportunity');

/**
 * @desc    Submit an application to an opportunity
 * @route   POST /api/applications
 * @access  Private (Student only)
 */
const createApplication = async (req, res, next) => {
  try {
    const { opportunity: opportunityId, coverLetter } = req.body;

    if (!opportunityId || !mongoose.Types.ObjectId.isValid(opportunityId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid opportunity ID is required.',
      });
    }

    // 1. Confirm opportunity exists and is currently active
    const opp = await Opportunity.findById(opportunityId);
    if (!opp || !opp.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or is no longer active.',
      });
    }

    // 2. Check application deadline if one is set
    if (opp.applicationDeadline && new Date() > new Date(opp.applicationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline for this opportunity has passed.',
      });
    }

    // 3. Pre-check for duplicate application
    const existingApplication = await Application.findOne({
      student: req.user._id,
      opportunity: opp._id,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'Application already exists for this opportunity.',
      });
    }

    // 4. Create application strictly setting student identity from authenticated session
    const application = await Application.create({
      student: req.user._id,
      opportunity: opp._id,
      coverLetter: coverLetter || '',
      status: 'Applied',
      appliedAt: new Date(),
      statusUpdatedAt: new Date(),
    });

    // Populate safe opportunity preview
    const populated = await Application.findById(application._id).populate({
      path: 'opportunity',
      select: 'title company location workMode type stipend salary',
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data: populated,
    });
  } catch (error) {
    // Handle MongoDB unique compound index race condition gracefully
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Application already exists for this opportunity.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all applications submitted by the logged-in student
 * @route   GET /api/applications/my
 * @access  Private (Student only)
 */
const getMyApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { student: req.user._id };

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .sort('-appliedAt')
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'opportunity',
          select: 'title company location workMode type stipend salary applicationDeadline isActive',
        })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get application details by ID (Student owner, Opportunity recruiter, or Admin)
 * @route   GET /api/applications/:id
 * @access  Private
 */
const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format.',
      });
    }

    const application = await Application.findById(id)
      .populate({
        path: 'student',
        select: 'name email phone location college skills github linkedin resume',
      })
      .populate({
        path: 'opportunity',
        select: 'title company location workMode type stipend salary recruiter isActive',
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    // Role-based ownership authorization:
    // 1. Students may only view their own application
    if (req.user.role === 'student') {
      if (application.student._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this application.',
        });
      }
    }

    // 2. Recruiters may only view applications belonging to an opportunity they own
    if (req.user.role === 'recruiter') {
      if (application.opportunity.recruiter.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this application.',
        });
      }
    }

    // Admins are granted universal inspection access

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all applicants for a specific opportunity (Recruiter owner or Admin)
 * @route   GET /api/applications/opportunity/:opportunityId
 * @access  Private (Recruiter / Admin only)
 */
const getOpportunityApplications = async (req, res, next) => {
  try {
    const { opportunityId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format.',
      });
    }

    // Verify opportunity exists
    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found.',
      });
    }

    // Enforce recruiter ownership (Admins permitted)
    if (opp.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view applicants for this opportunity.',
      });
    }

    const query = { opportunity: opp._id };
    if (status && status.trim()) {
      query.status = status.trim();
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .sort('-appliedAt')
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'student',
          select: 'name email phone location college skills github linkedin resume',
        })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: applications.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update application status (Recruiter owner or Admin only)
 * @route   PUT /api/applications/:id/status
 * @access  Private (Recruiter / Admin only)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application ID format.',
      });
    }

    const application = await Application.findById(id).populate('opportunity');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    // Verify recruiter owns the associated opportunity (Admins permitted)
    if (
      application.opportunity.recruiter.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this application status.',
      });
    }

    // Only update statusUpdatedAt if the status actually changed
    if (application.status !== status) {
      application.status = status;
      application.statusUpdatedAt = new Date();
    }

    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Application status updated successfully.',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationById,
  getOpportunityApplications,
  updateApplicationStatus,
};
