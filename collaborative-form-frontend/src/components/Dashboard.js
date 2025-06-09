import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const [allForms, setAllForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formService.getForms();
      setForms(response.data.data);
      
      // If user is admin, fetch all forms
      if (isAdmin) {
        const allFormsResponse = await formService.getAllForms();
        setAllForms(allFormsResponse.data.data);
      }
      
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
        if (isAdmin) {
          setAllForms(allForms.filter(form => form._id !== id));
        }
      } catch (err) {
        setError('Failed to delete form');
        console.error(err);
      }
    }
  };

  const copyShareLink = (shareLink) => {
    const url = `${window.location.origin}/forms/share/${shareLink}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard! Share this with collaborators to work on the form together.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderFormsList = (formsList, title) => (
    <>
      <h3 className="section-title">{title}</h3>
      {formsList.length === 0 ? (
        <div className="no-forms">
          <p>No forms to display.</p>
        </div>
      ) : (
        <div className="forms-list">
          {formsList.map(form => (
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
              <p className="form-description">{form.description || 'No description provided'}</p>
              <div className="form-meta">
                <span>Fields: {form.fields.length}</span>
                <span>Created: {new Date(form.createdAt).toLocaleDateString()}</span>
                {isAdmin && form.creator && (
                  <span>Creator: {form.creator.username || 'Unknown'}</span>
                )}
              </div>
              <div className="collaboration-info">
                <div className="collaboration-badge">
                  <i className="collaboration-icon">📝</i>
                  <span>Real-time Collaboration</span>
                </div>
              </div>
              <div className="form-actions">
                <button 
                  onClick={() => copyShareLink(form.shareLink)}
                  className="btn btn-secondary"
                >
                  Share Link
                </button>
                <Link 
                  to={`/forms/edit/${form._id}`} 
                  className="btn btn-secondary"
                >
                  Edit
                </Link>
                <Link
                  to={`/forms/share/${form.shareLink}`}
                  className="btn btn-primary"
                >
                  Fill Form
                </Link>
                <button 
                  onClick={() => handleDeleteForm(form._id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>{isAdmin ? 'Admin Dashboard' : 'My Forms'}</h2>
          <div className="user-role-badge">
            <span className={`role-indicator ${isAdmin ? 'admin-role' : 'user-role'}`}>
              {isAdmin ? 'Admin User' : 'Regular User'}
            </span>
            <span className="user-welcome">Welcome, {user?.username}</span>
          </div>
        </div>
        <div className="dashboard-actions">
          <Link to="/forms/create" className="btn btn-primary">
            Create New Form
          </Link>
          {isAdmin && (
            <Link to="/admin/users" className="btn btn-primary">
              Manage Users
            </Link>
          )}
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-info">
        <div className="info-card">
          <h3>Collaborative Form System</h3>
          <p>Create, share, and collaborate on forms in real-time with other users.</p>
          <ul className="feature-list">
            <li>Real-time updates across all collaborators</li>
            <li>Dynamic form fields with various input types</li>
            <li>Unique shareable links for each form</li>
            <li>See who's currently editing each field</li>
          </ul>
        </div>
      </div>

      <div className="dashboard-content">
        {renderFormsList(forms, 'My Forms')}
        
        {isAdmin && (
          <div className="admin-section">
            <hr className="section-divider" />
            {renderFormsList(allForms, 'All Forms (Admin View)')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 