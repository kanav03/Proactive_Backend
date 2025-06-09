import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await register({ username, email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again with different credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="auth-header">
        <h2>Create Account</h2>
        <p>Sign up to start creating collaborative forms</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            className="auth-input"
          />
        </div>
        
        <div className="role-info-box">
          <h4>About User Roles</h4>
          <p>
            <strong>Regular users</strong> can create and manage their own forms, and collaborate on shared forms.
          </p>
          <p>
            <strong>Admin users</strong> have additional privileges to view all forms in the system and manage users.
          </p>
          <p className="note">Note: The first user to register will automatically become an admin. Additional admins can be promoted by existing admins.</p>
        </div>
        
        <button 
          type="submit" 
          className={`btn btn-primary auth-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      <div className="auth-links">
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
      
      <div className="auth-footer">
        <p>Collaborative Form System - Real-time Form Collaboration</p>
      </div>
    </div>
  );
};

export default Register; 