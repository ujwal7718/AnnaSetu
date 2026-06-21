const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { chatRateLimiter } = require('../middleware/rateLimiter');

// POST /api/chat - Handle chatbot messages
router.post('/', chatRateLimiter, chatController.handleChat);

// GET /api/chat/health - Check chatbot service health
router.get('/health', chatController.getHealth);

module.exports = router;
