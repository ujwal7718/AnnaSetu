/**
 * Backfill script to add ngo field to existing donor-to-volunteer feedback documents
 * Run this once to populate the ngo field for historical feedback records
 * 
 * Usage: node server/scripts/backfillNGOFeedback.js
 */

const mongoose = require('mongoose');
const Feedback = require('../models/Feedback');
const Donation = require('../models/Donation');
require('dotenv').config();

async function backfillNGOFeedback() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all donor-to-volunteer feedback without ngo field
    const feedbackToUpdate = await Feedback.find({
      feedbackType: 'donor-to-volunteer',
      ngo: { $exists: false }
    });

    console.log(`📊 Found ${feedbackToUpdate.length} feedback records missing ngo field`);

    if (feedbackToUpdate.length === 0) {
      console.log('✅ All feedback records already have ngo field');
      await mongoose.connection.close();
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const feedback of feedbackToUpdate) {
      try {
        // Get donation to find claimedBy (NGO)
        const donation = await Donation.findById(feedback.donation);
        
        if (!donation) {
          console.warn(`⚠️  Donation not found for feedback ${feedback._id}`);
          errors++;
          continue;
        }

        if (!donation.claimedBy) {
          console.warn(`⚠️  Donation ${donation._id} has no claimedBy (NGO)`);
          errors++;
          continue;
        }

        // Update feedback with ngo field
        await Feedback.updateOne(
          { _id: feedback._id },
          { $set: { ngo: donation.claimedBy } }
        );

        updated++;
        console.log(`✅ Updated feedback ${feedback._id}`);
      } catch (err) {
        console.error(`❌ Error updating feedback ${feedback._id}:`, err.message);
        errors++;
      }
    }

    console.log(`\n📈 Backfill complete:`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Total: ${updated + errors}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Backfill failed:', error.message);
    process.exit(1);
  }
}

// Run backfill
backfillNGOFeedback();
