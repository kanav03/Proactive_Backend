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
  const [fieldHistories, setFieldHistories] = useState({});

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
      // Create initial field histories
      const initialHistories = {};
      response.fieldValues.forEach(field => {
        if (field.lastUpdatedBy) {
          initialHistories[field.fieldId] = {
            username: field.lastUpdatedBy.username || 'Unknown user',
            timestamp: field.lastUpdatedAt
          };
        }
      });
      setFieldHistories(initialHistories);
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

        // Update field history
        if (data.username) {
          setFieldHistories(prev => ({
            ...prev,
            [data.fieldId]: {
              username: data.username,
              timestamp: data.timestamp
            }
          }));
        }
      }
    });
    
    // Listen for user joined events
    socketService.onUserJoined((data) => {
      setActiveUsers(prev => [...prev, data]);
      // Show notification of user joining
      showNotification(`${data.username} joined the form`);
    });
    
    // Listen for user left events
    socketService.onUserLeft((data) => {
      setActiveUsers(prev => prev.filter(user => user.socketId !== data.socketId));
      // Show notification of user leaving
      if (data.username) {
        showNotification(`${data.username} left the form`);
      }
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

  // Simple notification function
  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'collaboration-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
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
      userId: user._id,
      username: user.username,
      timestamp: Date.now()
    });

    // Update field history locally
    setFieldHistories(prev => ({
      ...prev,
      [fieldId]: {
        username: user.username,
        timestamp: Date.now()
      }
    }));
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

  const getFieldHistory = (fieldId) => {
    const history = fieldHistories[fieldId];
    if (!history) return null;
    
    const timeAgo = formatTimeAgo(history.timestamp);
    return `Last edited by ${history.username} ${timeAgo}`;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const renderField = (field, fieldValue) => {
    const isTyping = typingUsers[field.fieldId];
    const historyText = getFieldHistory(field.fieldId);
    
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
                className={isTyping ? 'field-being-edited' : ''}
              />
              {isTyping && <div className="typing-indicator">{isTyping} is typing...</div>}
              {historyText && <div className="field-history">{historyText}</div>}
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
            <div className="input-wrapper">
              <input
                type="date"
                id={field.fieldId}
                value={fieldValue?.value || ''}
                onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                required={field.required}
                className={isTyping ? 'field-being-edited' : ''}
              />
              {isTyping && <div className="typing-indicator">{isTyping} is typing...</div>}
              {historyText && <div className="field-history">{historyText}</div>}
            </div>
          </div>
        );
      
      case 'select':
        return (
          <div className="form-group" key={field.fieldId}>
            <label htmlFor={field.fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="input-wrapper">
              <select
                id={field.fieldId}
                value={fieldValue?.value || ''}
                onChange={(e) => handleFieldChange(field.fieldId, e.target.value)}
                required={field.required}
                className={isTyping ? 'field-being-edited' : ''}
                onFocus={() => handleTypingStart(field.fieldId)}
                onBlur={() => handleTypingEnd(field.fieldId)}
              >
                <option value="">Select an option</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isTyping && <div className="typing-indicator">{isTyping} is typing...</div>}
              {historyText && <div className="field-history">{historyText}</div>}
            </div>
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
                      onFocus={() => handleTypingStart(field.fieldId)}
                      onBlur={() => handleTypingEnd(field.fieldId)}
                    />
                    <label htmlFor={`${field.fieldId}-${option.value}`}>
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
            {isTyping && <div className="typing-indicator">{isTyping} is making a selection...</div>}
            {historyText && <div className="field-history">{historyText}</div>}
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
                    onFocus={() => handleTypingStart(field.fieldId)}
                    onBlur={() => handleTypingEnd(field.fieldId)}
                  />
                  <label htmlFor={`${field.fieldId}-${option.value}`}>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {isTyping && <div className="typing-indicator">{isTyping} is making a selection...</div>}
            {historyText && <div className="field-history">{historyText}</div>}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) return <div className="loading-spinner">Loading form...</div>;
  
  if (error) return <div className="error-message">{error}</div>;
  
  if (!form) return <div className="not-found">Form not found</div>;

  return (
    <div className="form-fill-container">
      <div className="form-header">
        <h2>{form.title}</h2>
        <p>{form.description}</p>
      </div>
      
      <div className="collaborators-panel">
        <h3>Real-time Collaborators</h3>
        <p className="collaboration-info">Changes you make will be visible to all collaborators in real-time</p>
        <div className="collaborator-list">
          {response?.collaborators.map((collab) => (
            <div 
              key={collab.user._id} 
              className={`collaborator-item ${collab.isActive ? 'active' : 'inactive'}`}
              title={collab.isActive ? 'Currently active' : 'Inactive'}
            >
              {collab.user.username}
              {collab.isActive && <span className="active-indicator"></span>}
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