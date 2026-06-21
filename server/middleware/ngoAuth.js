const auth = require('./auth');

/**
 * NGO authentication middleware.
 *
 * Chains the base JWT auth middleware, then enforces:
 *   1. role === 'ngo'
 *   2. approvalStatus === 'approved'
 *
 * Returns:
 *   401  if JWT is invalid / missing (handled by auth.js)
 *   403  if authenticated but not an NGO
 *   403  if NGO but not yet approved (includes status so frontend can react)
 */
module.exports = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'NGO access required.' });
    }

    if (req.user.approvalStatus === 'pending') {
      return res.status(403).json({
        message: 'Your NGO account is awaiting admin approval.',
        approvalStatus: 'pending'
      });
    }

    if (req.user.approvalStatus === 'rejected') {
      return res.status(403).json({
        message: 'Your NGO account application has been rejected.',
        approvalStatus: 'rejected',
        approvalNote: req.user.approvalNote || null
      });
    }

    // approvalStatus === 'approved'
    next();
  });
};
