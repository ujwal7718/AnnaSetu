const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ngo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Type of feedback: who is rating whom
  // 'donor-to-ngo' = donor rating the NGO
  // 'donor-to-volunteer' = donor rating the volunteer
  // 'ngo-to-volunteer' = NGO rating the volunteer
  feedbackType: {
    type: String,
    enum: ['donor-to-ngo', 'donor-to-volunteer', 'ngo-to-volunteer'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one feedback per donation per pair
FeedbackSchema.index({ donation: 1, feedbackType: 1, donor: 1 }, { unique: true });
FeedbackSchema.index({ donor: 1 });
FeedbackSchema.index({ ngo: 1 });
FeedbackSchema.index({ volunteer: 1 });
FeedbackSchema.index({ donation: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
