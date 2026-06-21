const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
const ngoAuth = require('../middleware/ngoAuth');
const { emitVolunteerAssigned, emitNGONotification } = require('../socket');

// All routes below require: valid JWT + role=ngo + approvalStatus=approved

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/profile
// Returns the authenticated NGO's own profile.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', ngoAuth, (req, res) => {
  res.json(req.user);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/donations/available
// Returns donations with status 'pending' within 5km radius of NGO location.
// Also returns coverage statistics.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/donations/available', ngoAuth, async (req, res) => {
  try {
    const ngoLocation = req.user.location;
    
    if (!ngoLocation || !ngoLocation.coordinates || ngoLocation.coordinates.length !== 2) {
      return res.status(400).json({ 
        message: 'NGO location not set. Please update your profile with location coordinates.' 
      });
    }

    // Get total pending donations count (for statistics)
    const totalPendingCount = await Donation.countDocuments({ status: 'pending' });

    // Get donations within 5km radius using geospatial query
    const nearbyDonations = await Donation.find({
      status: 'pending',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: ngoLocation.coordinates
          },
          $maxDistance: 5000 // 5km in meters
        }
      }
    })
      .populate('donor', 'name phone location')
      .sort({ createdAt: -1 });

    // Calculate outside coverage count
    const outsideCoverageCount = Math.max(0, totalPendingCount - nearbyDonations.length);

    res.json({
      donations: nearbyDonations,
      coverageStats: {
        nearby: nearbyDonations.length,
        outsideCoverage: outsideCoverageCount,
        total: totalPendingCount
      }
    });
  } catch (error) {
    console.error('NGO available donations error:', error);
    
    // Fallback to non-geospatial query if geospatial index error
    if (error.name === 'MongoError' && error.message.includes('2dsphere')) {
      console.warn('Geospatial index error, falling back to simple query');
      try {
        const donations = await Donation.find({ status: 'pending' })
          .populate('donor', 'name phone location')
          .sort({ createdAt: -1 });
        
        res.json({
          donations: donations,
          coverageStats: {
            nearby: donations.length,
            outsideCoverage: 0,
            total: donations.length
          },
          warning: 'Geospatial filtering temporarily disabled'
        });
      } catch (fallbackError) {
        console.error('Fallback query error:', fallbackError);
        res.status(500).json({ message: 'Server error.' });
      }
    } else {
      res.status(500).json({ message: 'Server error.' });
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/donations/claimed
// Returns all donations accepted by this NGO (status: accepted_by_ngo, 
// assigned_to_volunteer, picked_up, awaiting_ngo_confirmation, completed).
// MUST come before /:id routes to avoid wildcard matching
// ─────────────────────────────────────────────────────────────────────────────
router.get('/donations/claimed', ngoAuth, async (req, res) => {
  try {
    const donations = await Donation.find({ claimedBy: req.user.id })
      .populate('donor', 'name phone location')
      .populate('assignedVolunteer', 'name phone')
      .sort({ claimedAt: -1 });

    res.json(donations);
  } catch (error) {
    console.error('NGO claimed donations error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/donations/awaiting-confirmation
// Returns donations awaiting NGO confirmation (status: awaiting_ngo_confirmation).
// These are donations that volunteer marked as delivered.
// MUST come before /:id routes to avoid wildcard matching
// ─────────────────────────────────────────────────────────────────────────────
router.get('/donations/awaiting-confirmation', ngoAuth, async (req, res) => {
  try {
    console.log('=== NGO AWAITING CONFIRMATION REQUEST ===');
    console.log('NGO ID:', req.user.id);

    const donations = await Donation.find({
      claimedBy: req.user.id,
      status: 'awaiting_ngo_confirmation'
    })
      .populate('donor', 'name phone location address')
      .populate('assignedVolunteer', 'name phone')
      .sort({ deliveredAt: -1 });

    console.log('Found awaiting confirmation donations:', donations.length);

    res.json(donations);
  } catch (error) {
    console.error('NGO awaiting confirmation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ngo/donations/:id/claim
// NGO accepts a pending donation. Status: pending → accepted_by_ngo.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/donations/:id/claim', ngoAuth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({
        message: 'This donation has already been accepted or is no longer available.'
      });
    }

    donation.status = 'accepted_by_ngo';
    donation.claimedBy = req.user.id;
    donation.claimedAt = new Date();

    await donation.save();
    await donation.populate('donor', 'name phone location');
    await donation.populate('claimedBy', 'name email phone');

    res.json(donation);
  } catch (error) {
    console.error('NGO accept donation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/volunteers
// Returns available volunteers for the NGO to assign.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/volunteers', ngoAuth, async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer', isAvailable: true })
      .select('name phone location isAvailable')
      .sort({ name: 1 });

    res.json(volunteers);
  } catch (error) {
    console.error('NGO fetch volunteers error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/volunteers/nearby
// Returns available approved volunteers within NGO's 5km radius.
// Falls back to all approved volunteers if NGO location not set or geospatial query fails.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/volunteers/nearby', ngoAuth, async (req, res) => {
  try {
    const ngoLocation = req.user.location;
    
    console.log('NGO nearby volunteers request:');
    console.log('- NGO ID:', req.user.id);
    console.log('- NGO has location:', !!ngoLocation);
    if (ngoLocation) {
      console.log('- NGO location coords:', ngoLocation.coordinates);
    }

    // If NGO has valid location, use geospatial query
    if (ngoLocation && ngoLocation.coordinates && ngoLocation.coordinates.length === 2) {
      try {
        const volunteers = await User.find({
          role: 'volunteer',
          isAvailable: true,
          volunteerApprovalStatus: 'approved',
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: ngoLocation.coordinates
              },
              $maxDistance: 5000 // 5km in meters
            }
          }
        })
          .select('name email phone location isAvailable')
          .sort({ name: 1 });

        console.log('Geospatial query found:', volunteers.length, 'volunteers');
        return res.json(volunteers);
      } catch (geoError) {
        console.error('Geospatial query error:', geoError.message);
        console.log('Falling back to non-geospatial query...');
        // Fall through to simple query below
      }
    } else {
      console.log('NGO location not set, using simple query');
    }

    // Fallback: return all approved available volunteers (no distance filter)
    const volunteers = await User.find({
      role: 'volunteer',
      isAvailable: true,
      volunteerApprovalStatus: 'approved'
    })
      .select('name email phone location isAvailable')
      .sort({ name: 1 });

    console.log('Simple query found:', volunteers.length, 'volunteers');
    res.json(volunteers);

  } catch (error) {
    console.error('NGO nearby volunteers error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch volunteers',
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ngo/donations/:id/assign-volunteer
// NGO assigns a volunteer to an accepted donation.
// Status: accepted_by_ngo → assigned_to_volunteer.
// Generates and sends 6-digit OTP to donor via email.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/donations/:id/assign-volunteer', ngoAuth, async (req, res) => {
  try {
    const { volunteerId } = req.body;

    if (!volunteerId) {
      return res.status(400).json({ message: 'volunteerId is required.' });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    // Guard: only the NGO that accepted this donation can assign a volunteer
    if (!donation.claimedBy || donation.claimedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can only assign volunteers to donations you have accepted.'
      });
    }

    if (donation.status !== 'accepted_by_ngo') {
      return res.status(400).json({
        message: 'A volunteer can only be assigned to a donation you have accepted.'
      });
    }

    // Validate volunteer
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer') {
      return res.status(400).json({ message: 'Invalid volunteer.' });
    }
    if (!volunteer.isAvailable) {
      return res.status(400).json({ message: 'This volunteer is currently unavailable.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    donation.status = 'assigned_to_volunteer';
    donation.assignedVolunteer = volunteerId;
    donation.assignedAt = new Date();
    donation.pickupOTP = otp;
    donation.pickupOTPExpiresAt = otpExpiresAt;

    await donation.save();
    
    console.log('📝 Saved donation, now populating relations...');
    await donation.populate('donor', 'name phone location email');
    console.log('✅ Donor populated:', {
      id: donation.donor?._id,
      name: donation.donor?.name,
      email: donation.donor?.email,
      phone: donation.donor?.phone
    });
    
    await donation.populate('claimedBy', 'name email phone');
    console.log('✅ ClaimedBy populated:', {
      id: donation.claimedBy?._id,
      name: donation.claimedBy?.name,
      email: donation.claimedBy?.email
    });
    
    await donation.populate('assignedVolunteer', 'name phone');
    console.log('✅ AssignedVolunteer populated:', {
      id: donation.assignedVolunteer?._id,
      name: donation.assignedVolunteer?.name,
      phone: donation.assignedVolunteer?.phone
    });

    // Send OTP via email to donor
    console.log('📧 Preparing to send OTP email:');
    console.log('- OTP:', otp);
    console.log('- Donor email:', donation.donor?.email);
    console.log('- Donor name:', donation.donor?.name);
    console.log('- OTP expires at:', otpExpiresAt);

    // Validate donor email exists
    if (!donation.donor || !donation.donor.email) {
      console.error('❌ Cannot send OTP email - donor email is missing!');
      console.error('   Donor object:', donation.donor);
      console.error('   Please ensure donor has registered with an email address');
    } else {
      try {
        const { sendPickupOTPEmail } = require('../services/emailService');
        console.log('📤 Calling sendPickupOTPEmail...');
        await sendPickupOTPEmail(donation.donor.email, donation.donor.name, otp);
        console.log('✅ OTP email sent successfully to:', donation.donor.email);
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError.message);
        console.error('📋 Email error stack:', emailError.stack);
        // Don't fail the request if email fails, but log it
      }
    }

    // Emit real-time notifications
    emitVolunteerAssigned(volunteerId, donation);
    emitNGONotification(`Volunteer "${volunteer.name}" assigned to donation: ${donation.foodType}`, 'info');

    res.json(donation);
  } catch (error) {
    console.error('NGO assign volunteer error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ngo/donations/:id/confirm
// NGO confirms completion of a delivery.
// Status: completed → remains completed (marks confirmation timestamp).
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/donations/:id/confirm', ngoAuth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    if (!donation.claimedBy || donation.claimedBy.toString() !== req.user.id) {
      return res.status(403).json({
        message: 'You can only confirm donations you have accepted.'
      });
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({
        message: 'Only completed donations can be confirmed.'
      });
    }

    donation.ngoConfirmedAt = new Date();

    await donation.save();
    await donation.populate('donor', 'name phone location');
    await donation.populate('assignedVolunteer', 'name phone');

    res.json(donation);
  } catch (error) {
    console.error('NGO confirm donation error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngo/volunteer-requests?status=pending|approved|rejected
// Returns volunteer requests for this NGO, filtered by approval status.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/volunteer-requests', ngoAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { role: 'volunteer', ngoId: req.user.id };
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.volunteerApprovalStatus = status;
    }

    const volunteers = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationExpires -loginAttempts -lockUntil')
      .sort({ createdAt: -1 });

    res.json(volunteers);
  } catch (error) {
    console.error('NGO fetch volunteer requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ngo/volunteers/:id/approve
// Approves a volunteer request.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/volunteers/:id/approve', ngoAuth, async (req, res) => {
  try {
    const volunteer = await User.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found.' });
    }

    if (volunteer.role !== 'volunteer') {
      return res.status(400).json({ message: 'User is not a volunteer.' });
    }

    if (!volunteer.ngoId || volunteer.ngoId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only approve volunteers assigned to your NGO.' });
    }

    volunteer.volunteerApprovalStatus = 'approved';
    volunteer.approvedByNgo = req.user.id;
    volunteer.approvedByNgoAt = new Date();
    volunteer.volunteerApprovalNote = null;
    await volunteer.save();

    res.json({
      message: `Volunteer "${volunteer.name}" has been approved.`,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        volunteerApprovalStatus: volunteer.volunteerApprovalStatus
      }
    });
  } catch (error) {
    console.error('NGO approve volunteer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/ngo/volunteers/:id/reject
// Rejects a volunteer request with an optional note.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/volunteers/:id/reject', ngoAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const volunteer = await User.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found.' });
    }

    if (volunteer.role !== 'volunteer') {
      return res.status(400).json({ message: 'User is not a volunteer.' });
    }

    if (!volunteer.ngoId || volunteer.ngoId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only reject volunteers assigned to your NGO.' });
    }

    volunteer.volunteerApprovalStatus = 'rejected';
    volunteer.volunteerApprovalNote = note || null;
    await volunteer.save();

    res.json({
      message: `Volunteer "${volunteer.name}" has been rejected.`,
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        email: volunteer.email,
        volunteerApprovalStatus: volunteer.volunteerApprovalStatus,
        volunteerApprovalNote: volunteer.volunteerApprovalNote
      }
    });
  } catch (error) {
    console.error('NGO reject volunteer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/ngo/donations/:id/confirm-delivery
// NGO confirms delivery of a donation that volunteer marked as delivered.
// Status: awaiting_ngo_confirmation → completed
// Rules:
//   - Only the NGO that accepted the donation can confirm
//   - OTP must have been verified by volunteer
//   - Cannot confirm already completed donations
// ─────────────────────────────────────────────────────────────────────────────
router.put('/donations/:id/confirm-delivery', ngoAuth, async (req, res) => {
  try {
    console.log('=== NGO CONFIRM DELIVERY REQUEST ===');
    console.log('Donation ID:', req.params.id);
    console.log('NGO ID:', req.user.id);

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    console.log('📊 Current donation state:', {
      status: donation.status,
      pickupOTPVerified: donation.pickupOTPVerified,
      pickedUpAt: donation.pickedUpAt,
      deliveredAt: donation.deliveredAt,
      claimedBy: donation.claimedBy?.toString()
    });

    // Verify this NGO claimed the donation
    if (!donation.claimedBy || donation.claimedBy.toString() !== req.user.id) {
      console.log('❌ Authorization failed: Wrong NGO');
      return res.status(403).json({
        message: 'You can only confirm donations you have accepted.'
      });
    }

    // Check current status
    if (donation.status !== 'awaiting_ngo_confirmation') {
      console.log('❌ Invalid status:', donation.status, '(expected: awaiting_ngo_confirmation)');
      return res.status(400).json({
        message: 'Donation must be awaiting confirmation to complete delivery.',
        currentStatus: donation.status
      });
    }

    // PRIMARY CHECK: Verify OTP was verified by volunteer (this is the source of truth)
    if (!donation.pickupOTPVerified) {
      console.log('❌ OTP not verified - cannot confirm delivery');
      return res.status(400).json({
        message: 'Pickup OTP must be verified before confirming delivery.',
        hint: 'Volunteer must verify OTP before marking as delivered'
      });
    }

    console.log('✅ All validations passed - confirming delivery');

    // Mark donation as completed
    donation.status = 'completed';
    donation.completedAt = new Date();
    donation.ngoConfirmedAt = new Date();

    await donation.save();
    await donation.populate('donor', 'name phone location email');
    await donation.populate('assignedVolunteer', 'name phone');
    await donation.populate('claimedBy', 'name email phone');

    console.log('✅ Delivery confirmed - donation completed:', {
      donationId: donation._id,
      status: donation.status,
      completedAt: donation.completedAt,
      ngoConfirmedAt: donation.ngoConfirmedAt
    });

    res.json({
      message: 'Delivery confirmed successfully!',
      donation
    });
  } catch (error) {
    console.error('NGO confirm delivery error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
