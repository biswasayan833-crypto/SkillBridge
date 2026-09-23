const { body } = require('express-validator');

/**
 * Validation rules for user registration.
 * Restricts roles strictly to 'student' and 'recruiter' (preventing admin self-registration).
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role selection is required.')
    .isIn(['student', 'recruiter'])
    .withMessage("Invalid role. You may only register as 'student' or 'recruiter'."),
];

/**
 * Validation rules for user login.
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

/**
 * Validation rules for updating account password.
 */
const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long.')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password.');
      }
      return true;
    }),
];

module.exports = {
  registerValidation,
  loginValidation,
  updatePasswordValidation,
};
