const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const auth = require('../middleware/auth');
const volunteerAuth = require('../middleware/volunteerAuth');
const { uploadDonationImages } = require('../middleware/upload');
const { emitDonationCreated } = require('../socket');

// Create new donation with image support
router.post('/', auth, uploadDonationImages, async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can create donations' });
    }

    const {
      foodType,
      quantity,
      unit,
      description,
      expiryDate,
      pickupTime,
      location,
      address
    } = req.body;

    // Validation
    if (!foodType || !quantity || !unit || !description || !expiryDate || !pickupTime || !location || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Parse location (expect stringified JSON from frontend)
    let parsedLocation;
    try {
      parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
    } catch (error) {
      return res.status(400).json({ message: 'Invalid location format' });
    }

    // Process uploaded images
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Store relative path for frontend access
        imageUrls.push(`/uploads/${file.filename}`);
      });
    }

    const donation = new Donation({
      donor: req.user.id,
      foodType,
      quantity,
      unit,
      description,
      expiryDate: new Date(expiryDate),
      pickupTime: new Date(pickupTime),
      location: {
        type: 'Point',
        coordinates: [parsedLocation.lng, parsedLocation.lat],
        address: address
      },
      images: imageUrls // Add uploaded images
    });

    await donation.save();
    await donation.populate('donor', 'name email phone');

    // Emit real-time notification to NGOs
    emitDonationCreated(donation);

    res.status(201).json(donation);
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get donations for donor
router.get('/my-donations', auth, async (req, res) => {
  try {
    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can view their donations' });
    }

    const donations = await Donation.find({ donor: req.user.id })
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 });

    // For completed donations, check if feedback exists
    const donationsWithFeedback = await Promise.all(
      donations.map(async (donation) => {
        if (donation.status === 'completed') {
          const feedbackExists = await Feedback.findOne({
            donation: donation._id,
            feedbackType: { $in: ['donor-to-ngo', 'donor-to-volunteer'] },
            donor: req.user.id
          });
          return {
            ...donation.toObject(),
            hasDonorFeedback: !!feedbackExists
          };
        }
        return donation.toObject();
      })
    );

    res.json(donationsWithFeedback);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all donations (debug route)
router.get('/all', auth, async (req, res) => {
  try {
    const donations = await Donation.find({})
      .populate('donor', 'name phone address')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DEPRECATED: Get available donations for volunteers
// ⚠️ This endpoint is deprecated. Use GET /api/donations/volunteer-assigned instead.
// Volunteers must ONLY see donations assigned by NGOs, not pending donations.
router.get('/available', volunteerAuth, async (req, res) => {
  return res.status(410).json({
    error: 'endpoint_deprecated',
    message: 'This endpoint is deprecated. Use GET /api/donations/volunteer-assigned instead.',
    reason: 'Volunteers must not access pending donations. Only donations explicitly assigned by NGOs should be visible.',
    action: 'Use GET /api/donations/volunteer-assigned to fetch donations assigned to this volunteer'
  });
});

// Get donations assigned to this specific volunteer
router.get('/volunteer-assigned', volunteerAuth, async (req, res) => {
  try {
    console.log('=== VOLUNTEER ASSIGNED DONATIONS REQUEST ===');
    console.log('Volunteer ID:', req.user.id);
    console.log('Volunteer Email:', req.user.email);
    console.log('Volunteer Name:', req.user.name);
    
    if (req.user.role !== 'volunteer') {
      console.log('Access denied: User is not a volunteer');
      return res.status(403).json({ message: 'Only volunteers can access this endpoint' });
    }

    // Query ONLY donations assigned to this specific volunteer
    // These are donations in 'assigned_to_volunteer' status only (NOT picked_up)
    const donations = await Donation.find({
      assignedVolunteer: req.user.id,
      status: 'assigned_to_volunteer'
    })
      .populate('donor', 'name phone location address')
      .populate('claimedBy', 'name email phone')
      .sort({ assignedAt: -1 });

    console.log('Found assigned donations:', donations.length);
    console.log('Statuses returned:', donations.map(d => d.status).join(', '));
    
    // Log first 3 for debugging
    donations.slice(0, 3).forEach((d, i) => {
      console.log(`Donation ${i + 1}:`, {
        id: d._id,
        status: d.status,
        foodType: d.foodType,
        assignedVolunteer: d.assignedVolunteer,
        assignedAt: d.assignedAt
      });
    });

    console.log('=== END VOLUNTEER ASSIGNED DONATIONS REQUEST ===');

    res.json(donations);
  } catch (error) {
    console.error('Error fetching volunteer assignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/donations/:id/accept - DEPRECATED
// This endpoint is no longer used. Volunteers should directly verify OTP.
// Status flow: assigned_to_volunteer → (OTP verification) → picked_up
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: This endpoint is kept for backward compatibility but should not be used
// Volunteers now go directly to OTP verification without an intermediate accept step
router.patch('/:id/accept', volunteerAuth, async (req, res) => {
  try {
    console.log('⚠️  DEPRECATED: /accept endpoint called');
    console.log('Donation ID:', req.params.id);
    console.log('Volunteer ID:', req.user.id);
    
    // Fetch donation WITHOUT changing status
    const donation = await Donation.findOne(
      {
        _id: req.params.id,
        assignedVolunteer: req.user.id,
        status: 'assigned_to_volunteer'
      }
    )
      .populate('donor', 'name phone address')
      .populate('assignedVolunteer', 'name phone');

    if (!donation) {
      console.log('❌ Donation not found or not assigned to this volunteer');
      return res.status(404).json({ 
        message: 'Donation not found or not assigned to you',
        reason: 'Donation must be in assigned_to_volunteer status and assigned to your ID'
      });
    }

    console.log('⚠️  Returning donation WITHOUT changing status (accept is now just a fetch):', {
      donationId: donation._id,
      status: donation.status,
      assignedVolunteer: donation.assignedVolunteer._id
    });

    // Return the donation as-is, status remains 'assigned_to_volunteer'
    res.json(donation);
  } catch (error) {
    console.error('❌ Error in accept endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update donation status (volunteer) - atomic update
// IMPORTANT: This endpoint accepts 'awaiting_ngo_confirmation' ONLY
// 'picked_up' is set ONLY via OTP verification
// 'completed' is set ONLY via NGO confirmation
router.patch('/:id/status', volunteerAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    console.log('=== UPDATE STATUS REQUEST ===');
    console.log('Donation ID:', req.params.id);
    console.log('Volunteer ID:', req.user.id);
    console.log('New Status:', status);

    // Validate status value - volunteer can only mark as 'awaiting_ngo_confirmation'
    if (!['awaiting_ngo_confirmation'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Volunteer can only mark as awaiting_ngo_confirmation' });
    }

    // Fetch donation first to check conditions
    const donation = await Donation.findOne({
      _id: req.params.id,
      assignedVolunteer: req.user.id
    });

    if (!donation) {
      console.log('❌ Donation not found or not assigned to this volunteer');
      return res.status(403).json({ 
        message: 'Donation not found or not assigned to you'
      });
    }

    // Volunteer can only mark as delivered if donation was already picked_up
    if (donation.status !== 'picked_up') {
      console.log('❌ Invalid status for Mark Delivered:', donation.status, '(expected: picked_up)');
      return res.status(400).json({
        message: 'Donation must be picked_up before marking as delivered',
        currentStatus: donation.status
      });
    }

    // Must have verified OTP before marking delivered
    if (!donation.pickupOTPVerified) {
      console.log('❌ OTP not verified, cannot mark as delivered');
      return res.status(400).json({
        message: 'OTP must be verified before marking as delivered'
      });
    }

    // Log state before update
    console.log('📊 State before marking delivered:', {
      status: donation.status,
      pickupOTPVerified: donation.pickupOTPVerified,
      pickedUpAt: donation.pickedUpAt
    });

    // Build update object
    let updateData = { status: 'awaiting_ngo_confirmation', deliveredAt: new Date() };

    // Use atomic update
    const updatedDonation = await Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        assignedVolunteer: req.user.id
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('donor', 'name phone address')
      .populate('assignedVolunteer', 'name phone');

    console.log('✅ Status updated to awaiting_ngo_confirmation:', {
      donationId: updatedDonation._id,
      newStatus: updatedDonation.status,
      deliveredAt: updatedDonation.deliveredAt
    });

    res.json(updatedDonation);
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/donations/:id/verify-pickup
// Volunteer verifies OTP from donor to mark pickup as completed.
// Status: assigned_to_volunteer → picked_up (only if OTP is valid)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/verify-pickup', volunteerAuth, async (req, res) => {
  try {
    const { otp } = req.body;

    console.log('=== VERIFY PICKUP OTP REQUEST ===');
    console.log('Donation ID:', req.params.id);
    console.log('Volunteer ID:', req.user.id);
    console.log('OTP provided:', otp ? '(6 digits)' : 'MISSING');

    // Validate OTP format
    if (!otp || !/^\d{6}$/.test(otp.toString())) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' });
    }

    // Fetch donation
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Verify volunteer
    if (!donation.assignedVolunteer || donation.assignedVolunteer.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'Only assigned volunteer can verify OTP'
      });
    }

    // Check current status
    if (donation.status !== 'assigned_to_volunteer') {
      return res.status(400).json({
        message: 'OTP can only be verified for assigned donations'
      });
    }

    // Check if OTP was already verified
    if (donation.pickupOTPVerified) {
      return res.status(400).json({
        message: 'OTP has already been verified for this donation'
      });
    }

    // Verify OTP exists and is valid
    if (!donation.pickupOTP) {
      return res.status(500).json({
        message: 'OTP not found for this donation. Please contact support.'
      });
    }

    // Check OTP expiry
    if (!donation.pickupOTPExpiresAt || new Date() > donation.pickupOTPExpiresAt) {
      console.log('❌ OTP expired:', {
        expiresAt: donation.pickupOTPExpiresAt,
        now: new Date()
      });
      return res.status(400).json({
        message: 'OTP has expired. Please ask donor to request a new OTP.'
      });
    }

    // Verify OTP value
    if (donation.pickupOTP !== otp.toString()) {
      console.log('❌ OTP mismatch');
      return res.status(400).json({
        message: 'Incorrect OTP. Please try again.'
      });
    }

    // OTP is valid! Mark as verified and set status to picked_up
    const now = new Date();
    
    donation.pickupOTPVerified = true;
    donation.pickupVerifiedAt = now;
    donation.status = 'picked_up';
    donation.pickedUpAt = now;

    console.log('📝 Before save - donation object:', {
      _id: donation._id,
      pickupOTPVerified: donation.pickupOTPVerified,
      pickupVerifiedAt: donation.pickupVerifiedAt,
      status: donation.status,
      pickedUpAt: donation.pickedUpAt,
      modified: donation.modifiedPaths()
    });

    const savedDonation = await donation.save();
    
    console.log('✅ After save - saved object:', {
      _id: savedDonation._id,
      status: savedDonation.status,
      pickupOTPVerified: savedDonation.pickupOTPVerified,
      pickupVerifiedAt: savedDonation.pickupVerifiedAt,
      pickedUpAt: savedDonation.pickedUpAt
    });
    
    // Fetch fresh from DB to verify persistence
    const freshDonation = await Donation.findById(req.params.id);
    console.log('🔍 Fresh fetch from DB:', {
      _id: freshDonation._id,
      status: freshDonation.status,
      pickupOTPVerified: freshDonation.pickupOTPVerified,
      pickupVerifiedAt: freshDonation.pickupVerifiedAt,
      pickedUpAt: freshDonation.pickedUpAt
    });
    
    await savedDonation.populate('donor', 'name phone address');
    await savedDonation.populate('assignedVolunteer', 'name phone');
    await savedDonation.populate('claimedBy', 'name email phone');

    console.log('✅ OTP verified successfully - final response:', {
      donationId: savedDonation._id,
      status: savedDonation.status,
      pickupOTPVerified: savedDonation.pickupOTPVerified,
      pickedUpAt: savedDonation.pickedUpAt
    });

    res.json({
      message: 'Pickup verified successfully!',
      donation: savedDonation
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
