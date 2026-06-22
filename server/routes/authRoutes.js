// server/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authProfileController = require('../controllers/authProfileController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Forgot Password / OTP / Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp',      authController.verifyOtp);
router.post('/reset-password',  authController.resetPassword);

// Profile
router.get('/profile',                 authenticateToken, authProfileController.getProfile);
router.put('/profile',                 authenticateToken, authProfileController.updateProfile);
router.put('/profile/change-password', authenticateToken, authProfileController.changePassword);

module.exports = router;