// src/components/UserManagement.js - Enhanced with user listing and deletion
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserPlus, 
  faTimes, 
  faTrash, 
  faUsers, 
  faUser, 
  faExclamationTriangle,
  faList,
  faShield,
  faUserTie,
  faUserCheck
} from '@fortawesome/free-solid-svg-icons';
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
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { user } = useAuth();

  // Load users when component mounts or when switching to list tab
  useEffect(() => {
    if (activeTab === 'list') {
      loadUsers();
    }
  }, [activeTab]);

  // Check if user has admin privileges
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  if (!isAdmin) {
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

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading users with Edge Function...');
      
      // Call the list-users Edge Function
      const { data, error } = await supabase.functions.invoke('list-users', {
        body: {}
      });

      console.log('List users response:', { data, error });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to call list-users Edge Function');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to load users');
      }

      // Transform the users data
      const transformedUsers = data.users.map(userData => ({
        id: userData.id,
        email: userData.email,
        fullName: userData.user_metadata?.full_name || userData.app_metadata?.full_name || 'No Name',
        role: userData.app_metadata?.role || userData.user_metadata?.role || 'staff',
        roleSource: userData.app_metadata?.role ? 'app_metadata' : 'user_metadata',
        createdAt: new Date(userData.created_at).toLocaleDateString(),
        lastSignIn: userData.last_sign_in_at ? new Date(userData.last_sign_in_at).toLocaleDateString() : 'Never',
        isCurrentUser: userData.id === user.id
      }));

      setUsers(transformedUsers);
      
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to call list-users Edge Function')) {
        errorMessage = 'The list-users Edge Function is not deployed. Please deploy it to Supabase first.';
      }
      
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Creating user with Edge Function...');
      
      // Call the Edge Function with proper structure
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: email,
          password: password,
          app_metadata: {
            role: role,
            full_name: fullName
          },
          user_metadata: {
            full_name: fullName
          }
        }
      });

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to call Edge Function');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'User creation failed');
      }

      // Success!
      alert(`User created successfully!\n\nEmail: ${email}\nRole: ${role}\nName: ${fullName}\n\nThe user's role has been securely set in app_metadata.`);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('staff');
      
      // Refresh user list if we're on the list tab
      if (activeTab === 'list') {
        loadUsers();
      }
      
    } catch (error) {
      console.error('User creation error:', error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to call Edge Function')) {
        errorMessage = `Edge Function not found. Please deploy the create-user Edge Function first. Original error: ${error.message}`;
      } else if (error.message.includes('Unauthorized') || error.message.includes('administrators')) {
        errorMessage = 'You need administrator privileges to create users.';
      } else if (error.message.includes('already registered')) {
        errorMessage = 'A user with this email already exists.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail, isCurrentUser) => {
    if (isCurrentUser) {
      alert('You cannot delete your own account!');
      return;
    }

    // Show confirmation dialog
    setConfirmDelete({
      userId,
      userEmail,
      onConfirm: async () => {
        try {
          setLoading(true);
          console.log('Deleting user with Edge Function...');
          
          // Call the delete-user Edge Function
          const { data, error } = await supabase.functions.invoke('delete-user', {
            body: {
              userId: userId
            }
          });

          console.log('Delete user response:', { data, error });

          if (error) {
            console.error('Edge Function error:', error);
            throw new Error(error.message || 'Failed to call delete-user Edge Function');
          }

          if (!data?.success) {
            throw new Error(data?.error || 'Failed to delete user');
          }

          // Success!
          alert(`User "${userEmail}" has been deleted successfully.`);
          
          // Refresh the user list
          await loadUsers();
          
        } catch (error) {
          console.error('User deletion error:', error);
          
          let errorMessage = error.message;
          
          if (error.message.includes('Failed to call delete-user Edge Function')) {
            errorMessage = 'The delete-user Edge Function is not deployed. Please deploy it to Supabase first.';
          }
          
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setConfirmDelete(null)
    });
  };

  const getRoleDisplayName = (userData) => {
    return userData?.app_metadata?.role || userData?.user_metadata?.role || 'No Role';
  };

  const getFullName = (userData) => {
    return userData?.app_metadata?.full_name || userData?.user_metadata?.full_name || 'No Name';
  };

  const getRoleSource = (userData) => {
    if (userData?.app_metadata?.role) return 'app_metadata (secure)';
    if (userData?.user_metadata?.role) return 'user_metadata (less secure)';
    return 'Not set';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return faShield;
      case 'vet': return faUserTie;
      case 'staff': return faUserCheck;
      default: return faUser;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#d32f2f';
      case 'vet': return '#1976d2';
      case 'staff': return '#388e3c';
      default: return '#757575';
    }
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
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <FontAwesomeIcon icon={faList} />
            Manage Users
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
            {/* Edge Function Status Notice */}
            <div style={{
              backgroundColor: '#e8f0fe',
              borderColor: '#c3d7ff',
              color: '#1a73e8',
              padding: '12px',
              borderRadius: '6px',
              margin: '16px 24px',
              border: '1px solid #c3d7ff',
              fontSize: '0.875rem'
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
              <strong>Production Ready:</strong> This uses the create-user Edge Function for secure role assignment in app_metadata.
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

        {/* User List Tab */}
        {activeTab === 'list' && (
          <div className="user-list-container">
            <div className="user-list-header">
              <h4>Registered Users</h4>
              <button 
                onClick={loadUsers} 
                disabled={loading}
                className="refresh-button"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="loading-state">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <p>No users found or Edge Function not available.</p>
              </div>
            ) : (
              <div className="user-list">
                {users.map(userData => (
                  <div key={userData.id} className={`user-card ${userData.isCurrentUser ? 'current-user' : ''}`}>
                    <div className="user-card-header">
                      <div className="user-basic-info">
                        <div className="user-avatar">
                          {userData.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {userData.fullName}
                            {userData.isCurrentUser && <span className="current-user-badge">(You)</span>}
                          </div>
                          <div className="user-email">{userData.email}</div>
                        </div>
                      </div>
                      
                      <div className="user-role-badge" style={{ color: getRoleColor(userData.role) }}>
                        <FontAwesomeIcon icon={getRoleIcon(userData.role)} />
                        {userData.role.toUpperCase()}
                      </div>
                    </div>

                    <div className="user-card-body">
                      <div className="user-metadata">
                        <div className="metadata-item">
                          <strong>Role Source:</strong> {userData.roleSource}
                        </div>
                        <div className="metadata-item">
                          <strong>Created:</strong> {userData.createdAt}
                        </div>
                        <div className="metadata-item">
                          <strong>Last Sign In:</strong> {userData.lastSignIn}
                        </div>
                      </div>
                      
                      <div className="user-actions">
                        <button
                          onClick={() => handleDeleteUser(userData.id, userData.email, userData.isCurrentUser)}
                          disabled={userData.isCurrentUser || loading}
                          className={`delete-user-button ${userData.isCurrentUser ? 'disabled' : ''}`}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          {userData.isCurrentUser ? 'Cannot Delete Self' : 'Delete User'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <p><strong>Role Source:</strong> {getRoleSource(user)}</p>
              </div>
            </div>
            
            <div className="info-section">
              <h4>Edge Function Status</h4>
              <div className="management-info">
                <p>✅ <strong>create-user Edge Function:</strong> Deployed and ready</p>
                <p>🔧 <strong>list-users Edge Function:</strong> Required for user listing</p>
                <p>🔧 <strong>delete-user Edge Function:</strong> Required for user deletion</p>
                <p>✅ <strong>Secure Role Assignment:</strong> Uses app_metadata</p>
                <p>✅ <strong>Admin Verification:</strong> Only admins can manage users</p>
              </div>
            </div>

            <div className="info-section">
              <h4>Required Edge Functions</h4>
              <div className="management-info">
                <p>1. <strong>create-user:</strong> For creating new users with roles</p>
                <p>2. <strong>list-users:</strong> For listing all registered users</p>
                <p>3. <strong>delete-user:</strong> For deleting user accounts</p>
                <p>4. Deploy all three to enable full user management</p>
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
                Supabase Dashboard → Edge Functions
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <h3>Delete User</h3>
            </div>
            <div className="confirmation-body">
              <p>Are you sure you want to delete the user <strong>"{confirmDelete.userEmail}"</strong>?</p>
              <p style={{ color: '#d32f2f', fontSize: '0.9rem' }}>
                This action cannot be undone and will permanently remove the user's account and access.
              </p>
            </div>
            <div className="confirmation-actions">
              <button 
                onClick={confirmDelete.onCancel}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete.onConfirm}
                className="delete-button"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;