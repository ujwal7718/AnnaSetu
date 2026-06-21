const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodType: {
    type: String,
    required: true,
    enum: ['vegetarian', 'non-vegetarian', 'both']
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'liters', 'pieces', 'servings']
  },
  description: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  pickupTime: {
    type: Date,
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
  status: {
    type: String,
    enum: ['pending', 'accepted_by_ngo', 'assigned_to_volunteer', 'picked_up', 'awaiting_ngo_confirmation', 'completed', 'cancelled'],
    default: 'pending'
  },
  // ── NGO claim ─────────────────────────────────────────────────────────────
  // Set when an approved NGO claims this donation.
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  assignedVolunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  pickedUpAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  // ── Pickup OTP Verification ──────────────────────────────────────────────
  pickupOTP: {
    type: String,
    default: null
  },
  pickupOTPVerified: {
    type: Boolean,
    default: false
  },
  pickupVerifiedAt: {
    type: Date,
    default: null
  },
  pickupOTPExpiresAt: {
    type: Date,
    default: null
  },
  // ── NGO delivery confirmation ─────────────────────────────────────────────
  ngoConfirmedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String
  },
  images: [{
    type: String,
    required: false
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

DonationSchema.index({ location: "2dsphere" });
DonationSchema.index({ status: 1 });
DonationSchema.index({ donor: 1 });
DonationSchema.index({ claimedBy: 1 });

module.exports = mongoose.model('Donation', DonationSchema);
