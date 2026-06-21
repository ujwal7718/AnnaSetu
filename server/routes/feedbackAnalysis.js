const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const feedbackAnalysisService = require('../services/feedbackAnalysisService');
const Feedback = require('../models/Feedback');
const FeedbackAnalysis = require('../models/FeedbackAnalysis');

/**
 * GET /api/feedback-analysis/:ngoId
 * Get AI-generated feedback analysis for an NGO
 * Returns cached analysis or regenerates if needed
 */
router.get('/:ngoId', auth, async (req, res) => {
  try {
    const { ngoId } = req.params;
    
    console.log(`🔍 [AI INSIGHTS] GET /api/feedback-analysis/${ngoId}`);
    console.log(`   User ID: ${req.user._id}`);
    console.log(`   Requested NGO ID: ${ngoId}`);
    console.log(`   Are they equal? ${req.user._id.toString() === ngoId}`);

    // Verify user is the NGO or admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== ngoId) {
      console.log(`   ❌ Authorization failed - user is not the NGO owner`);
      return res.status(403).json({ message: 'Not authorized to view this analysis' });
    }

    // Convert to ObjectId for querying - use new keyword for newer mongoose
    let ngoObjectId;
    try {
      ngoObjectId = new mongoose.Types.ObjectId(ngoId);
      console.log(`   ✅ ObjectId conversion successful: ${ngoObjectId}`);
    } catch (err) {
      console.log(`   ❌ ObjectId conversion failed: ${err.message}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid NGO ID format' 
      });
    }

    // Get cached analysis
    const cachedAnalysis = await FeedbackAnalysis.findOne({ ngoId: ngoObjectId });
    console.log(`   📦 Cached analysis found: ${!!cachedAnalysis}`);

    // Get current feedback count (with proper ObjectId querying)
    const currentFeedback = await Feedback.countDocuments({
      $or: [
        { ngo: ngoObjectId },
        { volunteer: ngoObjectId }
      ]
    });
    console.log(`   📊 Current feedback count: ${currentFeedback}`);

    console.log(`📊 Analysis request for NGO ${ngoId}:`, {
      cached: !!cachedAnalysis,
      feedbackCount: currentFeedback,
      needsAnalysis: !cachedAnalysis
    });

    // Determine if regeneration is needed
    const needsRegeneration = !cachedAnalysis || 
      feedbackAnalysisService.shouldRegenerate(
        cachedAnalysis?.lastAnalyzedAt,
        currentFeedback,
        cachedAnalysis?.feedbackCount || 0
      );

    if (needsRegeneration) {
      console.log(`🔄 Regenerating analysis for NGO ${ngoId}`);
      
      // Regenerate analysis
      const analysisResult = await feedbackAnalysisService.analyzeFeedback(ngoObjectId);
      
      if (!analysisResult.success) {
        console.log(`⚠️  Analysis generation failed: ${analysisResult.message}`);
        return res.status(200).json({
          success: false,
          message: analysisResult.message,
          feedbackCount: analysisResult.feedbackCount
        });
      }

      console.log(`✅ Analysis generated successfully for NGO ${ngoId}`);
      return res.json({
        success: true,
        data: analysisResult.data,
        message: analysisResult.message,
        isNew: true
      });
    }

    // Return cached analysis
    console.log(`✅ Using cached analysis for NGO ${ngoId}`);
    res.json({
      success: true,
      data: cachedAnalysis,
      message: 'Using cached analysis',
      isNew: false
    });
  } catch (error) {
    console.error('❌ Error fetching feedback analysis:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve feedback analysis',
      error: error.message 
    });
  }
});

/**
 * POST /api/feedback-analysis/:ngoId/regenerate
 * Force regeneration of analysis (manual refresh)
 */
router.post('/:ngoId/regenerate', auth, async (req, res) => {
  try {
    const { ngoId } = req.params;

    console.log(`🔄 [AI INSIGHTS] POST /api/feedback-analysis/${ngoId}/regenerate`);
    console.log(`   User ID: ${req.user._id}`);
    console.log(`   Requested NGO ID: ${ngoId}`);

    // Verify user is the NGO
    if (req.user._id.toString() !== ngoId) {
      console.log(`   ❌ Authorization failed - user is not the NGO owner`);
      return res.status(403).json({ message: 'Not authorized to regenerate this analysis' });
    }

    // Convert to ObjectId - use new keyword for newer mongoose
    let ngoObjectId;
    try {
      ngoObjectId = new mongoose.Types.ObjectId(ngoId);
      console.log(`   ✅ ObjectId conversion successful: ${ngoObjectId}`);
    } catch (err) {
      console.log(`   ❌ ObjectId conversion failed: ${err.message}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid NGO ID format' 
      });
    }

    console.log(`🔄 Manual regeneration requested for NGO ${ngoId}`);

    // Regenerate analysis
    const result = await feedbackAnalysisService.analyzeFeedback(ngoObjectId);

    if (!result.success) {
      console.log(`⚠️  Regeneration failed: ${result.message}`);
      return res.status(200).json({
        success: false,
        message: result.message,
        feedbackCount: result.feedbackCount
      });
    }

    console.log(`✅ Analysis regenerated successfully for NGO ${ngoId}`);
    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Error regenerating feedback analysis:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to regenerate feedback analysis',
      error: error.message 
    });
  }
});

module.exports = router;
