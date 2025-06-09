import React, { useState, useEffect } from 'react';
import { userService, authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    fetchUsers();
  }, [user, navigate]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePromoteUser = async (userId) => {
    if (window.confirm('Are you sure you want to promote this user to admin?')) {
      try {
        await authService.promoteUser(userId);
        
        // Update the user in the list
        setUsers(users.map(u => 
          u._id === userId ? { ...u, role: 'admin' } : u
        ));
        
        alert('User promoted to admin successfully');
      } catch (err) {
        setError('Failed to promote user');
        console.error(err);
      }
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="admin-users-container">
      <h2>User Management</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="users-list">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  {user.role !== 'admin' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handlePromoteUser(user._id)}
                    >
                      Promote to Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers; 