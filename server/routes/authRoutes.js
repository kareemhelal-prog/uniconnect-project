// server/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const authProfileController = require('../controllers/authProfileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter, otpRequestLimiter, otpVerifyLimiter } = require('../middleware/rateLimiters');

// Auth
router.post('/register', authLimiter, authController.register);
router.post('/login',    authLimiter, authController.login);
router.post('/complete-registration', authenticateToken, authController.completeRegistration);
router.post('/onboarding-complete',    authenticateToken, authController.completeOnboarding);

// Google OAuth
router.post('/google',         authLimiter, googleAuthController.googleLogin);          // login / register
router.post('/google/reset',   authLimiter, googleAuthController.googleResetPassword);  // forgot-password via Google
router.post('/google/link',    authenticateToken, googleAuthController.googleLink);
router.post('/google/unlink',  authenticateToken, googleAuthController.googleUnlink);
router.get('/google/status',   authenticateToken, googleAuthController.googleStatus);

// Forgot Password / OTP / Reset
router.post('/forgot-password', otpRequestLimiter, authController.forgotPassword);
router.post('/verify-otp',      otpVerifyLimiter,  authController.verifyOtp);
router.post('/reset-password',  otpVerifyLimiter,  authController.resetPassword);

// Profile
router.get('/profile',                 authenticateToken, authProfileController.getProfile);
router.put('/profile',                 authenticateToken, authProfileController.updateProfile);
router.put('/profile/change-password', authenticateToken, authProfileController.changePassword);

module.exports = router;