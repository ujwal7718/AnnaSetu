const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT and attaches the full user document to req.user.
 *
 * Security notes:
 *  - Role is always loaded fresh from the DB, never trusted from the token payload.
 *    This prevents role-escalation attacks where an attacker crafts a token with
 *    a different role.
 *  - Sensitive fields (password, tokens, lockout data) are stripped from req.user.
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }

    // Verify signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }
      return res.status(401).json({ message: 'Invalid token. Authorization denied.' });
    }

    // Fetch user from DB — this is the authoritative source of role/status
    const user = await User.findById(decoded.id).select(
      '-password -emailVerificationToken -emailVerificationExpires -loginAttempts -lockUntil'
    );

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists. Authorization denied.' });
    }

    // Prevent locked accounts from using existing tokens
    if (user.isLocked) {
      return res.status(423).json({ message: 'Account is temporarily locked.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};
