const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');

// POST /api/feedback - Submit feedback for a completed donation
router.post('/', auth, async (req, res) => {
  try {
    const { donationId, rating, comment, feedbackType } = req.body;

    // Validate input
    if (!donationId || !rating || !feedbackType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Validate feedbackType
    if (!['donor-to-ngo', 'donor-to-volunteer', 'ngo-to-volunteer'].includes(feedbackType)) {
      return res.status(400).json({ message: 'Invalid feedback type' });
    }

    // Verify donation exists and is completed
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({ message: 'Feedback can only be submitted for completed donations' });
    }

    // Prepare feedback object based on type and user role
    let feedbackData = {
      donation: donationId,
      donor: req.user._id,
      feedbackType,
      rating,
      comment: comment || null
    };

    // Validate permissions and set recipients
    if (feedbackType === 'donor-to-ngo') {
      if (req.user.role !== 'donor') {
        return res.status(403).json({ message: 'Only donors can provide donor-to-ngo feedback' });
      }
      feedbackData.ngo = donation.claimedBy;
    } else if (feedbackType === 'donor-to-volunteer') {
      if (req.user.role !== 'donor') {
        return res.status(403).json({ message: 'Only donors can provide donor-to-volunteer feedback' });
      }
      feedbackData.volunteer = donation.assignedVolunteer;
      feedbackData.ngo = donation.claimedBy;
    } else if (feedbackType === 'ngo-to-volunteer') {
      if (req.user.role !== 'ngo') {
        return res.status(403).json({ message: 'Only NGOs can provide ngo-to-volunteer feedback' });
      }
      feedbackData.ngo = req.user._id;
      feedbackData.volunteer = donation.assignedVolunteer;
      feedbackData.donor = donation.donor;
    }

    // Check for duplicate feedback
    const existingFeedback = await Feedback.findOne({
      donation: donationId,
      feedbackType,
      donor: feedbackData.donor
    });

    if (existingFeedback) {
      return res.status(409).json({ message: 'Feedback already submitted for this donation' });
    }

    // Create feedback
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    await feedback.populate([
      { path: 'donor', select: 'name email' },
      { path: 'ngo', select: 'name email' },
      { path: 'volunteer', select: 'name email' }
    ]);

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/feedback/donation/:donationId - Get all feedback for a specific donation (MUST come before /:userId)
router.get('/donation/:donationId', auth, async (req, res) => {
  try {
    const { donationId } = req.params;

    const feedback = await Feedback.find({ donation: donationId })
      .populate('donor', 'name email')
      .populate('ngo', 'name email')
      .populate('volunteer', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching donation feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/feedback/:userId - Get feedback received by a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query; // Optional: filter by feedback type

    console.log('📊 Feedback GET request for userId:', userId);
    console.log('📊 Filter type:', type);

    // Build query
    const query = {
      $or: [
        { ngo: userId },
        { volunteer: userId }
      ]
    };

    if (type && ['donor-to-ngo', 'donor-to-volunteer', 'ngo-to-volunteer'].includes(type)) {
      query.feedbackType = type;
    }

    console.log('📊 Query:', JSON.stringify(query));

    const feedback = await Feedback.find(query)
      .populate('donation', 'foodType status createdAt')
      .populate('donor', 'name email')
      .populate('volunteer', 'name email')
      .sort({ createdAt: -1 });

    console.log('📊 Found feedback records:', feedback.length);

    // Calculate average rating
    const avgRating = feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : 0;

    res.json({
      count: feedback.count || feedback.length,
      averageRating: avgRating,
      feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
