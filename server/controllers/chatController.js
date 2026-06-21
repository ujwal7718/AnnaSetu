const geminiService = require('../services/geminiService');

class ChatController {
  async handleChat(req, res) {
    try {
      const { message, conversationHistory } = req.body;

      // Validate request
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required and must be a string'
        });
      }

      if (message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Message cannot be empty'
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Message too long (max 1000 characters)'
        });
      }

      // Check if Gemini service is ready
      if (!geminiService.isServiceReady()) {
        return res.status(503).json({
          success: false,
          error: 'AI service not available. Please contact administrator.'
        });
      }

      // Generate AI response
      const result = await geminiService.generateResponse(message, conversationHistory);

      if (result.success) {
        return res.status(200).json({
          success: true,
          response: result.response,
          timestamp: result.timestamp
        });
      } else {
        // Return fallback response if AI fails
        return res.status(200).json({
          success: true,
          response: result.fallbackResponse,
          fallback: true,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Chat controller error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        fallbackResponse: 'I apologize, but I encountered an error. Please try again or contact support.'
      });
    }
  }

  async getHealth(req, res) {
    try {
      const isReady = geminiService.isServiceReady();
      
      return res.status(200).json({
        success: true,
        service: 'AnnaSetu AI Chatbot',
        status: isReady ? 'operational' : 'not configured',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  }
}

module.exports = new ChatController();
