const express = require('express');
const router = express.Router();

const {
  createApplication,
  getMyApplications,
  getApplicationById,
  getOpportunityApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');

const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createApplicationValidation,
  updateStatusValidation,
} = require('../utils/applicationValidation');

// ==========================================
// 1. STUDENT ROUTES
// ==========================================

// Submit new application (student only)
router.post(
  '/',
  verifyToken,
  checkRole('student'),
  createApplicationValidation,
  validate,
  createApplication
);

// View student's own applications (MUST precede /:id)
router.get(
  '/my',
  verifyToken,
  checkRole('student'),
  getMyApplications
);

// ==========================================
// 2. RECRUITER / ADMIN ROUTES
// ==========================================

// View applicants for an opportunity (MUST precede /:id)
router.get(
  '/opportunity/:opportunityId',
  verifyToken,
  checkRole('recruiter', 'admin'),
  getOpportunityApplications
);

// Update applicant status (recruiter owner or admin)
router.put(
  '/:id/status',
  verifyToken,
  checkRole('recruiter', 'admin'),
  updateStatusValidation,
  validate,
  updateApplicationStatus
);

// ==========================================
// 3. SHARED PROTECTED ROUTES (Student owner or Opportunity Recruiter)
// ==========================================

// View application details by ID
router.get(
  '/:id',
  verifyToken,
  getApplicationById
);

module.exports = router;
