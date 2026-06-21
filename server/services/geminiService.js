const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  GEMINI_API_KEY not found in environment variables - Chatbot will use fallback responses');
        return;
      }

      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      console.log(
  "Gemini Key:",
  process.env.GEMINI_API_KEY?.substring(0, 15)
);
console.log("Gemini Model:", "gemini-2.5-flash");
      console.log('✅ Gemini AI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI service:', error.message);
      console.warn('⚠️  Chatbot will use fallback responses');
    }
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      if (!this.model) {
        throw new Error('Gemini AI model not initialized');
      }

      // System prompt for AnnaSetu Assistant
      const systemPrompt = `You are AnnaSetu Assistant.

AnnaSetu is an online food donation platform connecting donors, NGOs, and volunteers.

Help users:
- Donate food
- Register NGOs
- Become volunteers
- Understand donation workflows
- Track donation statuses
- Understand platform features

Keep responses concise, accurate, and helpful.
Do not provide information unrelated to AnnaSetu unless explicitly asked.`;

      // Build conversation context
      let conversationContext = systemPrompt + '\n\n';
      
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
          conversationContext += `${msg.role}: ${msg.content}\n`;
        });
      }
      
      conversationContext += `user: ${userMessage}\nassistant:`;
console.log("Sending Gemini request...");
      // Generate response
      const result = await this.model.generateContent(conversationContext);
      const response = result.response.text();

      return {
        success: true,
        response: response.trim(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error generating AI response:', error.message);
      
      // Return appropriate error response
      return {
        success: false,
        error: error.message,
        fallbackResponse: this.getFallbackResponse(userMessage)
      };
    }
  }

  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('donate') || lowerMessage.includes('donation')) {
      return "To donate food, log in as a donor and click 'Post Donation' on your dashboard. You'll need to provide food type, quantity, pickup location, and time.";
    } else if (lowerMessage.includes('volunteer') || lowerMessage.includes('volunteering')) {
      return "To become a volunteer, register as a volunteer on our platform. You'll receive notifications for available food donations in your area.";
    } else if (lowerMessage.includes('ngo') || lowerMessage.includes('organization')) {
      return "NGOs can register on AnnaSetu to receive food donations and coordinate with volunteers for distribution.";
    } else if (lowerMessage.includes('track') || lowerMessage.includes('status')) {
      return "You can track your donation status on your dashboard. Donations go through stages: pending → assigned → picked up → delivered.";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help with AnnaSetu platform questions. Ask me about donating, volunteering, NGO registration, or tracking donations.";
    } else {
      return "I'm the AnnaSetu Assistant. I can help you with food donations, volunteering, NGO registration, and tracking donations. How can I assist you today?";
    }
  }

  isServiceReady() {
    return this.model !== null && process.env.GEMINI_API_KEY !== undefined;
  }
}

// Export singleton instance
module.exports = new GeminiService();
