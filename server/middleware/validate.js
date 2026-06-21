const { body, validationResult } = require('express-validator');

/**
 * Run after express-validator chains.
 * Returns 422 with a structured error array on the first failure.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: errors.array()[0].msg,   // first error as top-level message
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// ── Registration rules ────────────────────────────────────────────────────────
const registerValidationRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),

  // Indian mobile numbers: optional +91 or 0 prefix, then 10 digits starting with 6-9
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+91|91|0)?[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number (10 digits, starting with 6-9)'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['donor', 'volunteer', 'ngo'])
    .withMessage('Role must be one of: donor, volunteer, ngo'),

  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5 and 500 characters'),

  body('location')
    .notEmpty().withMessage('Location coordinates are required'),

  body('location.lat')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude value'),

  body('location.lng')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude value')
];

// ── Login rules ───────────────────────────────────────────────────────────────
const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

// ── Profile update rules ───────────────────────────────────────────────────────
// Called from PATCH /api/auth/profile
// Only name, phone, address, and location can be updated
const profileUpdateValidationRules = [
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^(\+91|91|0)?[6-9]\d{9}$/)
    .withMessage('Please enter a valid Indian mobile number (10 digits, starting with 6-9)'),

  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5 and 500 characters'),

  body('location.lat')
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude value'),

  body('location.lng')
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude value')
];

// ── Forgot password rules ──────────────────────────────────────────────────────
const forgotPasswordValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail()
];

// ── Reset password rules ───────────────────────────────────────────────────────
const resetPasswordValidationRules = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
];

module.exports = {
  handleValidationErrors,
  registerValidationRules,
  loginValidationRules,
  profileUpdateValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules
};
