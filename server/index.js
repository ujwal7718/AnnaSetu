const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Startup validation for required environment variables
const requiredEnvVars = ['MONGODB_URI', 'PORT', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file in the server directory');
  process.exit(1);
}

// Optional: Warn about missing GEMINI_API_KEY but don't fail
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found - Chatbot features will be disabled');
} else {
  console.log('✅ GEMINI_API_KEY found - Chatbot features enabled');
}

console.log('✅ Environment variables validated successfully');

// Import socket configuration
const { initializeSocket, emitDonationCreated } = require('./socket');

// Email service (imported here so its config diagnostics print at startup)
const { verifyTransporter } = require('./services/emailService');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded images with absolute path

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5001,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Email configuration debug endpoint (dev only)
app.get('/debug/email-config', (req, res) => {
  const emailHost = process.env.EMAIL_HOST || '';
  const emailUser = process.env.EMAIL_USER || '';
  const emailPass = process.env.EMAIL_PASS || '';
  const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const emailFrom = process.env.EMAIL_FROM || '';
  
  const isConfigured = !!(emailHost && emailUser && emailPass);
  
  res.status(200).json({
    debug: 'Email Configuration Status',
    timestamp: new Date().toISOString(),
    configured: isConfigured,
    details: {
      EMAIL_HOST: emailHost ? '✅ SET' : '❌ NOT SET',
      EMAIL_PORT: emailPort,
      EMAIL_USER: emailUser ? `✅ SET (${emailUser})` : '❌ NOT SET',
      EMAIL_PASS: emailPass ? `✅ SET (${emailPass.length} characters)` : '❌ NOT SET',
      EMAIL_FROM: emailFrom ? `SET (${emailFrom})` : `Will default to: ${emailUser}`,
    },
    hints: {
      isGmail: emailHost?.includes('gmail.com'),
      reminder: isConfigured ? 'Configuration looks good!' : 'Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in server/.env'
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ngo', require('./routes/ngo'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/feedback-analysis', require('./routes/feedbackAnalysis'));
app.use('/api/test', require('./routes/test')); // Development test/diagnostic routes

// Graceful shutdown handler
let isShuttingDown = false;
const gracefulShutdown = async (server) => {
  if (isShuttingDown) {
    console.log('⚠️ Shutdown already in progress, ignoring duplicate signal');
    return;
  }
  
  isShuttingDown = true;
  console.log('\n🛑 Received shutdown signal, closing server gracefully...');
  
  try {
    // Close server first
    await new Promise((resolve) => {
      server.close(resolve);
    });
    console.log('✅ Server closed successfully');
    
    // Close MongoDB connection using modern syntax
    if (mongoose.connection.readyState === 1) { // 1 = connected
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

// Single server instance - global to prevent duplicates
let serverInstance = null;

// Setup signal handlers once (outside initializeServer)
const setupSignalHandlers = () => {
  // Remove existing handlers to prevent duplicates
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  
  // Add new handlers
  process.on('SIGINT', () => gracefulShutdown(serverInstance));
  process.on('SIGTERM', () => gracefulShutdown(serverInstance));
};

// Initialize and start server
const initializeServer = async () => {
  const PORT = process.env.PORT || 5001;
  
  try {
    // Connect to MongoDB first
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Verify email transporter credentials (non-fatal — server still starts)
    console.log('📧 Verifying email transporter...');
    try {
      await verifyTransporter();
    } catch (emailError) {
      console.warn('⚠️ Email transporter verification threw an error (non-fatal):', emailError.message);
    }
    console.log('✅ Email verification check complete');

    // Start server only once
    if (serverInstance) {
      console.log('⚠️ Server instance already exists, skipping...');
      return serverInstance;
    }

    serverInstance = server.listen(PORT, () => {
      console.log(`🚀 Server running successfully on port ${PORT}`);
      console.log(`🌐 Access at: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.io initialized for real-time notifications`);
    });

    // Initialize Socket.io
    initializeSocket(server);

    // Setup graceful shutdown handlers
    setupSignalHandlers();

    return serverInstance;

  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.error(`🔧 Solutions:`);
      console.error(`   1. Kill process using port ${PORT}:`);
      console.error(`      lsof -ti:${PORT} | xargs kill -9`);
      console.error(`   2. Use different port:`);
      console.error(`      PORT=${PORT + 1} npm start`);
      console.error(`   3. Set environment variable:`);
      console.error(`      PORT=5002 npm start`);
    } else if (error.name === 'MongooseServerSelectionError') {
      console.error('❌ MongoDB connection failed:', error.message);
    } else {
      console.error('❌ Server error:', error.message);
    }
    process.exit(1);
  }
};

// Start the server
console.log('🚀 Starting initialization...');
initializeServer().then(() => {
  console.log('✅ Initialization complete');
}).catch((err) => {
  console.error('❌ Initialization failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = app;
