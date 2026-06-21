/**
 * Test & Diagnostic Routes
 * 
 * These routes are for development/debugging purposes only.
 * They allow manual testing of OTP email functionality.
 * 
 * Routes:
 * - GET  /api/test/health              - Server health check
 * - GET  /api/test/email-config        - Email configuration status
 * - POST /api/test/send-test-otp-email - Send a test OTP email
 * - GET  /api/test/diagnostics         - Full system diagnostics
 */

const express = require('express');
const router = express.Router();
const { sendPickupOTPEmail, sendVerificationEmail, verifyTransporter } = require('../services/emailService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/test/health
// Check if server is running
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/test/email-config
// Check email configuration
// ─────────────────────────────────────────────────────────────────────────────
router.get('/email-config', (req, res) => {
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
      EMAIL_HOST: emailHost ? `✅ SET (${emailHost})` : '❌ NOT SET',
      EMAIL_PORT: `${emailPort} (${emailPort === 465 ? 'SSL/TLS' : 'STARTTLS'})`,
      EMAIL_USER: emailUser ? `✅ SET (${emailUser})` : '❌ NOT SET',
      EMAIL_PASS: emailPass ? `✅ SET (${emailPass.length} characters, no spaces: ${!emailPass.includes(' ')})` : '❌ NOT SET',
      EMAIL_FROM: emailFrom ? `✅ SET (${emailFrom})` : '❌ Will use EMAIL_USER',
      NODE_ENV: process.env.NODE_ENV || 'development',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
    },
    hints: {
      isGmail: emailHost?.includes('gmail.com'),
      appPasswordUsed: !emailPass?.includes(' ') && emailPass?.length === 16,
      tlsCorrectlySet: emailPort === 587 && !emailPass?.includes(' ')
    },
    status: isConfigured ? 'Configuration looks good! ✅' : 'Configuration incomplete ❌'
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/test/send-test-otp-email
// Manually send a test OTP email
// 
// Body:
// {
//   "recipientEmail": "test@example.com",
//   "recipientName": "Test User",
//   "otp": "123456"
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-test-otp-email', async (req, res) => {
  try {
    const { recipientEmail, recipientName, otp } = req.body;
    
    // Validate input
    if (!recipientEmail || !recipientName || !otp) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['recipientEmail', 'recipientName', 'otp']
      });
    }
    
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(recipientEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }
    
    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('🧪 TEST OTP EMAIL SENDING');
    console.log('════════════════════════════════════════════════════════');
    console.log('📧 Recipient Email:', recipientEmail);
    console.log('📧 Recipient Name:', recipientName);
    console.log('📧 OTP:', otp);
    console.log('🕐 Timestamp:', new Date().toISOString());
    
    // Attempt to send email
    console.log('\n📤 Calling sendPickupOTPEmail()...');
    await sendPickupOTPEmail(recipientEmail, recipientName, otp);
    
    console.log('\n✅ TEST COMPLETE: Email sending succeeded!');
    console.log('════════════════════════════════════════════════════════\n');
    
    return res.status(200).json({
      success: true,
      message: 'Test OTP email sent successfully',
      sent: {
        to: recipientEmail,
        otp: otp,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.log('\n❌ TEST FAILED: Email sending failed!');
    console.error('Error:', error.message);
    console.log('════════════════════════════════════════════════════════\n');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send test OTP email',
      error: {
        code: error.code,
        message: error.message,
        response: error.response
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/test/send-verification-email
// Manually send a test verification email
// 
// Body:
// {
//   "recipientEmail": "test@example.com",
//   "recipientName": "Test User",
//   "token": "test-token-12345"
// }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send-verification-email', async (req, res) => {
  try {
    const { recipientEmail, recipientName, token } = req.body;
    
    // Validate input
    if (!recipientEmail || !recipientName || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['recipientEmail', 'recipientName', 'token']
      });
    }
    
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(recipientEmail)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }
    
    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('🧪 TEST VERIFICATION EMAIL SENDING');
    console.log('════════════════════════════════════════════════════════');
    console.log('📧 Recipient Email:', recipientEmail);
    console.log('📧 Recipient Name:', recipientName);
    console.log('📧 Token:', token);
    console.log('🕐 Timestamp:', new Date().toISOString());
    
    // Attempt to send email
    console.log('\n📤 Calling sendVerificationEmail()...');
    await sendVerificationEmail(recipientEmail, recipientName, token);
    
    console.log('\n✅ TEST COMPLETE: Verification email sent successfully!');
    console.log('════════════════════════════════════════════════════════\n');
    
    return res.status(200).json({
      success: true,
      message: 'Test verification email sent successfully',
      sent: {
        to: recipientEmail,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.log('\n❌ TEST FAILED: Verification email sending failed!');
    console.error('Error:', error.message);
    console.log('════════════════════════════════════════════════════════\n');
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send test verification email',
      error: {
        code: error.code,
        message: error.message,
        response: error.response
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/test/verify-transporter
// Verify email transporter can connect to SMTP server
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify-transporter', async (req, res) => {
  try {
    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('🧪 TEST: TRANSPORTER VERIFICATION');
    console.log('════════════════════════════════════════════════════════');
    
    const result = await verifyTransporter();
    
    if (result) {
      console.log('✅ Transporter verification passed!');
      console.log('════════════════════════════════════════════════════════\n');
      
      return res.status(200).json({
        success: true,
        message: 'Email transporter verification successful',
        verified: true,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Transporter verification failed!');
      console.log('════════════════════════════════════════════════════════\n');
      
      return res.status(500).json({
        success: false,
        message: 'Email transporter verification failed - check server logs for details',
        verified: false,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.log('❌ Error during transporter verification!');
    console.error('Error:', error.message);
    console.log('════════════════════════════════════════════════════════\n');
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying email transporter',
      error: {
        code: error.code,
        message: error.message
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/test/diagnostics
// Full system diagnostics
// ─────────────────────────────────────────────────────────────────────────────
router.get('/diagnostics', (req, res) => {
  const emailHost = process.env.EMAIL_HOST || '';
  const emailUser = process.env.EMAIL_USER || '';
  const emailPass = process.env.EMAIL_PASS || '';
  const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const emailFrom = process.env.EMAIL_FROM || '';
  const mongoUri = process.env.MONGODB_URI || '';
  
  const isEmailConfigured = !!(emailHost && emailUser && emailPass);
  const isMongoConfigured = !!mongoUri;
  
  res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || 5001,
      MONGODB_CONFIGURED: isMongoConfigured ? '✅' : '❌',
      EMAIL_CONFIGURED: isEmailConfigured ? '✅' : '❌'
    },
    email: {
      EMAIL_HOST: emailHost ? `✅ ${emailHost}` : '❌ NOT SET',
      EMAIL_PORT: `${emailPort} (${emailPort === 465 ? 'SSL/TLS' : emailPort === 587 ? 'STARTTLS' : 'UNKNOWN'})`,
      EMAIL_USER: emailUser ? `✅ ${emailUser}` : '❌ NOT SET',
      EMAIL_PASS: emailPass ? `✅ (${emailPass.length} chars, spaces: ${emailPass.includes(' ') ? 'YES ⚠️' : 'NO ✅'})` : '❌ NOT SET',
      EMAIL_FROM: emailFrom ? `✅ ${emailFrom}` : `⚠️ Will use ${emailUser}`,
      gmailAppPassword: emailPass?.length === 16 && !emailPass.includes(' ') ? '✅ Looks correct' : '⚠️ Check format'
    },
    frontend: {
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
      REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL || 'http://localhost:5001'
    },
    testEndpoints: {
      'GET /api/test/health': 'Check server status',
      'GET /api/test/email-config': 'View email configuration',
      'GET /api/test/verify-transporter': 'Test SMTP connection',
      'POST /api/test/send-test-otp-email': 'Send test OTP (body: {recipientEmail, recipientName, otp})',
      'POST /api/test/send-verification-email': 'Send test verification email (body: {recipientEmail, recipientName, token})',
      'GET /api/test/diagnostics': 'Show this diagnostics page'
    },
    recommendations: isEmailConfigured ? 
      ['✅ Email appears configured. Test with /api/test/send-test-otp-email'] : 
      ['❌ Email not configured. Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in server/.env']
  });
});

module.exports = router;
