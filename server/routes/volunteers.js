const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donation = require('../models/Donation');
const auth = require('../middleware/auth');
const volunteerAuth = require('../middleware/volunteerAuth');

// Get all volunteers (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const volunteers = await User.find({ role: 'volunteer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(volunteers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get volunteer's assigned donations - only picked_up and completed statuses
router.get('/my-assignments', volunteerAuth, async (req, res) => {
  try {
    console.log('=== VOLUNTEER MY-ASSIGNMENTS REQUEST ===');
    console.log('Volunteer ID:', req.user.id);
    
    // Only return donations that are picked_up or completed
    const donations = await Donation.find({
      assignedVolunteer: req.user.id,
      status: { $in: ['picked_up', 'completed'] }
    })
      .populate('donor', 'name phone email address')
      .sort({ assignedAt: -1 });

    console.log('Found assignments:', donations.length);
    console.log('Status breakdown:');
    donations.forEach((d, i) => {
      console.log(`Assignment ${i + 1}:`, {
        id: d._id,
        status: d.status,
        foodType: d.foodType,
        assignedAt: d.assignedAt
      });
    });

    res.json(donations);
  } catch (error) {
    console.error('Error fetching volunteer assignments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update volunteer availability
router.patch('/availability', volunteerAuth, async (req, res) => {
  try {
    console.log('=== UPDATE VOLUNTEER AVAILABILITY ===');
    console.log('User ID:', req.user.id);
    console.log('User Email:', req.user.email);
    console.log('Request body:', req.body);
    
    if (req.user.role !== 'volunteer') {
      console.log('Access denied: User is not a volunteer');
      return res.status(403).json({ message: 'Only volunteers can update their availability' });
    }

    const { isAvailable } = req.body;
    console.log('Setting availability to:', isAvailable);
    
    const user = await User.findById(req.user.id);
    console.log('Current availability:', user.isAvailable);

    user.isAvailable = isAvailable;
    await user.save();
    
    console.log('Updated availability to:', user.isAvailable);
    console.log('=== END UPDATE VOLUNTEER AVAILABILITY ===');

    res.json({ message: 'Availability updated successfully', isAvailable });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
