const Form = require('../models/form.model');

// Get all forms (admin only)
exports.getAllForms = async (req, res) => {
  try {
    const forms = await Form.find().populate('creator', 'username email');
    
    res.json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get user's forms
exports.getUserForms = async (req, res) => {
  try {
    const forms = await Form.find({ creator: req.user._id });
    
    res.json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create a new form
exports.createForm = async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    
    // Create form
    const form = await Form.create({
      title,
      description,
      fields: fields.map((field, index) => ({
        ...field,
        order: index
      })),
      creator: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get a form by ID
exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id).populate('creator', 'username email');
    
    if (!form) {
      return res.status(404).json({ 
        success: false, 
        message: 'Form not found' 
      });
    }
    
    // Check if user is creator or admin
    if (form.creator._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this form' 
      });
    }
    
    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update a form
exports.updateForm = async (req, res) => {
  try {
    const { title, description, fields, isActive } = req.body;
    
    let form = await Form.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ 
        success: false, 
        message: 'Form not found' 
      });
    }
    
    // Check if user is creator or admin
    if (form.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this form' 
      });
    }
    
    // Update form
    form = await Form.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        fields: fields ? fields.map((field, index) => ({
          ...field,
          order: index
        })) : form.fields,
        isActive: isActive !== undefined ? isActive : form.isActive,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete a form
exports.deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ 
        success: false, 
        message: 'Form not found' 
      });
    }
    
    // Check if user is creator or admin
    if (form.creator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this form' 
      });
    }
    
    await Form.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get form by share link (public)
exports.getFormByShareLink = async (req, res) => {
  try {
    const form = await Form.findOne({ 
      shareLink: req.params.shareLink,
      isActive: true
    }).select('-creator');
    
    if (!form) {
      return res.status(404).json({ 
        success: false, 
        message: 'Form not found or inactive' 
      });
    }
    
    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
}; 