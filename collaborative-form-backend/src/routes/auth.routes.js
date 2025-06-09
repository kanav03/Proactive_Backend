const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get current user profile
router.get('/me', authMiddleware.protect, authController.getCurrentUser);

// Promote user to admin (admin only)
router.put('/promote/:userId', authMiddleware.protect, authMiddleware.restrictTo('admin'), authController.promoteUser);

module.exports = router; 