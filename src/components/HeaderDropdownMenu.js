// src/components/HeaderDropdownMenu.js - Updated with Change Password option
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faTimes, 
  faUser, 
  faSignOutAlt, 
  faCog, 
  faVideo, 
  faLink,
  faUserPlus,
  faTrashRestore,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import ChangePasswordForm from './ChangePasswordForm';
import '../styles/HeaderDropdownMenu.css';

const HeaderDropdownMenu = ({ onStatusManagement, onEducationalManager, onResourceLinker, onSoftDeletedPatients }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const dropdownRef = useRef(null);
  const { user, signOut } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  };

  const handleMenuItemClick = (action) => {
    setIsOpen(false);
    if (action) action();
  };

  return (
    <>
      <div className="header-dropdown-container" ref={dropdownRef}>
        <button
          className="hamburger-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
        </button>

        {isOpen && (
          <div className="header-dropdown-menu">
            {/* User Info Section */}
            <div className="dropdown-section user-section">
              <div className="user-avatar">
                {(user?.user_metadata?.full_name || user?.email)?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">
                  {user?.user_metadata?.full_name || user?.app_metadata?.full_name || 'Staff Member'}
                </div>
                <div className="user-email">{user?.email}</div>
                <div className="user-role">
                  {(user?.user_metadata?.role || user?.app_metadata?.role || 'staff').toUpperCase()}
                </div>
              </div>
            </div>

            <div className="dropdown-divider" />

            {/* Management Options (Admin Only) */}
            {(user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin') && (
              <>
                <button 
                  className="dropdown-item"
                  onClick={() => handleMenuItemClick(onStatusManagement)}
                >
                  <FontAwesomeIcon icon={faCog} className="dropdown-icon" />
                  Manage Status Options
                </button>
                
                <button 
                  className="dropdown-item"
                  onClick={() => handleMenuItemClick(onEducationalManager)}
                >
                  <FontAwesomeIcon icon={faVideo} className="dropdown-icon" />
                  Manage Educational Resources
                </button>
                
                <button 
                  className="dropdown-item"
                  onClick={() => handleMenuItemClick(onResourceLinker)}
                >
                  <FontAwesomeIcon icon={faLink} className="dropdown-icon" />
                  Link Resources to Statuses
                </button>

                <button 
                  className="dropdown-item"
                  onClick={() => handleMenuItemClick(() => setShowUserManagement(true))}
                >
                  <FontAwesomeIcon icon={faUserPlus} className="dropdown-icon" />
                  Manage Users
                </button>

                <div className="dropdown-divider" />
              </>
            )}

            {/* Available to All Staff */}
            <button 
              className="dropdown-item"
              onClick={() => handleMenuItemClick(onSoftDeletedPatients)}
            >
              <FontAwesomeIcon icon={faTrashRestore} className="dropdown-icon" />
              Recently Deleted Patients
            </button>

            <div className="dropdown-divider" />

            {/* Standard Menu Items */}
            <button 
              className="dropdown-item"
              onClick={() => handleMenuItemClick(() => setShowChangePassword(true))}
            >
              <FontAwesomeIcon icon={faLock} className="dropdown-icon" />
              Change Password
            </button>

            <button 
              className="dropdown-item"
              onClick={() => handleMenuItemClick(() => console.log('Profile clicked'))}
            >
              <FontAwesomeIcon icon={faUser} className="dropdown-icon" />
              Profile Settings
            </button>

            <button 
              className="dropdown-item logout-item"
              onClick={() => handleMenuItemClick(handleLogout)}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordForm onClose={() => setShowChangePassword(false)} />
      )}
    </>
  );
};

export default HeaderDropdownMenu;