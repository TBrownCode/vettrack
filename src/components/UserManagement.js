// src/components/UserManagement.js - Updated with working user management
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faTimes, faTrash, faUsers, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/UserManagement.css';

const UserManagement = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('create'); // Start with create tab since view is limited
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const { signUp, user } = useAuth();

  // Load users when component mounts or when switching to list tab
  useEffect(() => {
    if (activeTab === 'list') {
      loadUsers();
    }
  }, [activeTab]);

  // Only allow admins to see this component - MOVED AFTER HOOKS
  if (user?.user_metadata?.role !== 'admin') {
    return (
      <div className="user-management-modal">
        <div className="access-denied">
          <h3>Access Denied</h3>
          <p>Administrator privileges required to manage users.</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  // Updated loadUsers function - simplified approach
  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Note: We can't easily list all users from the client side for security reasons
      // This is a limitation - user listing typically requires server-side implementation
      setError('User listing requires server-side implementation. For now, focus on creating users.');
      setUsers([]);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signUp(email, password, {
        full_name: fullName,
        role: role
      });
      if (error) throw error;
      
      alert(`User created successfully!\n\nEmail: ${email}\nRole: ${role}\nName: ${fullName}`);
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('staff');
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // For now, we'll note that user deletion also requires server-side implementation
  const handleDeleteUser = async (userId, userEmail) => {
    alert('User deletion requires server-side implementation for security reasons. Please use the Supabase dashboard to delete users if needed.');
  };

  const getRoleDisplayName = (userData) => {
    return userData?.user_metadata?.role || 'No Role';
  };

  const getFullName = (userData) => {
    return userData?.user_metadata?.full_name || 'No Name';
  };

  return (
    <div className="user-management-modal">
      <div className="user-management-card">
        <div className="user-management-header">
          <h3>
            <FontAwesomeIcon icon={faUsers} />
            User Management
          </h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Create User
          </button>
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <FontAwesomeIcon icon={faUsers} />
            User Info
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Create User Tab */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateUser} className="user-management-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password (minimum 6 characters)"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="staff">Staff</option>
                <option value="vet">Veterinarian</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  setFullName('');
                  setRole('staff');
                  setError('');
                }}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="create-button"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        )}

        {/* User Info Tab */}
        {activeTab === 'info' && (
          <div className="user-info-container">
            <div className="info-section">
              <h4>Current User (You)</h4>
              <div className="current-user-info">
                <p><strong>Name:</strong> {user?.user_metadata?.full_name || 'Not set'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.user_metadata?.role || 'Not set'}</p>
              </div>
            </div>
            
            <div className="info-section">
              <h4>User Management Notes</h4>
              <div className="management-info">
                <p>• User creation works through this interface</p>
                <p>• To view all users, use the Supabase dashboard</p>
                <p>• To delete users, use the Supabase dashboard</p>
                <p>• All users created here will have proper roles assigned</p>
              </div>
            </div>

            <div className="info-section">
              <h4>Access Supabase Dashboard</h4>
              <p>For advanced user management, visit:</p>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="dashboard-link"
              >
                Supabase Dashboard → Authentication → Users
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;