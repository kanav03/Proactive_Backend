const FormResponse = require('../models/response.model');
const Form = require('../models/form.model');

// Join a form response (create or join existing)
exports.joinFormResponse = async (req, res) => {
  try {
    const formId = req.params.formId;
    
    // Check if form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ 
        success: false, 
        message: 'Form not found' 
      });
    }
    
    // Check if form is active
    if (!form.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Form is not active' 
      });
    }
    
    // Check if a response already exists for this form
    let response = await FormResponse.findOne({ form: formId });
    
    if (!response) {
      // Create a new response
      response = await FormResponse.create({
        form: formId,
        fieldValues: form.fields.map(field => ({
          fieldId: field.fieldId,
          value: null,
          lastUpdatedBy: req.user._id
        })),
        collaborators: [{
          user: req.user._id,
          joinedAt: Date.now(),
          isActive: true
        }]
      });
    } else {
      // Check if user is already a collaborator
      const isCollaborator = response.collaborators.some(
        collab => collab.user.toString() === req.user._id.toString()
      );
      
      if (!isCollaborator) {
        // Add user as collaborator
        response.collaborators.push({
          user: req.user._id,
          joinedAt: Date.now(),
          isActive: true
        });
        
        await response.save();
      } else {
        // Update existing collaborator to active
        const collaboratorIndex = response.collaborators.findIndex(
          collab => collab.user.toString() === req.user._id.toString()
        );
        
        if (collaboratorIndex !== -1) {
          response.collaborators[collaboratorIndex].isActive = true;
          await response.save();
        }
      }
    }
    
    // Populate response with form data and collaborators
    response = await FormResponse.findById(response._id)
      .populate('form')
      .populate('collaborators.user', 'username email');
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get a form response by ID
exports.getResponseById = async (req, res) => {
  try {
    const response = await FormResponse.findById(req.params.id)
      .populate('form')
      .populate('collaborators.user', 'username email')
      .populate('fieldValues.lastUpdatedBy', 'username email');
    
    if (!response) {
      return res.status(404).json({ 
        success: false, 
        message: 'Response not found' 
      });
    }
    
    // Check if user is a collaborator
    const isCollaborator = response.collaborators.some(
      collab => collab.user._id.toString() === req.user._id.toString()
    );
    
    // Check if user is form creator
    const isCreator = response.form.creator.toString() === req.user._id.toString();
    
    // Check if user is admin
    const isAdmin = req.user.role === 'admin';
    
    if (!isCollaborator && !isCreator && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this response' 
      });
    }
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update a field value in a form response
exports.updateFieldValue = async (req, res) => {
  try {
    const { value } = req.body;
    const responseId = req.params.id;
    const fieldId = req.params.fieldId;
    
    let response = await FormResponse.findById(responseId);
    
    if (!response) {
      return res.status(404).json({ 
        success: false, 
        message: 'Response not found' 
      });
    }
    
    // Check if user is a collaborator
    const isCollaborator = response.collaborators.some(
      collab => collab.user.toString() === req.user._id.toString() && collab.isActive
    );
    
    if (!isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this response' 
      });
    }
    
    // Check if response is complete
    if (response.isComplete) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot update a completed response' 
      });
    }
    
    // Find the field value to update
    const fieldValueIndex = response.fieldValues.findIndex(
      fieldValue => fieldValue.fieldId === fieldId
    );
    
    if (fieldValueIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Field not found in response' 
      });
    }
    
    // Update the field value
    response.fieldValues[fieldValueIndex].value = value;
    response.fieldValues[fieldValueIndex].lastUpdatedBy = req.user._id;
    response.fieldValues[fieldValueIndex].lastUpdatedAt = Date.now();
    
    // Save the response
    await response.save();
    
    // Get updated response
    response = await FormResponse.findById(responseId)
      .populate('fieldValues.lastUpdatedBy', 'username email');
    
    // Return only the updated field
    const updatedField = response.fieldValues.find(field => field.fieldId === fieldId);
    
    res.json({
      success: true,
      data: updatedField
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all responses for a form
exports.getFormResponses = async (req, res) => {
  try {
    const formId = req.params.formId;
    
    // Check if form exists
    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ 
        success: false, 
        message: 'Form not found' 
      });
    }
    
    // Check if user is form creator or admin
    if (form.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access these responses' 
      });
    }
    
    // Get all responses for the form
    const responses = await FormResponse.find({ form: formId })
      .populate('collaborators.user', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: responses.length,
      data: responses
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Mark a form response as complete
exports.markResponseComplete = async (req, res) => {
  try {
    const responseId = req.params.id;
    
    let response = await FormResponse.findById(responseId);
    
    if (!response) {
      return res.status(404).json({ 
        success: false, 
        message: 'Response not found' 
      });
    }
    
    // Check if user is a collaborator
    const isCollaborator = response.collaborators.some(
      collab => collab.user.toString() === req.user._id.toString() && collab.isActive
    );
    
    if (!isCollaborator) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this response' 
      });
    }
    
    // Mark as complete
    response.isComplete = true;
    response.updatedAt = Date.now();
    
    await response.save();
    
    res.json({
      success: true,
      message: 'Response marked as complete',
      data: response
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
}; 