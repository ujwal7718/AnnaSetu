const nodemailer = require('nodemailer');

// ─── Configuration diagnostics (logged once at module load) ──────────────────
// Prints what is and isn't configured WITHOUT ever printing the actual values.

const emailUser = process.env.EMAIL_USER || '';
const emailPass = process.env.EMAIL_PASS || '';
const emailHost = process.env.EMAIL_HOST || '';
const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
const emailFrom = process.env.EMAIL_FROM || '';

const isConfigured = !!(emailHost && emailUser && emailPass);

console.log('──────────────────────────────────────────');
console.log('📧 Email service configuration:');
console.log(`   EMAIL_HOST  : ${emailHost  || '❌ NOT SET'}`);
console.log(`   EMAIL_PORT  : ${emailPort}`);
console.log(`   EMAIL_USER  : ${emailUser  ? `✅ set (${emailUser})` : '❌ NOT SET'}`);
console.log(`   EMAIL_PASS  : ${emailPass  ? `✅ set (${emailPass.length} chars)` : '❌ NOT SET'}`);
console.log(`   EMAIL_FROM  : ${emailFrom  || '(will default to EMAIL_USER)'}`);
console.log(`   Status      : ${isConfigured ? '✅ Ready' : '⚠️  Not configured – emails will be skipped'}`);
console.log('──────────────────────────────────────────');

// ─── Transporter factory ──────────────────────────────────────────────────────

/**
 * Returns a configured Nodemailer transporter, or null if env vars are missing.
 *
 * Gmail notes:
 *  - Use an App Password, NOT your normal Gmail password.
 *  - App Passwords are 16 characters with NO spaces (strip spaces if you copy
 *    them from the Google account page).
 *  - 2-Step Verification must be enabled on the Google account first.
 *  - Generate one at: https://myaccount.google.com/apppasswords
 */
const createTransporter = () => {
  if (!isConfigured) {
    console.warn('⚠️  createTransporter: Email not configured (missing HOST/USER/PASS)');
    return null;
  }

  console.log('🔧 Creating Nodemailer transporter...');
  console.log('   Host:', emailHost);
  console.log('   Port:', emailPort);
  console.log('   Secure:', emailPort === 465);
  console.log('   User:', emailUser);

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    // port 465 → implicit TLS (secure:true), port 587 → STARTTLS (secure:false)
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      // Strip spaces — Google shows App Passwords as "xxxx xxxx xxxx xxxx"
      // but the actual value must have no spaces.
      pass: emailPass.replace(/\s/g, '')
    },
    tls: {
      // Do not fail on self-signed certs in development
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
};

// ─── Startup verification ─────────────────────────────────────────────────────

/**
 * Call this once at server startup to confirm SMTP credentials are accepted.
 * Logs success or a clear error — never prints the password.
 */
const verifyTransporter = async () => {
  if (!isConfigured) {
    console.warn('⚠️  Email transporter not verified: EMAIL_HOST / EMAIL_USER / EMAIL_PASS not set.');
    return false;
  }

  const transporter = createTransporter();

  try {
    console.log('🔍 DEBUG: Attempting transporter.verify()...');
    console.log('   EMAIL_HOST:', emailHost);
    console.log('   EMAIL_PORT:', emailPort);
    console.log('   EMAIL_USER:', emailUser);
    console.log('   EMAIL_PASS length:', emailPass.length);
    console.log('   EMAIL_PASS stripped (no spaces):', emailPass.replace(/\s/g, '').length);
    console.log('   Transporter config:', {
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465
    });
    
    await transporter.verify();
    console.log(`✅ Email transporter verified — ready to send from ${emailUser}`);
    return true;
  } catch (err) {
    console.error('🔍 DEBUG: Full error object:');
    console.error('   Code:', err.code);
    console.error('   Message:', err.message);
    console.error('   ResponseCode:', err.responseCode);
    console.error('   Response:', err.response);
    console.error('   Command:', err.command);
    
    // Decode the most common Gmail error codes into actionable messages
    let hint = '';

    if (err.responseCode === 535 || (err.message && err.message.includes('BadCredentials'))) {
      hint = [
        '',
        '  ╔══════════════════════════════════════════════════════════╗',
        '  ║  Gmail 535 – Username and Password Not Accepted          ║',
        '  ╠══════════════════════════════════════════════════════════╣',
        '  ║  Most likely cause: you are using your normal Gmail      ║',
        '  ║  password instead of a 16-character App Password.        ║',
        '  ║                                                          ║',
        '  ║  Fix:                                                    ║',
        '  ║  1. Enable 2-Step Verification on your Google account    ║',
        '  ║     → https://myaccount.google.com/security              ║',
        '  ║  2. Generate an App Password                             ║',
        '  ║     → https://myaccount.google.com/apppasswords          ║',
        '  ║     Select app: "Mail"  /  device: "Other"               ║',
        '  ║  3. Copy the 16-character password (no spaces)           ║',
        '  ║  4. Paste it as EMAIL_PASS in server/.env                ║',
        '  ║  5. Restart the server                                   ║',
        '  ╚══════════════════════════════════════════════════════════╝',
      ].join('\n');
    } else if (err.code === 'ECONNREFUSED') {
      hint = `\n  Hint: Could not connect to ${emailHost}:${emailPort}. Check EMAIL_HOST and EMAIL_PORT.`;
    } else if (err.code === 'ETIMEDOUT') {
      hint = `\n  Hint: Connection timed out. Your network may be blocking port ${emailPort}.`;
    } else if (err.message && err.message.includes('bad auth')) {
      hint = [
        '',
        '  ╔══════════════════════════════════════════════════════════╗',
        '  ║  SMTP "bad auth" Error                                   ║',
        '  ╠══════════════════════════════════════════════════════════╣',
        '  ║  Possible causes:                                        ║',
        '  ║  1. Gmail App Password contains spaces in .env file      ║',
        '  ║     → Copy fresh from Google account, paste WITHOUT      ║',
        '  ║     → spaces (we strip them, but verify in .env)         ║',
        '  ║  2. Normal Gmail password used instead of App Password   ║',
        '  ║  3. Gmail account has 2-Step Verification disabled       ║',
        '  ║  4. App Password has been revoked                        ║',
        '  ║                                                          ║',
        '  ║  Fix:                                                    ║',
        '  ║  1. Go to https://myaccount.google.com/apppasswords      ║',
        '  ║  2. Generate a fresh App Password for "Mail"             ║',
        '  ║  3. Copy EXACTLY as shown (16 chars, may show spaces)    ║',
        '  ║  4. Remove ALL spaces before pasting into .env           ║',
        '  ║     (e.g., "abcd efgh ijkl mnop" → "abcdefghijklmnop")   ║',
        '  ║  5. Restart server and test again                        ║',
        '  ╚══════════════════════════════════════════════════════════╝',
      ].join('\n');
    }

    console.error(`❌ Email transporter verification FAILED: ${err.message}${hint}`);
    return false;
  }
};

// ─── Send verification email ──────────────────────────────────────────────────

/**
 * @param {string} toEmail  – recipient address
 * @param {string} toName   – recipient display name
 * @param {string} token    – raw (unhashed) verification token
 */
const sendVerificationEmail = async (toEmail, toName, token) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`⚠️  Email service not configured – skipping verification email for: ${toEmail}`);
    return;
  }

  const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify your AnnaSetu account</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:12px;overflow:hidden;
                            box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#16a34a);
                             padding:40px 40px 30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;">
                      🌾 ANNASETU
                    </h1>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
                      Connecting surplus food with those in need
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 40px 30px;">
                    <h2 style="color:#1e293b;margin:0 0 16px;font-size:22px;">
                      Verify your email address
                    </h2>
                    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
                      Hi <strong>${toName}</strong>,<br/><br/>
                      Thanks for joining AnnaSetu! Click the button below to verify
                      your email address and activate your account.
                    </p>
                    <div style="text-align:center;margin:32px 0;">
                      <a href="${verifyUrl}"
                         style="display:inline-block;
                                background:linear-gradient(135deg,#2563eb,#16a34a);
                                color:#ffffff;text-decoration:none;padding:14px 36px;
                                border-radius:8px;font-weight:700;font-size:16px;">
                        ✅ Verify Email Address
                      </a>
                    </div>
                    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:24px 0 0;">
                      This link expires in <strong>24 hours</strong>.<br/>
                      If you did not create an account, you can safely ignore this email.
                    </p>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
                    <p style="color:#94a3b8;font-size:12px;">
                      Or paste this URL in your browser:<br/>
                      <span style="color:#2563eb;word-break:break-all;">${verifyUrl}</span>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;text-align:center;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                      © ${new Date().getFullYear()} AnnaSetu. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: emailFrom || `"AnnaSetu" <${emailUser}>`,
    to: toEmail,
    subject: '✅ Verify your AnnaSetu account',
    html
  });

  console.log(`📧 Verification email sent → ${toEmail}`);
};

// ─── Send password reset email ────────────────────────────────────────────────

/**
 * @param {string} toEmail  – recipient address
 * @param {string} toName   – recipient display name
 * @param {string} token    – raw (unhashed) password reset token
 */
const sendPasswordResetEmail = async (toEmail, toName, token) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`⚠️  Email service not configured – skipping password reset email for: ${toEmail}`);
    return;
  }

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset your AnnaSetu password</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:12px;overflow:hidden;
                            box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#16a34a);
                             padding:40px 40px 30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;">
                      🌾 ANNASETU
                    </h1>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
                      Connecting surplus food with those in need
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 40px 30px;">
                    <h2 style="color:#1e293b;margin:0 0 16px;font-size:22px;">
                      Reset your password
                    </h2>
                    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
                      Hi <strong>${toName}</strong>,<br/><br/>
                      We received a request to reset your AnnaSetu password. Click the button
                      below to set a new password for your account.
                    </p>
                    <div style="text-align:center;margin:32px 0;">
                      <a href="${resetUrl}"
                         style="display:inline-block;
                                background:linear-gradient(135deg,#2563eb,#16a34a);
                                color:#ffffff;text-decoration:none;padding:14px 36px;
                                border-radius:8px;font-weight:700;font-size:16px;">
                        🔐 Reset Password
                      </a>
                    </div>
                    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:24px 0 0;">
                      This link expires in <strong>1 hour</strong>.<br/>
                      If you did not request a password reset, you can safely ignore this email.
                      Your account is secure and your password has not changed.
                    </p>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
                    <p style="color:#94a3b8;font-size:12px;">
                      Or paste this URL in your browser:<br/>
                      <span style="color:#2563eb;word-break:break-all;">${resetUrl}</span>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;text-align:center;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                      © ${new Date().getFullYear()} AnnaSetu. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: emailFrom || `"AnnaSetu" <${emailUser}>`,
    to: toEmail,
    subject: '🔐 Reset your AnnaSetu password',
    html
  });

  console.log(`📧 Password reset email sent → ${toEmail}`);
};

// ─── Send pickup OTP email ───────────────────────────────────────────────────

/**
 * @param {string} toEmail  – recipient address (donor)
 * @param {string} toName   – recipient display name
 * @param {string} otp      – 6-digit OTP
 */
const sendPickupOTPEmail = async (toEmail, toName, otp) => {
  console.log('\n📧 ════════════════════════════════════════════════');
  console.log('📧 SENDING PICKUP OTP EMAIL');
  console.log('📧 ════════════════════════════════════════════════');
  console.log('📧 Recipient email:', toEmail);
  console.log('📧 Recipient name:', toName);
  console.log('📧 OTP:', otp);
  console.log('📧 Email configured:', isConfigured);
  console.log('📧 EMAIL_HOST:', emailHost);
  console.log('📧 EMAIL_USER:', emailUser);
  
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`❌ Email transporter NOT configured – cannot send OTP email to: ${toEmail}`);
    console.warn('❌ Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables');
    return;
  }

  console.log('✅ Email transporter created successfully');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your Food Pickup OTP - AnnaSetu</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 20px;">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#ffffff;border-radius:12px;overflow:hidden;
                            box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#16a34a);
                             padding:40px 40px 30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;">
                      🌾 ANNASETU
                    </h1>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">
                      Connecting surplus food with those in need
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:40px 40px 30px;">
                    <h2 style="color:#1e293b;margin:0 0 16px;font-size:22px;">
                      🍱 Food Pickup Verification
                    </h2>
                    <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
                      Hi <strong>${toName}</strong>,<br/><br/>
                      Your donation has been assigned to a volunteer. Please share the following
                      OTP <strong>ONLY</strong> when the volunteer arrives for pickup.
                    </p>
                    
                    <div style="text-align:center;margin:32px 0;padding:24px;
                                background:#f8fafc;border-radius:8px;border:2px solid #e2e8f0;">
                      <p style="color:#94a3b8;font-size:12px;margin:0 0 12px;font-weight:700;">
                        YOUR PICKUP OTP
                      </p>
                      <div style="font-size:48px;font-weight:800;color:#2563eb;
                                  letter-spacing:8px;font-family:'Courier New',monospace;">
                        ${otp}
                      </div>
                    </div>

                    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;
                                border-radius:6px;margin:24px 0;">
                      <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                        <strong>⚠️ Important:</strong> Never share this OTP with anyone other than
                        the volunteer assigned to pick up your donation. This OTP is valid for
                        <strong>30 minutes</strong>.
                      </p>
                    </div>

                    <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:24px 0 0;">
                      Thank you for supporting AnnaSetu and helping reduce food waste!
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;text-align:center;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;">
                      © ${new Date().getFullYear()} AnnaSetu. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    console.log('📤 Attempting to send email via transporter.sendMail()...');
    const info = await transporter.sendMail({
      from: emailFrom || `"AnnaSetu" <${emailUser}>`,
      to: toEmail,
      subject: '🍱 Your Food Pickup Verification OTP - AnnaSetu',
      html
    });
    
    console.log('✅ OTP email sent successfully!');
    console.log('✅ Message ID:', info.messageId);
    console.log('✅ Response:', info.response);
    console.log('📧 ════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ FAILED to send OTP email');
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error response:', error.response);
    console.error('❌ Full error:', error);
    console.error('📧 ════════════════════════════════════════════════\n');
    throw error; // Re-throw so calling code can catch it
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendPickupOTPEmail, verifyTransporter };
