const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { registerRateLimiter, loginRateLimiter } = require('../middleware/rateLimiter');
const {
  registerValidationRules,
  loginValidationRules,
  handleValidationErrors,
  profileUpdateValidationRules,
  forgotPasswordValidationRules,
  resetPasswordValidationRules
} = require('../middleware/validate');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/approved-ngos
// Public - Returns list of approved NGOs for volunteer registration
// ─────────────────────────────────────────────────────────────────────────────
router.get('/approved-ngos', async (req, res) => {
  try {
    const ngos = await User.find({ 
      role: 'ngo', 
      approvalStatus: 'approved',
      isEmailVerified: true 
    })
      .select('_id name email phone location description mealsServed volunteers established website')
      .sort({ name: 1 });

    res.json(ngos);
  } catch (error) {
    console.error('Failed to fetch approved NGOs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Public  |  Roles allowed: donor, volunteer, ngo  (admin blocked)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/register',
  registerRateLimiter,
  registerValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password, phone, role, location, address, ngoId } = req.body;

      // Double-guard: admin must never be created via this endpoint
      if (role === 'admin') {
        return res.status(403).json({ message: 'Admin registration is not permitted.' });
      }

      // Volunteers must select an NGO
      if (role === 'volunteer' && !ngoId) {
        return res.status(400).json({ message: 'Volunteers must select an NGO.' });
      }

      // Validate ngoId is a real NGO if provided
      if (role === 'volunteer' && ngoId) {
        const ngo = await User.findById(ngoId);
        if (!ngo || ngo.role !== 'ngo') {
          return res.status(400).json({ message: 'Invalid NGO selection.' });
        }
      }

      // ── Duplicate email check ──────────────────────────────────────────────
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      // ── Duplicate phone check ──────────────────────────────────────────────
      // Normalise: strip leading +91 / 91 / 0 then compare last 10 digits
      const normalisePhone = (p) => p.replace(/^\+91|^91|^0/, '').trim();
      const normalisedPhone = normalisePhone(phone);
      const allUsers = await User.find({}, 'phone');
      const phoneTaken = allUsers.some(
        (u) => normalisePhone(u.phone) === normalisedPhone
      );
      if (phoneTaken) {
        return res.status(400).json({ message: 'An account with this phone number already exists.' });
      }

      // ── Hash password ──────────────────────────────────────────────────────
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // ── Generate email-verification token ─────────────────────────────────
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // ── Create user ────────────────────────────────────────────────────────
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone.trim(),
        role,
        location: {
          type: 'Point',
          coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
          address: address.trim()
        },
        isEmailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: tokenExpiry,
        // For volunteers: store NGO association and set pending approval status
        ...(role === 'volunteer' && { ngoId, volunteerApprovalStatus: 'pending' })
      });

      await user.save();

      // ── Send verification email (non-blocking) ─────────────────────────────
      try {
        await sendVerificationEmail(user.email, user.name, rawToken);
      } catch (emailError) {
        console.error('⚠️  Failed to send verification email:', emailError.message);
        // Do NOT block registration if email fails — just log it
      }

      // ── Respond — no JWT yet; user must verify email first ────────────────
      res.status(201).json({
        message:
          'Registration successful! Please check your email to verify your account before logging in.',
        requiresVerification: true
      });
    } catch (error) {
      console.error('Registration error:', error);

      // Handle MongoDB duplicate key errors that slip through the manual checks
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        const msg =
          field === 'email'
            ? 'An account with this email already exists.'
            : field === 'phone'
            ? 'An account with this phone number already exists.'
            : 'An account with these details already exists.';
        return res.status(400).json({ message: msg });
      }

      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=<rawToken>
// Public
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    // Hash the incoming raw token and look it up
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification link. Please register again or request a new link.'
      });
    }

    // Mark as verified and clear the token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Public
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/login',
  loginRateLimiter,
  loginValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // ── Find user ──────────────────────────────────────────────────────────
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Generic message to prevent user enumeration
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      // ── Account lockout check ──────────────────────────────────────────────
      if (user.isLocked) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(423).json({
          message: `Account is temporarily locked. Please try again in ${minutesLeft} minute(s).`
        });
      }

      // ── Password check ─────────────────────────────────────────────────────
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await user.incrementLoginAttempts();
        const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
        return res.status(401).json({
          message:
            attemptsLeft > 0
              ? `Invalid credentials. ${attemptsLeft} attempt(s) remaining before account is locked.`
              : 'Account locked due to too many failed attempts. Please try again in 15 minutes.'
        });
      }

      // ── Email verification gate ────────────────────────────────────────────
      // Admins bypass email verification entirely because:
      //   1. Admin accounts are seeded directly into the database and never go
      //      through the public registration flow that sends verification emails.
      //   2. Admin emails (e.g. admin@test.com) are internal addresses that may
      //      not exist as real mailboxes.
      //   3. Blocking the admin would lock out the entire platform if the email
      //      service is misconfigured.
      // All non-admin roles (donor, volunteer, ngo) MUST verify before logging in.
      if (user.role !== 'admin' && !user.isEmailVerified) {
        return res.status(403).json({
          message:
            'Your email address has not been verified. Please check your inbox and click the verification link.',
          requiresVerification: true
        });
      }

      // ── Successful login — reset lockout counter ───────────────────────────
      await user.resetLoginAttempts();

      // Record audit info
      const clientIp =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'unknown';
      await User.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        lastLoginIp: clientIp
      });

      // ── Issue JWT ──────────────────────────────────────────────────────────
      const token = jwt.sign(
        { id: user._id, role: user.role },  // include role to detect tampering
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          location: user.location,
          address: user.location.address,
          isAvailable: user.isAvailable,
          isEmailVerified: user.isEmailVerified,
          // Included so NGO frontend can show pending/rejected screen without
          // making an extra /me call. Only meaningful when role === 'ngo'.
          approvalStatus: user.approvalStatus,
          // Included for volunteer approval flow
          volunteerApprovalStatus: user.volunteerApprovalStatus,
          volunteerApprovalNote: user.volunteerApprovalNote,
          approvedByNgo: user.approvedByNgo,
          approvedByNgoAt: user.approvedByNgoAt,
          ngoId: user.ngoId,
          ngoName: user.ngoName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Private
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      '-password -emailVerificationToken -emailVerificationExpires -loginAttempts -lockUntil'
    );    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-verification
// Public  |  Allows resending the verification email if it expired
// ─────────────────────────────────────────────────────────────────────────────
router.post('/resend-verification', loginRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return the same message to prevent user enumeration
    const genericMsg =
      'If an unverified account with that email exists, a new verification link has been sent.';

    if (!user || user.isEmailVerified) {
      return res.json({ message: genericMsg });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, rawToken);
    } catch (emailError) {
      console.error('⚠️  Failed to resend verification email:', emailError.message);
    }

    res.json({ message: genericMsg });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/profile
// Private  |  Update user profile (name, phone, address, location)
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/profile',
  auth,
  profileUpdateValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, phone, address, location } = req.body;
      const userId = req.user.id;

      // ── Check phone uniqueness (if phone is being updated) ──────────────────
      if (phone) {
        const normalisePhone = (p) => p.replace(/^\+91|^91|^0/, '').trim();
        const normalisedPhone = normalisePhone(phone);
        const otherUserWithPhone = await User.findOne({
          phone: { $regex: normalisedPhone + '$' },
          _id: { $ne: userId }
        });

        if (otherUserWithPhone) {
          return res.status(400).json({ message: 'Phone number is already in use.' });
        }
      }

      // ── Update allowed fields only ──────────────────────────────────────────
      const updates = {};
      if (name !== undefined && name.trim() !== '') {
        updates.name = name.trim();
      }
      if (phone !== undefined && phone.trim() !== '') {
        updates.phone = phone.trim();
      }
      if (address !== undefined && address.trim() !== '') {
        updates['location.address'] = address.trim();
      }
      if (location && location.lat !== undefined && location.lng !== undefined) {
        updates['location.coordinates'] = [parseFloat(location.lng), parseFloat(location.lat)];
      }

      // ── If no updates provided ──────────────────────────────────────────────
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No fields to update.' });
      }

      // ── Update user ────────────────────────────────────────────────────────
      const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true
      }).select('-password -emailVerificationToken -emailVerificationExpires -loginAttempts -lockUntil');

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      res.json({
        message: 'Profile updated successfully.',
        user
      });
    } catch (error) {
      console.error('Profile update error:', error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        const msg = field === 'phone'
          ? 'An account with this phone number already exists.'
          : 'An account with these details already exists.';
        return res.status(400).json({ message: msg });
      }

      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Public  |  Initiates password reset flow
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/forgot-password',
  loginRateLimiter,
  forgotPasswordValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      // Always return the same message to prevent user enumeration
      const genericMsg =
        'If an account with that email exists, a password reset link has been sent.';

      if (!user) {
        return res.json({ message: genericMsg });
      }

      // ── Generate password reset token ──────────────────────────────────────
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // ── Save token and expiry to user ──────────────────────────────────────
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = tokenExpiry;
      await user.save();

      // ── Send reset email (non-blocking) ────────────────────────────────────
      try {
        await sendPasswordResetEmail(user.email, user.name, rawToken);
      } catch (emailError) {
        console.error('⚠️  Failed to send password reset email:', emailError.message);
        // Clear the token if email fails
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();
      }

      res.json({ message: genericMsg });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// Public  |  Completes password reset with new password
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/reset-password',
  resetPasswordValidationRules,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // ── Hash the incoming raw token and look it up ─────────────────────────
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          message: 'Invalid or expired reset link. Please request a new password reset.'
        });
      }

      // ── Hash the new password using bcrypt (same logic as registration) ────
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // ── Update password and clear reset token ──────────────────────────────
      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      // Reset login attempts on successful password reset
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save();

      res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
);

module.exports = router;
