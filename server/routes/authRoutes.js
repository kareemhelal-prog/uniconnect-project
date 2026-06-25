// server/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const authProfileController = require('../controllers/authProfileController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Auth
router.post('/register', authController.register);
router.post('/login',    authController.login);

// Google OAuth
router.post('/google',         googleAuthController.googleLogin);          // login / register
router.post('/google/reset',   googleAuthController.googleResetPassword);  // forgot-password via Google
router.post('/google/link',    authenticateToken, googleAuthController.googleLink);
router.post('/google/unlink',  authenticateToken, googleAuthController.googleUnlink);
router.get('/google/status',   authenticateToken, googleAuthController.googleStatus);

// Forgot Password / OTP / Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp',      authController.verifyOtp);
router.post('/reset-password',  authController.resetPassword);

// Profile
router.get('/profile',                 authenticateToken, authProfileController.getProfile);
router.put('/profile',                 authenticateToken, authProfileController.updateProfile);
router.put('/profile/change-password', authenticateToken, authProfileController.changePassword);

module.exports = router;