const { body } = require('express-validator');

const ALLOWED_TYPES = ['internship', 'full-time', 'part-time', 'contract'];
const ALLOWED_WORK_MODES = ['remote', 'hybrid', 'onsite'];

/**
 * Validation rules for creating a new opportunity.
 */
const createOpportunityValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Opportunity title is required.')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters long.'),

  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters long.'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Job description is required.'),

  body('type')
    .trim()
    .toLowerCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Invalid opportunity type. Allowed types: ${ALLOWED_TYPES.join(', ')}`),

  body('workMode')
    .trim()
    .toLowerCase()
    .isIn(ALLOWED_WORK_MODES)
    .withMessage(`Invalid work mode. Allowed modes: ${ALLOWED_WORK_MODES.join(', ')}`),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required.'),

  body('skills')
    .optional()
    .customSanitizer((val) => {
      if (typeof val === 'string') {
        return val
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
      }
      if (Array.isArray(val)) {
        return val.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
      }
      return [];
    }),

  body('stipend').optional().trim(),
  body('salary').optional().trim(),
  body('eligibility').optional().trim(),

  body('applicationDeadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Application deadline must be a valid ISO8601 date (YYYY-MM-DD).')
    .toDate(),
];

/**
 * Validation rules for updating an existing opportunity.
 * All fields are optional, but if supplied, must strictly obey schema constraints.
 */
const updateOpportunityValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty.')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters long.'),

  body('company')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters long.'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty.'),

  body('type')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Invalid opportunity type. Allowed types: ${ALLOWED_TYPES.join(', ')}`),

  body('workMode')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(ALLOWED_WORK_MODES)
    .withMessage(`Invalid work mode. Allowed modes: ${ALLOWED_WORK_MODES.join(', ')}`),

  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty.'),

  body('skills')
    .optional()
    .customSanitizer((val) => {
      if (typeof val === 'string') {
        return val
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
      }
      if (Array.isArray(val)) {
        return val.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
      }
      return [];
    }),

  body('stipend').optional().trim(),
  body('salary').optional().trim(),
  body('eligibility').optional().trim(),

  body('applicationDeadline')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Application deadline must be a valid ISO8601 date (YYYY-MM-DD).')
    .toDate(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value (true or false).'),
];

module.exports = {
  createOpportunityValidation,
  updateOpportunityValidation,
};
