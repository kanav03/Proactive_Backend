const express = require('express');
const router = express.Router();
const formController = require('../controllers/form.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get all forms (admin only)
router.get('/all', authMiddleware.protect, authMiddleware.restrictTo('admin'), formController.getAllForms);

// Get user's forms
router.get('/', authMiddleware.protect, formController.getUserForms);

// Create a new form
router.post('/', authMiddleware.protect, formController.createForm);

// Get a form by ID
router.get('/:id', authMiddleware.protect, formController.getFormById);

// Update a form
router.put('/:id', authMiddleware.protect, formController.updateForm);

// Delete a form
router.delete('/:id', authMiddleware.protect, formController.deleteForm);

// Get form by share link (public)
router.get('/share/:shareLink', formController.getFormByShareLink);

module.exports = router; 