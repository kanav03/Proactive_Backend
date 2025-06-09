const express = require('express');
const router = express.Router();
const responseController = require('../controllers/response.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Create or join a form response
router.post('/:formId/join', authMiddleware.protect, responseController.joinFormResponse);

// Get a form response by ID
router.get('/:id', authMiddleware.protect, responseController.getResponseById);

// Update a field value in a form response
router.put('/:id/field/:fieldId', authMiddleware.protect, responseController.updateFieldValue);

// Get all responses for a form (admin or form creator)
router.get('/form/:formId', authMiddleware.protect, responseController.getFormResponses);

// Mark a form response as complete
router.put('/:id/complete', authMiddleware.protect, responseController.markResponseComplete);

module.exports = router; 