require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const OTP_EXPIRY_MS = (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

// POST /send-otp
// Body: { email }
app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  otpStore.set(email, { otp, expiresAt });

  try {
    await transporter.sendMail({
      from: `"CreditShield KYC" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your CreditShield KYC Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a1a2e;">CreditShield KYC Verification</h2>
          <p>Your One-Time Password (OTP) for Aadhaar KYC verification is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #00c853; text-align: center; padding: 16px 0;">
            ${otp}
          </div>
          <p style="color: #666;">This OTP is valid for <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.</p>
          <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`OTP sent to ${email}: ${otp}`);
    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
    return res.status(500).json({ error: 'Failed to send OTP email', detail: err.message });
  }
});

// POST /verify-otp
// Body: { email, otp }
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'email and otp are required' });
  }

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ valid: false, error: 'No OTP found for this email. Please request a new one.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ valid: false, error: 'OTP has expired. Please request a new one.' });
  }

  if (record.otp !== otp.toString()) {
    return res.status(400).json({ valid: false, error: 'Invalid OTP. Please try again.' });
  }

  otpStore.delete(email);
  return res.json({ valid: true, message: 'OTP verified successfully' });
});

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`OTP service running on http://localhost:${PORT}`);
});
