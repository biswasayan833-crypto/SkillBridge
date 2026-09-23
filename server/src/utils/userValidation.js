const { body } = require('express-validator');

/**
 * Validation rules for updating user profile.
 * Strictly prevents modification of protected fields: password, role, resume, _id, createdAt, updatedAt.
 */
const updateProfileValidation = [
  // Reject forbidden/tampered fields
  body().custom((value) => {
    const forbiddenFields = [
      'password',
      'role',
      'resume',
      '_id',
      'createdAt',
      'updatedAt',
      'email',
    ];
    for (const field of forbiddenFields) {
      if (value[field] !== undefined) {
        throw new Error(
          `Field '${field}' cannot be updated through the profile endpoint.`
        );
      }
    }
    return true;
  }),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty.')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters long.'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number cannot exceed 20 characters.'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters.'),

  body('college')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('College cannot exceed 100 characters.'),

  body('degree')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Degree cannot exceed 100 characters.'),

  body('graduationYear')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1970, max: 2040 })
    .withMessage('Graduation year must be a valid integer between 1970 and 2040.')
    .toInt(),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters.'),

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
    })
    .custom((arr) => {
      if (Array.isArray(arr) && arr.length > 50) {
        throw new Error('Skills list cannot exceed 50 items.');
      }
      return true;
    }),

  body('github')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('GitHub link must be a valid URL.'),

  body('linkedin')
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage('LinkedIn link must be a valid URL.'),
];

module.exports = {
  updateProfileValidation,
};
