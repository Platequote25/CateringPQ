const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Caterer = require('../models/Caterer');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const PasswordResetOTP = require('../models/PasswordResetOTP');

// @desc    Register a caterer
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { businessName, email, password } = req.body;
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be a string.'
    });
  }

  try {
    // Check if caterer already exists
    let caterer = await Caterer.findOne({ email });

    if (caterer) {
      return res.status(400).json({
        success: false,
        message: 'Caterer already exists'
      });
    }

    // Create catererID
    const catererID = `CAT_${Date.now()}`;

    // Create new caterer
    caterer = new Caterer({
      catererID,
      businessName,
      email,
      password
    });

    await caterer.save();

    // Create JWT payload
    const payload = {
      catererID: caterer.catererID,
      businessName: caterer.businessName
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          success: true,
          token,
          caterer: {
            catererID: caterer.catererID,
            businessName: caterer.businessName,
            email: caterer.email
          }
        });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Authenticate caterer & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be a string.'
    });
  }

  try {
    // Check if caterer exists
    let caterer = await Caterer.findOne({ email }).select('+password');
    console.log('Login attempt - Found caterer:', { 
      email: caterer?.email,
      hasPassword: !!caterer?.password,
      passwordLength: caterer?.password?.length
    });

    if (!caterer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    console.log('Login attempt - Comparing passwords:', {
      providedPasswordLength: password?.length,
      storedPasswordLength: caterer.password?.length
    });
    const isMatch = await caterer.comparePassword(password);
    console.log('Login attempt - Password match result:', isMatch);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT payload
    const payload = {
      catererID: caterer.catererID,
      businessName: caterer.businessName
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        console.log(token);
        console.log(caterer);
        res.json({
          success: true,
          token,
          caterer: {
            catererID: caterer.catererID,
            businessName: caterer.businessName,
            email: caterer.email
          }
        });
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get current caterer
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });

    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    res.json({
      success: true,
      caterer
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'abhilashbanda7@gmail.com',
    pass: 'dbsw azmz uzhk vdzw',
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for forgot password
exports.sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const caterer = await Caterer.findOne({ email });
    if (!caterer) return res.status(404).json({ success: false, message: 'No account found with this email address' });

    // Rate limit: max 3 OTPs/hour/email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await PasswordResetOTP.countDocuments({ email, createdAt: { $gte: oneHourAgo } });
    if (recentOtps >=3) return res.status(429).json({ success: false, message: 'Too many OTP requests. Try again later.' });

    // Generate and store OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 min
    await PasswordResetOTP.create({ email, otp, expiresAt });

    // Send email
    const mailOptions = {
      from: 'Catering abhilashbanda7@gmail.com',
      to: email,
      subject: 'Password Reset OTP - Catering',
      text: `Dear ${caterer.businessName},\n\nYou have requested to reset your password for your Catering account.\n\nYour OTP for password reset is: ${otp}\n\nThis OTP is valid for 2 minutes only. Please do not share this OTP with anyone.\n\nIf you did not request this password reset, please ignore this email.\n\nBest regards,\nTeam Catering`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent successfully to your email address' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

// Verify OTP
exports.verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    const record = await PasswordResetOTP.findOne({ email, otp, isUsed: false });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid OTP. Please request a new one.' });
    if (new Date() > record.expiresAt) {
      await PasswordResetOTP.deleteMany({ email });
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    // Mark OTP as used
    record.isUsed = true;
    await record.save();
    // Return a simple verification token (could be a JWT or just a flag)
    res.json({ success: true, message: 'OTP verified successfully. You can now reset your password.' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP. Please try again.' });
  }
};

// Reset password
exports.resetForgotPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;
    if (!email || !otp || !newPassword || !confirmPassword) return res.status(400).json({ success: false, message: 'All fields are required' });
    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    const record = await PasswordResetOTP.findOne({ email, otp, isUsed: true });
    if (!record) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    if (new Date() > record.expiresAt) return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    // Update password
    const caterer = await Caterer.findOne({ email });
    if (!caterer) return res.status(404).json({ success: false, message: 'No account found with this email address' });
    caterer.password = newPassword;
    await caterer.save();
    // Clean up OTPs
    await PasswordResetOTP.deleteMany({ email });
    res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
}; 