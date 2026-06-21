const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const User = require('../models/User');
const adminAuth = require('../middleware/adminAuth');

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const stats = await Promise.all([
      Donation.countDocuments({ status: 'pending' }),
      Donation.countDocuments({ status: 'assigned_to_volunteer' }),
      Donation.countDocuments({ status: 'picked_up' }),
      Donation.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'volunteer', isAvailable: true })
    ]);

    res.json({
      pendingDonations: stats[0],
      assignedDonations: stats[1],
      pickedDonations: stats[2],
      deliveredDonations: stats[3],
      totalDonors: stats[4],
      totalVolunteers: stats[5],
      availableVolunteers: stats[6]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all donations with filtering
router.get('/donations', adminAuth, async (req, res) => {
  try {
    console.log('=== ADMIN DONATIONS REQUEST ===');
    console.log('Query params:', req.query);
    
    // Temporarily remove all filters to get all donations
    const donations = await Donation.find({})
      .populate('donor', 'name email phone')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent

    console.log('Found donations:', donations.length);
    console.log('Sample donation:', {
      id: donations[0]?._id,
      foodType: donations[0]?.foodType,
      hasLocation: !!donations[0]?.location,
      coordinates: donations[0]?.location?.coordinates
    });
    
    const total = await Donation.countDocuments();
    
    res.json({
      donations,
      totalPages: Math.ceil(total / 50),
      currentPage: 1,
      total
    });
    console.log('=== END ADMIN DONATIONS REQUEST ===');
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign volunteer to donation
router.patch('/donations/:id/assign', adminAuth, async (req, res) => {
  try {
    const { volunteerId } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({ message: 'Can only assign pending donations' });
    }

    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'volunteer' || !volunteer.isAvailable) {
      return res.status(400).json({ message: 'Invalid or unavailable volunteer' });
    }

    donation.status = 'assigned_to_volunteer';
    donation.assignedVolunteer = volunteerId;
    donation.assignedAt = new Date();

    await donation.save();
    await donation.populate('donor', 'name email phone');
    await donation.populate('assignedVolunteer', 'name phone');

    res.json(donation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with filtering
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/map-data
// Returns all NGOs, donations, and volunteers for enhanced admin map visualization
// Response: { ngos: [], donations: [], volunteers: [] }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/map-data', adminAuth, async (req, res) => {
  try {
    console.log('🗺️  Fetching map data for admin dashboard...');

    // Fetch all approved NGOs with location data and compute counts
    const ngos = await User.find({
      role: 'ngo',
      approvalStatus: 'approved',
      'location.coordinates': { $exists: true }
    })
      .select('_id name email phone address location coverageRadius approvalStatus createdAt')
      .lean();

    console.log(`📍 Found ${ngos.length} approved NGOs with locations`);

    // Enrich NGOs with volunteer and donation counts
    const Volunteer = require('../models/User');
    const Donation = require('../models/Donation');

    const enrichedNgos = await Promise.all(
      ngos.map(async (ngo) => {
        // Count volunteers assigned to this NGO
        const volunteerCount = await Volunteer.countDocuments({
          ngoId: ngo._id,
          role: 'volunteer'
        });

        // Count donations claimed by this NGO
        const donationCount = await Donation.countDocuments({
          claimedBy: ngo._id
        });

        return {
          ...ngo,
          volunteerCount,
          donationCount,
          // Generate stable registration number from ID
          registrationNumber: `NGO-${ngo._id.toString().substring(0, 6).toUpperCase()}`
        };
      })
    );

    console.log(`✅ Enriched ${enrichedNgos.length} NGOs with volunteer and donation counts`);

    // Fetch all active donations (pending, accepted, assigned, picked_up)
    const donations = await Donation.find({
      status: { $in: ['pending', 'accepted_by_ngo', 'assigned_to_volunteer', 'picked_up'] },
      'location.coordinates': { $exists: true }
    })
      .select('foodType quantity unit status location pickupTime donor')
      .populate('donor', 'name phone')
      .lean();

    console.log(`🍱 Found ${donations.length} active donations with locations`);

    // Fetch all approved volunteers with location data
    const volunteers = await User.find({
      role: 'volunteer',
      volunteerApprovalStatus: 'approved',
      'location.coordinates': { $exists: true }
    })
      .select('name email phone vehicle location isAvailable completedPickups rating')
      .lean();

    console.log(`👤 Found ${volunteers.length} approved volunteers with locations`);

    res.json({
      success: true,
      ngos: enrichedNgos,
      donations,
      volunteers,
      timestamp: new Date()
    });

    console.log('✅ Map data sent successfully');
  } catch (error) {
    console.error('❌ Error fetching map data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch map data',
      error: error.message 
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/ngos?status=pending|approved|rejected
// Returns NGO accounts filtered by approval status.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/ngos', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { role: 'ngo' };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.approvalStatus = status;
    }

    const ngos = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationExpires -loginAttempts -lockUntil')
      .sort({ createdAt: -1 });

    res.json(ngos);
  } catch (error) {
    console.error('Admin fetch NGOs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/ngos/:id/approve
// Approves an NGO account.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/ngos/:id/approve', adminAuth, async (req, res) => {
  try {
    const ngo = await User.findById(req.params.id);

    if (!ngo) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (ngo.role !== 'ngo') {
      return res.status(400).json({ message: 'User is not an NGO.' });
    }

    ngo.approvalStatus = 'approved';
    ngo.approvalNote = null;
    await ngo.save();

    res.json({
      message: `NGO "${ngo.name}" has been approved.`,
      ngo: {
        id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        approvalStatus: ngo.approvalStatus
      }
    });
  } catch (error) {
    console.error('Admin approve NGO error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/ngos/:id/reject
// Rejects an NGO account with an optional note.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/ngos/:id/reject', adminAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const ngo = await User.findById(req.params.id);

    if (!ngo) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (ngo.role !== 'ngo') {
      return res.status(400).json({ message: 'User is not an NGO.' });
    }

    ngo.approvalStatus = 'rejected';
    ngo.approvalNote = note || null;
    await ngo.save();

    res.json({
      message: `NGO "${ngo.name}" has been rejected.`,
      ngo: {
        id: ngo._id,
        name: ngo.name,
        email: ngo.email,
        approvalStatus: ngo.approvalStatus,
        approvalNote: ngo.approvalNote
      }
    });
  } catch (error) {
    console.error('Admin reject NGO error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
