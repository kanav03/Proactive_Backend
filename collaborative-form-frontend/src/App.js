import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import FormCreate from './components/FormCreate';
import FormFill from './components/FormFill';
import AdminUsers from './components/AdminUsers';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <header className="app-header">
            <h1>Collaborative Form System</h1>
          </header>
          <main className="app-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/forms/create" 
                element={
                  <ProtectedRoute>
                    <FormCreate />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/forms/edit/:id" 
                element={
                  <ProtectedRoute>
                    <FormCreate />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/forms/share/:shareLink" 
                element={
                  <ProtectedRoute>
                    <FormFill />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
