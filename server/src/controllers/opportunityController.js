const mongoose = require('mongoose');
const Opportunity = require('../models/Opportunity');

/**
 * Safely escape regular expression special characters to guard against ReDoS and syntax crashes.
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @desc    Create a new opportunity
 * @route   POST /api/opportunities
 * @access  Private (Recruiter / Admin only)
 */
const createOpportunity = async (req, res, next) => {
  try {
    const {
      title,
      company,
      description,
      type,
      workMode,
      location,
      skills,
      stipend,
      salary,
      eligibility,
      applicationDeadline,
    } = req.body;

    // Never trust recruiter ID sent from client; strictly enforce req.user._id
    const opportunity = await Opportunity.create({
      title,
      company,
      description,
      type,
      workMode,
      location,
      skills: Array.isArray(skills) ? skills : [],
      stipend: stipend || '',
      salary: salary || '',
      eligibility: eligibility || '',
      applicationDeadline: applicationDeadline || null,
      recruiter: req.user._id,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Opportunity created successfully.',
      data: opportunity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all active opportunities with search, filtering, sorting, and pagination
 * @route   GET /api/opportunities
 * @access  Public
 */
const getOpportunities = async (req, res, next) => {
  try {
    const {
      search,
      type,
      workMode,
      location,
      skills,
      page = 1,
      limit = 10,
      sort = '-createdAt',
    } = req.query;

    // Base query: Only return active opportunities for public discovery
    const query = { isActive: true };

    // 1. Search filter: Match against title, company, description, location, or skills (ReDoS protected)
    if (typeof search === 'string' && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { skills: { $in: [searchRegex] } },
      ];
    }

    // 2. Type filter
    if (typeof type === 'string' && type.trim()) {
      query.type = type.trim().toLowerCase();
    }

    // 3. Work mode filter
    if (typeof workMode === 'string' && workMode.trim()) {
      query.workMode = workMode.trim().toLowerCase();
    }

    // 4. Location filter
    if (typeof location === 'string' && location.trim()) {
      const sanitizedLocation = escapeRegex(location.trim());
      query.location = new RegExp(sanitizedLocation, 'i');
    }

    // 5. Skills filter: comma-separated or single skill
    if (typeof skills === 'string' && skills.trim()) {
      const skillList = skills
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (skillList.length > 0) {
        query.skills = {
          $in: skillList.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')),
        };
      }
    }

    // Safe pagination parameters
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Safe sorting whitelist
    const allowedSortFields = {
      '-createdAt': '-createdAt',
      createdAt: 'createdAt',
      newest: '-createdAt',
      oldest: 'createdAt',
      applicationDeadline: 'applicationDeadline',
      '-applicationDeadline': '-applicationDeadline',
      title: 'title',
      '-title': '-title',
    };
    const sortField = allowedSortFields[sort] || '-createdAt';

    // Execute queries in parallel
    const [total, opportunities] = await Promise.all([
      Opportunity.countDocuments(query),
      Opportunity.find(query)
        .sort(sortField)
        .skip(skip)
        .limit(limitNum)
        .populate('recruiter', 'name email company')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: opportunities.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: opportunities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single opportunity by ID
 * @route   GET /api/opportunities/:id
 * @access  Public
 */
const getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format.',
      });
    }

    const opportunity = await Opportunity.findById(id).populate('recruiter', 'name email company');

    // Do not expose inactive opportunities to the public endpoint
    if (!opportunity || !opportunity.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found or is no longer active.',
      });
    }

    return res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get opportunities created by the authenticated recruiter (or all if admin explicitly requests all)
 * @route   GET /api/opportunities/my
 * @access  Private (Recruiter / Admin only)
 */
const getMyOpportunities = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Admin rule: If admin passes ?all=true, return all opportunities; otherwise default to own
    const query = {};
    if (req.user.role === 'admin' && req.query.all === 'true') {
      // Admin viewing all opportunities
    } else {
      query.recruiter = req.user._id;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, opportunities] = await Promise.all([
      Opportunity.countDocuments(query),
      Opportunity.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .populate('recruiter', 'name email company')
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      count: opportunities.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: opportunities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an opportunity
 * @route   PUT /api/opportunities/:id
 * @access  Private (Recruiter owner / Admin only)
 */
const updateOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format.',
      });
    }

    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found.',
      });
    }

    // Ownership verification: Recruiter must own the opportunity (Admin override permitted)
    if (opportunity.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this opportunity.',
      });
    }

    // Explicitly whitelist updateable fields (never allow changing _id, recruiter, or createdAt)
    const allowedFields = [
      'title',
      'company',
      'description',
      'type',
      'workMode',
      'location',
      'skills',
      'stipend',
      'salary',
      'eligibility',
      'applicationDeadline',
      'isActive',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        opportunity[field] = req.body[field];
      }
    });

    const updatedOpportunity = await opportunity.save();

    return res.status(200).json({
      success: true,
      message: 'Opportunity updated successfully.',
      data: updatedOpportunity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate / Soft-delete an opportunity
 * @route   DELETE /api/opportunities/:id
 * @access  Private (Recruiter owner / Admin only)
 */
const deleteOpportunity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid opportunity ID format.',
      });
    }

    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Opportunity not found.',
      });
    }

    // Ownership verification
    if (opportunity.recruiter.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this opportunity.',
      });
    }

    // Soft delete: Deactivate the listing so historical references (applications) are preserved
    opportunity.isActive = false;
    await opportunity.save();

    return res.status(200).json({
      success: true,
      message: 'Opportunity deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOpportunity,
  getOpportunities,
  getOpportunityById,
  getMyOpportunities,
  updateOpportunity,
  deleteOpportunity,
};
