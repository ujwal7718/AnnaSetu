const rateLimit = require('express-rate-limit');

// ── Chatbot ──────────────────────────────────────────────────────────────────
const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Maximum 30 requests per 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

// Stricter chatbot limiter for production
const productionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  }
});

// ── Registration: 5 accounts per IP per hour ─────────────────────────────────
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many registration attempts from this IP. Please try again after 1 hour.'
    });
  }
});

// ── Login Rate Limiters ──────────────────────────────────────────────────────
// Development: relaxed limits for testing (100 attempts per 15 minutes)
const devLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Much higher for development testing
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    });
  }
});

// Production: strict limits for security (10 attempts per 15 minutes)
const prodLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict for production security
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    });
  }
});

// Environment-aware login rate limiter
const loginRateLimiter = process.env.NODE_ENV === 'production' 
  ? prodLoginRateLimiter 
  : devLoginRateLimiter;

// Environment-aware registration rate limiter (also relaxed for development)
const devRegisterRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Higher for development
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many registration attempts from this IP. Please try again after 1 hour.'
    });
  }
});

// Use environment-aware registration limiter
const finalRegisterRateLimiter = process.env.NODE_ENV === 'production'
  ? registerRateLimiter
  : devRegisterRateLimiter;

module.exports = {
  chatRateLimiter,
  productionRateLimiter,
  registerRateLimiter: finalRegisterRateLimiter,
  loginRateLimiter,
  // Export individual limiters for testing/debugging
  devLoginRateLimiter,
  prodLoginRateLimiter,
  devRegisterRateLimiter
};
