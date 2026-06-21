const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['donor', 'volunteer', 'ngo', 'admin'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  isAvailable: {
    type: Boolean,
    default: function () {
      return this.role === 'volunteer';
    }
  },

  // ── NGO approval (only relevant when role === 'ngo') ──────────────────────
  // pending  → registered, email verified, awaiting admin review
  // approved → admin approved, can access NGO dashboard
  // rejected → admin rejected, shown rejection message
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalNote: {               // optional note from admin on rejection
    type: String,
    default: null
  },

  // ── Volunteer approval (only relevant when role === 'volunteer') ──────────
  // pending  → registered, email verified, awaiting NGO approval
  // approved → NGO approved, can access volunteer dashboard
  // rejected → NGO rejected, cannot access volunteer features
  volunteerApprovalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function () {
      return this.role === 'volunteer' ? 'pending' : undefined;
    }
  },
  volunteerApprovalNote: {      // optional note from NGO on rejection
    type: String,
    default: null
  },
  ngoId: {                      // which NGO this volunteer belongs to
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedByNgo: {              // which NGO approved this volunteer
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedByNgoAt: {            // when was this volunteer approved
    type: Date,
    default: null
  },

  // ── Email verification ──────────────────────────────────────────────────────
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },

  // ── Password reset ───────────────────────────────────────────────────────────
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },

  // ── Account lockout (brute-force protection) ────────────────────────────────
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },

  // ── Audit fields ────────────────────────────────────────────────────────────
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLoginIp: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ── Indexes ──────────────────────────────────────────────────────────────────
UserSchema.index({ location: '2dsphere' });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });
UserSchema.index({ ngoId: 1 });
UserSchema.index({ volunteerApprovalStatus: 1 });
UserSchema.index({ role: 1, volunteerApprovalStatus: 1 });

// ── Virtual: is account currently locked? ────────────────────────────────────
UserSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// ── Method: record a failed login attempt ────────────────────────────────────
UserSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  // If a previous lock has already expired, reset the counter
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account once the threshold is reached
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }

  return this.updateOne(updates);
};

// ── Method: reset after a successful login ───────────────────────────────────
UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', UserSchema);
