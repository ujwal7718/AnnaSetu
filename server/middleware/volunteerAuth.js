const auth = require('./auth');

/**
 * Volunteer authentication middleware.
 *
 * Chains the base JWT auth middleware, then enforces:
 *   1. role === 'volunteer'
 *   2. volunteerApprovalStatus === 'approved'
 *
 * Returns:
 *   401  if JWT is invalid / missing (handled by auth.js)
 *   403  if authenticated but not a volunteer
 *   403  if volunteer but not yet approved (includes status so frontend can react)
 */
module.exports = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Volunteer access required.' });
    }

    if (req.user.volunteerApprovalStatus === 'pending') {
      return res.status(403).json({
        message: 'Your volunteer request is awaiting approval from your NGO.',
        volunteerApprovalStatus: 'pending',
        ngoId: req.user.ngoId
      });
    }

    if (req.user.volunteerApprovalStatus === 'rejected') {
      return res.status(403).json({
        message: 'Your volunteer request has been rejected.',
        volunteerApprovalStatus: 'rejected',
        volunteerApprovalNote: req.user.volunteerApprovalNote || null
      });
    }

    // volunteerApprovalStatus === 'approved'
    next();
  });
};
