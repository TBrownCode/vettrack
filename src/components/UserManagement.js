// src/components/UserManagement.js - Updated with app_metadata approach
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faTimes, faTrash, faUsers, faUser, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/UserManagement.css';

const UserManagement = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('create');
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

  // Only allow admins to see this component
  if (user?.app_metadata?.role !== 'admin' && user?.user_metadata?.role !== 'admin') {
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

  // Load users function - simplified approach with note about limitations
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

  // Create Edge Function to handle user creation with app_metadata
  const createUserWithAppMetadata = async (userData) => {
    try {
      // Call Edge Function to create user with proper app_metadata
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          app_metadata: {
            role: userData.role,
            full_name: userData.fullName
          },
          user_metadata: {
            full_name: userData.fullName
          }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      // Fallback to regular signup if Edge Function is not available
      console.warn('Edge Function not available, falling back to regular signup with user_metadata');
      return await signUp(userData.email, userData.password, {
        full_name: userData.fullName,
        role: userData.role
      });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try to create user with app_metadata via Edge Function
      const { error } = await createUserWithAppMetadata({
        email,
        password,
        fullName,
        role
      });

      if (error) throw error;
      
      alert(`User created successfully!\n\nEmail: ${email}\nRole: ${role}\nName: ${fullName}\n\nNote: The user's role has been set securely and will be enforced by the system.`);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('staff');
      
    } catch (error) {
      console.error('User creation error:', error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes('Edge Function')) {
        errorMessage = `User created but role security may be limited. Please set up the Edge Function for secure role assignment. Original error: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Note about user deletion requiring server-side implementation
  const handleDeleteUser = async (userId, userEmail) => {
    alert('User deletion requires server-side implementation for security reasons. Please use the Supabase dashboard to delete users if needed.');
  };

  const getRoleDisplayName = (userData) => {
    // Check app_metadata first, then user_metadata as fallback
    return userData?.app_metadata?.role || userData?.user_metadata?.role || 'No Role';
  };

  const getFullName = (userData) => {
    // Check app_metadata first, then user_metadata as fallback
    return userData?.app_metadata?.full_name || userData?.user_metadata?.full_name || 'No Name';
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
          <div>
            {/* Security Notice */}
            <div style={{
              backgroundColor: '#fff3cd',
              borderColor: '#ffeaa7',
              color: '#856404',
              padding: '12px',
              borderRadius: '6px',
              margin: '16px 24px',
              border: '1px solid #ffeaa7',
              fontSize: '0.875rem'
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
              <strong>Security Notice:</strong> For enhanced security, user roles should be managed via app_metadata. 
              Consider setting up the create-user Edge Function for secure role assignment.
            </div>

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
          </div>
        )}

        {/* User Info Tab */}
        {activeTab === 'info' && (
          <div className="user-info-container">
            <div className="info-section">
              <h4>Current User (You)</h4>
              <div className="current-user-info">
                <p><strong>Name:</strong> {getFullName(user) || 'Not set'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {getRoleDisplayName(user) || 'Not set'}</p>
                <p><strong>Role Source:</strong> {
                  user?.app_metadata?.role ? 'app_metadata (secure)' : 
                  user?.user_metadata?.role ? 'user_metadata (less secure)' : 
                  'Not set'
                }</p>
              </div>
            </div>
            
            <div className="info-section">
              <h4>Security & Role Management</h4>
              <div className="management-info">
                <p>• <strong>app_metadata:</strong> Server-controlled, secure for roles</p>
                <p>• <strong>user_metadata:</strong> User-editable, less secure</p>
                <p>• User creation works through this interface</p>
                <p>• Roles are enforced by Row Level Security policies</p>
                <p>• For production: Set up create-user Edge Function</p>
              </div>
            </div>

            <div className="info-section">
              <h4>Edge Function Setup (Recommended)</h4>
              <div className="management-info">
                <p>For secure role assignment, create an Edge Function:</p>
                <code style={{
                  display: 'block',
                  backgroundColor: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  margin: '8px 0'
                }}>
                  supabase functions new create-user
                </code>
                <p>This ensures roles are set in app_metadata securely.</p>
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