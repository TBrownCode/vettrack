// src/components/Toast.js - Toast notification component
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faExclamationTriangle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1001,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '400px',
      border: '1px solid',
      transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
      opacity: isExiting ? 0 : 1,
      transition: 'all 0.3s ease-in-out'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          borderColor: '#34a853',
          borderLeftWidth: '4px'
        };
      case 'error':
        return {
          ...baseStyles,
          borderColor: '#ea4335',
          borderLeftWidth: '4px'
        };
      case 'warning':
        return {
          ...baseStyles,
          borderColor: '#fbbc05',
          borderLeftWidth: '4px'
        };
      case 'info':
        return {
          ...baseStyles,
          borderColor: '#4285f4',
          borderLeftWidth: '4px'
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FontAwesomeIcon icon={faCheck} style={{ color: '#34a853', fontSize: '18px' }} />;
      case 'error':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ea4335', fontSize: '18px' }} />;
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#fbbc05', fontSize: '18px' }} />;
      case 'info':
        return <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#4285f4', fontSize: '18px' }} />;
      default:
        return null;
    }
  };

  return (
    <div style={getToastStyles()}>
      {getIcon()}
      <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.4' }}>
        {message}
      </div>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        <FontAwesomeIcon icon={faTimes} style={{ fontSize: '14px' }} />
      </button>
    </div>
  );
};

// ToastContainer component
export const ToastContainer = ({ toasts, onHideToast }) => {
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 1001 }}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            marginBottom: index < toasts.length - 1 ? '8px' : '0'
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onHideToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;