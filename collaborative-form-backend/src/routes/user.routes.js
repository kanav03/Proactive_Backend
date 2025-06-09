const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get all users (admin only)
router.get('/', authMiddleware.protect, authMiddleware.restrictTo('admin'), userController.getAllUsers);

module.exports = router; 