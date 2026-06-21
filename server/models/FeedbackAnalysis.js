const mongoose = require('mongoose');

const FeedbackAnalysisSchema = new mongoose.Schema({
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: null
  },
  summary: {
    type: String,
    maxlength: 1000
  },
  strengths: {
    type: [String],
    default: []
  },
  improvements: {
    type: [String],
    default: []
  },
  feedbackCount: {
    type: Number,
    default: 0
  },
  lastAnalyzedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookups
FeedbackAnalysisSchema.index({ ngoId: 1 });

module.exports = mongoose.model('FeedbackAnalysis', FeedbackAnalysisSchema);
