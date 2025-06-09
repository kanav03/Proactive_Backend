import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formService } from '../services/api';

const FormCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fields: []
  });
  const [currentField, setCurrentField] = useState({
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: []
  });
  const [currentOption, setCurrentOption] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await formService.getFormById(id);
      setFormData({
        title: response.data.data.title,
        description: response.data.data.description,
        fields: response.data.data.fields,
        isActive: response.data.data.isActive
      });
      setError('');
    } catch (err) {
      setError('Failed to load form');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentField({
      ...currentField,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const addOption = () => {
    if (currentOption.trim()) {
      setCurrentField({
        ...currentField,
        options: [
          ...currentField.options,
          { label: currentOption, value: currentOption.toLowerCase().replace(/\s+/g, '_') }
        ]
      });
      setCurrentOption('');
    }
  };

  const removeOption = (index) => {
    const updatedOptions = [...currentField.options];
    updatedOptions.splice(index, 1);
    setCurrentField({
      ...currentField,
      options: updatedOptions
    });
  };

  const addField = () => {
    if (!currentField.label) {
      alert('Field label is required');
      return;
    }

    // Validate options for select, checkbox, radio
    if (['select', 'checkbox', 'radio'].includes(currentField.type) && currentField.options.length === 0) {
      alert('Options are required for this field type');
      return;
    }

    // Add fieldId for new fields
    const fieldWithId = {
      ...currentField,
      fieldId: currentField.fieldId || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setFormData({
      ...formData,
      fields: [...formData.fields, fieldWithId]
    });

    // Reset current field
    setCurrentField({
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: []
    });
  };

  const removeField = (index) => {
    const updatedFields = [...formData.fields];
    updatedFields.splice(index, 1);
    setFormData({
      ...formData,
      fields: updatedFields
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('Form title is required');
      return;
    }

    if (formData.fields.length === 0) {
      setError('At least one field is required');
      return;
    }

    try {
      if (isEditMode) {
        await formService.updateForm(id, formData);
      } else {
        await formService.createForm(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} form`);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="form-create-container">
      <div className="dashboard-header">
        <h2>{isEditMode ? 'Edit Form' : 'Create New Form'}</h2>
        <div className="dashboard-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Form Details</h3>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              required
              className="form-input"
              placeholder="Enter form title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              className="form-input"
              placeholder="Enter form description"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Form Fields</h3>
          <div className="field-list">
            {formData.fields.map((field, index) => (
              <div key={field.fieldId || index} className="field-item">
                <div className="field-header">
                  <h4>{field.label}</h4>
                  <span className="field-type">{field.type}</span>
                  {field.required && <span className="field-required">Required</span>}
                </div>
                <div className="field-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeField(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="add-field-section">
            <h3>Add New Field</h3>
            <div className="form-group">
              <label htmlFor="fieldLabel">Label</label>
              <input
                type="text"
                id="fieldLabel"
                name="label"
                value={currentField.label}
                onChange={handleFieldChange}
                className="form-input"
                placeholder="Enter field label"
              />
            </div>
            <div className="form-group">
              <label htmlFor="fieldType">Type</label>
              <select
                id="fieldType"
                name="type"
                value={currentField.type}
                onChange={handleFieldChange}
                className="form-input"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
            </div>
            <div className="form-group checkbox-container">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="fieldRequired"
                  name="required"
                  checked={currentField.required}
                  onChange={handleFieldChange}
                />
                <span>Required</span>
              </label>
            </div>
            <div className="form-group">
              <label htmlFor="fieldPlaceholder">Placeholder</label>
              <input
                type="text"
                id="fieldPlaceholder"
                name="placeholder"
                value={currentField.placeholder}
                onChange={handleFieldChange}
                className="form-input"
                placeholder="Enter field placeholder text"
              />
            </div>

            {['select', 'checkbox', 'radio'].includes(currentField.type) && (
              <div className="options-section">
                <h4>Options</h4>
                <div className="form-group">
                  <div className="option-input-group">
                    <input
                      type="text"
                      value={currentOption}
                      onChange={(e) => setCurrentOption(e.target.value)}
                      placeholder="Enter option"
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={addOption}
                    >
                      Add Option
                    </button>
                  </div>
                </div>
                <div className="options-list">
                  {currentField.options.map((option, index) => (
                    <div key={index} className="option-item">
                      <span>{option.label}</span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary add-field-btn"
              onClick={addField}
            >
              Add Field
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Form' : 'Create Form'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormCreate;