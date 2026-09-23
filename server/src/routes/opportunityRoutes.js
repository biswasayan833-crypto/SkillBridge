const express = require('express');
const router = express.Router();

const {
  createOpportunity,
  getOpportunities,
  getOpportunityById,
  getMyOpportunities,
  updateOpportunity,
  deleteOpportunity,
} = require('../controllers/opportunityController');

const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createOpportunityValidation,
  updateOpportunityValidation,
} = require('../utils/opportunityValidation');

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================

// Discover & search opportunities
router.get('/', getOpportunities);

// Recruiter/Admin own postings (MUST precede /:id)
router.get('/my', verifyToken, checkRole('recruiter', 'admin'), getMyOpportunities);

// Single opportunity detail
router.get('/:id', getOpportunityById);

// ==========================================
// 2. PROTECTED RECRUITER / ADMIN ROUTES
// ==========================================

// Create new opportunity
router.post(
  '/',
  verifyToken,
  checkRole('recruiter', 'admin'),
  createOpportunityValidation,
  validate,
  createOpportunity
);

// Update existing opportunity (ownership enforced in controller)
router.put(
  '/:id',
  verifyToken,
  checkRole('recruiter', 'admin'),
  updateOpportunityValidation,
  validate,
  updateOpportunity
);

// Deactivate / Soft-delete opportunity (ownership enforced in controller)
router.delete(
  '/:id',
  verifyToken,
  checkRole('recruiter', 'admin'),
  deleteOpportunity
);

module.exports = router;
