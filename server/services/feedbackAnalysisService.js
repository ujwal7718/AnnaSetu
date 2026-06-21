const geminiService = require('./geminiService');
const FeedbackAnalysis = require('../models/FeedbackAnalysis');
const Feedback = require('../models/Feedback');

class FeedbackAnalysisService {
  /**
   * Analyze all feedback for an NGO and generate AI insights
   * @param {String} ngoId - NGO user ID
   * @returns {Object} Analysis results with sentiment, summary, strengths, improvements
   */
  async analyzeFeedback(ngoId) {
    try {
      console.log(`📊 Analyzing feedback for NGO: ${ngoId}`);
      
      // Get all feedback for this NGO
      const feedbackDocs = await Feedback.find({
        $or: [
          { ngo: ngoId },
          { volunteer: ngoId }
        ]
      })
        .populate('donor', 'name')
        .populate('volunteer', 'name')
        .sort({ createdAt: -1 });

      console.log(`📊 Total feedback records: ${feedbackDocs.length}`);
      console.log(`📦 All feedback records:`, feedbackDocs.map(f => ({
        id: f._id,
        rating: f.rating,
        comment: f.comment ? f.comment.substring(0, 50) : 'NO COMMENT',
        type: f.feedbackType
      })));

      // Check if we have any feedback at all
      if (feedbackDocs.length === 0) {
        console.log(`⚠️  No feedback available`);
        return {
          success: false,
          message: 'No feedback available yet.',
          feedbackCount: 0
        };
      }

      // Filter to get only comments (exclude empty comments)
      const feedbackWithComments = feedbackDocs
        .filter(f => f.comment && f.comment.trim().length > 0);
      const comments = feedbackWithComments.map(f => f.comment);

      console.log(`📝 Feedback with comments: ${feedbackWithComments.length}`);
      console.log(`📝 Comments array:`, comments);

      // NEW ELIGIBILITY RULES:
      // Generate AI insights if:
      // - At least 2 feedback records exist (with or without comments), OR
      // - At least 1 non-empty comment exists
      const hasEnoughFeedback = feedbackDocs.length >= 2 || comments.length >= 1;

      if (!hasEnoughFeedback) {
        console.log(`⚠️  Insufficient feedback: ${feedbackDocs.length} records, ${comments.length} comments`);
        return {
          success: false,
          message: 'Not enough feedback available for AI analysis.',
          feedbackCount: feedbackDocs.length
        };
      }

      console.log(`✅ Eligible for analysis: ${feedbackDocs.length} records, ${comments.length} comments`);

      // Check if Gemini service is ready
      if (!geminiService.isServiceReady()) {
        console.log(`⚠️  Gemini service not ready`);
        return {
          success: false,
          message: 'AI analysis service is not available. Please try again later.',
          feedbackCount: feedbackDocs.length
        };
      }

      // Create prompt for Gemini (handles both comment-based and rating-based analysis)
      const prompt = this._createAnalysisPrompt(comments, feedbackDocs);

      console.log(`🔄 Calling Gemini API for analysis...`);

      // Call Gemini API
      const result = await geminiService.model.generateContent(prompt);
      const responseText = result.response.text();

      console.log(`✅ Gemini response received, parsing...`);

      // Parse Gemini response
      const analysis = this._parseGeminiResponse(responseText);

      console.log(`📊 Parsed analysis:`, {
        sentiment: analysis.sentiment,
        summaryLength: analysis.summary.length,
        strengths: analysis.strengths.length,
        improvements: analysis.improvements.length
      });

      // Store analysis in database (use total feedback records count, not just comments)
      const storedAnalysis = await FeedbackAnalysis.findOneAndUpdate(
        { ngoId },
        {
          ngoId,
          sentiment: analysis.sentiment,
          summary: analysis.summary,
          strengths: analysis.strengths,
          improvements: analysis.improvements,
          feedbackCount: feedbackDocs.length,
          lastAnalyzedAt: new Date(),
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Analysis stored in database`);

      return {
        success: true,
        data: storedAnalysis,
        message: 'Feedback analysis completed successfully'
      };
    } catch (error) {
      console.error('❌ Error analyzing feedback:', error);
      return {
        success: false,
        message: 'Failed to analyze feedback. Please try again later.',
        error: error.message
      };
    }
  }

  /**
   * Get cached analysis for an NGO
   * @param {String} ngoId - NGO user ID
   * @returns {Object} Cached analysis or null
   */
  async getCachedAnalysis(ngoId) {
    try {
      const analysis = await FeedbackAnalysis.findOne({ ngoId });
      return analysis;
    } catch (error) {
      console.error('Error retrieving cached analysis:', error);
      return null;
    }
  }

  /**
   * Create analysis prompt for Gemini
   * @private
   */
  _createAnalysisPrompt(comments, feedbackDocs) {
    const averageRating = feedbackDocs.length > 0
      ? (feedbackDocs.reduce((sum, f) => sum + f.rating, 0) / feedbackDocs.length).toFixed(1)
      : 0;

    // Count 5-star ratings
    const fiveStarCount = feedbackDocs.filter(f => f.rating === 5).length;
    const fiveStarPercentage = feedbackDocs.length > 0
      ? ((fiveStarCount / feedbackDocs.length) * 100).toFixed(0)
      : 0;

    // Build feedback list based on what we have
    let feedbackSection = '';
    
    if (comments.length > 0) {
      // If we have comments, use them
      const feedbackList = comments
        .map((comment, i) => `${i + 1}. "${comment}"`)
        .join('\n');
      feedbackSection = `Feedback Comments (${comments.length} comments):
${feedbackList}`;
    } else {
      // If no comments, use ratings data
      feedbackSection = `Feedback Ratings (${feedbackDocs.length} ratings):
- Average Rating: ${averageRating}/5.0
- 5-star ratings: ${fiveStarCount} (${fiveStarPercentage}%)
- Total feedback count: ${feedbackDocs.length}
Note: These ratings represent donor/volunteer satisfaction without detailed written comments.`;
    }

    return `You are an expert feedback analyst. Analyze the following feedback from an NGO's donors and volunteers.

${feedbackSection}

Average Rating: ${averageRating}/5.0
Total Feedback Count: ${feedbackDocs.length}

Please provide:
1. Overall Sentiment (MUST be exactly one of: "Positive", "Neutral", or "Negative")
2. A brief summary (2-3 sentences)
3. Top 3 strengths (list each on a new line starting with "- ")
4. Top 3 areas for improvement (list each on a new line starting with "- ")

${comments.length === 0 ? 'Note: Since written comments are limited, focus your analysis on the ratings data provided.' : ''}

Format your response EXACTLY as follows:
SENTIMENT: [Positive/Neutral/Negative]
SUMMARY: [Your summary here]
STRENGTHS:
- [Strength 1]
- [Strength 2]
- [Strength 3]
IMPROVEMENTS:
- [Improvement 1]
- [Improvement 2]
- [Improvement 3]`;
  }

  /**
   * Parse Gemini response into structured data
   * @private
   */
  _parseGeminiResponse(responseText) {
    const result = {
      sentiment: 'Neutral',
      summary: '',
      strengths: [],
      improvements: []
    };

    try {
      // Extract sentiment
      const sentimentMatch = responseText.match(/SENTIMENT:\s*(Positive|Neutral|Negative)/i);
      if (sentimentMatch) {
        result.sentiment = sentimentMatch[1].charAt(0).toUpperCase() + sentimentMatch[1].slice(1).toLowerCase();
      }

      // Extract summary
      const summaryMatch = responseText.match(/SUMMARY:\s*(.+?)(?=STRENGTHS:|$)/is);
      if (summaryMatch) {
        result.summary = summaryMatch[1].trim().substring(0, 1000);
      }

      // Extract strengths
      const strengthsMatch = responseText.match(/STRENGTHS:([\s\S]*?)(?=IMPROVEMENTS:|$)/i);
      if (strengthsMatch) {
        const strengthsList = strengthsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 3);
        result.strengths = strengthsList;
      }

      // Extract improvements
      const improvementsMatch = responseText.match(/IMPROVEMENTS:([\s\S]*?)$/i);
      if (improvementsMatch) {
        const improvementsList = improvementsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 3);
        result.improvements = improvementsList;
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
    }

    return result;
  }

  /**
   * Check if analysis should be regenerated
   * @param {Date} lastAnalyzedAt - Last analysis timestamp
   * @param {Number} currentFeedbackCount - Current feedback count
   * @param {Number} storedFeedbackCount - Feedback count at last analysis
   * @returns {Boolean} Whether to regenerate
   */
  shouldRegenerate(lastAnalyzedAt, currentFeedbackCount, storedFeedbackCount) {
    if (!lastAnalyzedAt) return true;
    
    // Regenerate if feedback count changed by more than 10%
    const difference = Math.abs(currentFeedbackCount - storedFeedbackCount);
    const percentageChange = (difference / storedFeedbackCount) * 100;
    
    return percentageChange >= 10;
  }
}

module.exports = new FeedbackAnalysisService();
