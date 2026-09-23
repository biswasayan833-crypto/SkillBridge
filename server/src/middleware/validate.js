const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results.
 * If errors exist, returns a formatted 400 Bad Request response.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.path === 'password' || err.path === 'currentPassword' || err.path === 'newPassword' ? undefined : err.value,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0]?.message || 'Validation failed. Please verify your inputs.',
      errors: formattedErrors,
    });
  }

  next();
};

module.exports = validate;
