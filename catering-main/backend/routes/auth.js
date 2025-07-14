const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { register, login, getMe, sendForgotPasswordOTP, verifyForgotPasswordOTP, resetForgotPassword } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a caterer
// @access  Public
router.post('/register', [
  body('businessName').trim().not().isEmpty().withMessage('Business name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

// @route   POST /api/auth/login
// @desc    Authenticate caterer & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
], login);

// @route   GET /api/auth/me
// @desc    Get current caterer
// @access  Private
router.get('/me', authMiddleware, getMe);

router.post('/forgot-password/send-otp', sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOTP);
router.post('/forgot-password/reset-password', resetForgotPassword);

module.exports = router; 