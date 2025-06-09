import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formService.getForms();
      setForms(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch forms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (id) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await formService.deleteForm(id);
        setForms(forms.filter(form => form._id !== id));
      } catch (err) {
        setError('Failed to delete form');
        console.error(err);
      }
    }
  };

  const copyShareLink = (shareLink) => {
    const url = `${window.location.origin}/forms/share/${shareLink}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard!');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>My Forms</h2>
        <Link to="/forms/create" className="btn btn-primary">
          Create New Form
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {forms.length === 0 ? (
        <div className="no-forms">
          <p>You haven't created any forms yet.</p>
        </div>
      ) : (
        <div className="forms-list">
          {forms.map(form => (
            <div key={form._id} className="form-card">
              <div className="form-card-header">
                <h3>{form.title}</h3>
                <div className="form-status">
                  {form.isActive ? (
                    <span className="status-active">Active</span>
                  ) : (
                    <span className="status-inactive">Inactive</span>
                  )}
                </div>
              </div>
              <p className="form-description">{form.description}</p>
              <div className="form-meta">
                <span>Fields: {form.fields.length}</span>
                <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="form-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => copyShareLink(form.shareLink)}
                >
                  Copy Share Link
                </button>
                <Link 
                  to={`/forms/edit/${form._id}`} 
                  className="btn btn-secondary"
                >
                  Edit
                </Link>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDeleteForm(form._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 