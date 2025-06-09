const mongoose = require('mongoose');

const fieldValueSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
});

const responseSchema = new mongoose.Schema({
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  fieldValues: [fieldValueSchema],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  isComplete: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
responseSchema.index({ form: 1 });

const FormResponse = mongoose.model('FormResponse', responseSchema);

module.exports = FormResponse; 