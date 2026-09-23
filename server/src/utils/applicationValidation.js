const { body } = require('express-validator');

const ALLOWED_STATUSES = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Selected',
  'Rejected',
];

/**
 * Validation rules for submitting a new application.
 */
const createApplicationValidation = [
  body('opportunity')
    .notEmpty()
    .withMessage('Opportunity ID is required.')
    .isMongoId()
    .withMessage('A valid MongoDB opportunity ID is required.'),

  body('coverLetter')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Cover letter cannot exceed 2000 characters.'),
];

/**
 * Validation rules for updating application status.
 */
const updateStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Application status is required.')
    .isIn(ALLOWED_STATUSES)
    .withMessage(
      `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
    ),
];

module.exports = {
  createApplicationValidation,
  updateStatusValidation,
  ALLOWED_STATUSES,
};
