import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formService, responseService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';

const FormFill = () => {
  const { shareLink } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [form, setForm] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    fetchForm();
    
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, [shareLink]);

  useEffect(() => {
    if (form && response) {
      setupSocketListeners();
    }
  }, [form, response]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const formResponse = await formService.getFormByShareLink(shareLink);
      setForm(formResponse.data.data);
      
      // Join the form to create or get response
      const joinResponse = await responseService.joinForm(formResponse.data.data._id);
      setResponse(joinResponse.data.data);
      
      setError('');
    } catch (err) {
      setError('Failed to load form');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Connect to socket and join form room
    socketService.connect();
    socketService.joinForm(form._id);
    
    // Listen for field updates
    socketService.onFieldUpdated((data) => {
      if (data.responseId === response._id) {
        setResponse(prev => {
          const updatedFieldValues = [...prev.fieldValues];
          const fieldIndex = updatedFieldValues.findIndex(field => field.fieldId === data.fieldId);
          
          if (fieldIndex !== -1) {
            updatedFieldValues[fieldIndex] = {
              ...updatedFieldValues[fieldIndex],
              value: data.value,
              lastUpdatedBy: data.userId,
              lastUpdatedAt: data.timestamp
            };
          }
          
          return {
            ...prev,
            fieldValues: updatedFieldValues
          };
        });
      }
    });
    
    // Listen for user joined events
    socketService.onUserJoined((data) => {
      setActiveUsers(prev => [...prev, data]);
    });
    
    // Listen for user left events
    socketService.onUserLeft((data) => {
      setActiveUsers(prev => prev.filter(user => user.socketId !== data.socketId));
    });
    
    // Listen for typing indicators
    socketService.onUserTyping((data) => {
      if (data.userId !== user._id) {
        if (data.isTyping) {
          setTypingUsers(prev => ({
            ...prev,
            [data.fieldId]: data.username
          }));
        } else {
          setTypingUsers(prev => {
            const updated = { ...prev };
            delete updated[data.fieldId];
            return updated;
          });
        }
      }
    });
  };

  const handleFieldChange = (fieldId, value) => {
    // Update locally
    setResponse(prev => {
      const updatedFieldValues = [...prev.fieldValues];
      const fieldIndex = updatedFieldValues.findIndex(field => field.fieldId === fieldId);
      
      if (fieldIndex !== -1) {
        updatedFieldValues[fieldIndex] = {
          ...updatedFieldValues[fieldIndex],
          value,
          lastUpdatedBy: user._id,
          lastUpdatedAt: Date.now()
        };
      }
      
      return {
        ...prev,
        fieldValues: updatedFieldValues
      };
    });
    
    // Send update to server
    responseService.updateFieldValue(response._id, fieldId, value);
    
    // Emit update via socket
    socketService.updateField({
      responseId: response._id,
      fieldId,
      value,
      userId: user._id
    });
  };

  const handleTypingStart = (fieldId) => {
    socketService.emitTyping({
      formId: form._id,
      fieldId,
      userId: user._id,
      username: user.username,
      isTyping: true
    });
  };

  const handleTypingEnd = (fieldId) => {
    socketService.emitTyping({
      formId: form._id,
      fieldId,
      userId: user._id,
      username: user.username,
      isTyping: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await responseService.markResponseComplete(response._id);
      alert('Form submitted successfully!');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to submit form');
      console.error(err);
    }
  };

  const renderField = (field, fieldValue) => {
    const isTyping = typingUsers[field.fieldId];
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div className="form-group" key={field.fieldId}>
            <label htmlFor={field.fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="input-wrapper">
              <input
                type={field.type}
                id={field.fieldId}
                value={fieldValue?.value || ''}
                onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                onFocus={() => handleTypingStart(field.fieldId)}
                onBlur={() => handleTypingEnd(field.fieldId)}
                placeholder={field.placeholder}
                required={field.required}
              />
              {isTyping && <div className="typing-indicator">{isTyping} is typing...</div>}
            </div>
          </div>
        );
      
      case 'date':
        return (
          <div className="form-group" key={field.fieldId}>
            <label htmlFor={field.fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type="date"
              id={field.fieldId}
              value={fieldValue?.value || ''}
              onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="form-group" key={field.fieldId}>
            <label htmlFor={field.fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              id={field.fieldId}
              value={fieldValue?.value || ''}
              onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
              required={field.required}
            >
              <option value="">Select an option</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="form-group" key={field.fieldId}>
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="checkbox-group">
              {field.options.map((option) => {
                const isChecked = Array.isArray(fieldValue?.value) 
                  ? fieldValue.value.includes(option.value)
                  : false;
                
                return (
                  <div className="checkbox-item" key={option.value}>
                    <input
                      type="checkbox"
                      id={`${field.fieldId}-${option.value}`}
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValues = Array.isArray(fieldValue?.value) 
                          ? [...fieldValue.value]
                          : [];
                        
                        if (e.target.checked) {
                          handleFieldChange(field.fieldId, [...currentValues, option.value]);
                        } else {
                          handleFieldChange(
                            field.fieldId,
                            currentValues.filter(val => val !== option.value)
                          );
                        }
                      }}
                    />
                    <label htmlFor={`${field.fieldId}-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'radio':
        return (
          <div className="form-group" key={field.fieldId}>
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="radio-group">
              {field.options.map((option) => (
                <div className="radio-item" key={option.value}>
                  <input
                    type="radio"
                    id={`${field.fieldId}-${option.value}`}
                    name={field.fieldId}
                    value={option.value}
                    checked={fieldValue?.value === option.value}
                    onChange={() => handleFieldChange(field.fieldId, option.value)}
                    required={field.required}
                  />
                  <label htmlFor={`${field.fieldId}-${option.value}`}>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) return <div>Loading...</div>;
  
  if (error) return <div className="error-message">{error}</div>;
  
  if (!form) return <div>Form not found</div>;

  return (
    <div className="form-fill-container">
      <div className="form-header">
        <h2>{form.title}</h2>
        <p>{form.description}</p>
      </div>
      
      <div className="collaborators-panel">
        <h3>Collaborators</h3>
        <div className="collaborator-list">
          {response?.collaborators.map((collab) => (
            <div 
              key={collab.user._id} 
              className={`collaborator-item ${collab.isActive ? 'active' : 'inactive'}`}
            >
              {collab.user.username}
            </div>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-fields">
          {form.fields.map((field) => {
            const fieldValue = response?.fieldValues.find(
              (fv) => fv.fieldId === field.fieldId
            );
            return renderField(field, fieldValue);
          })}
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Submit Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormFill; 