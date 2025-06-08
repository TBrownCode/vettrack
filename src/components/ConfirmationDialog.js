// src/components/ConfirmationDialog.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faTimes, 
  faExclamationTriangle, 
  faInfoCircle,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

const ConfirmationDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  type = 'danger', // 'danger', 'warning', 'info'
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          backgroundColor: '#ea4335',
          icon: faTrash,
          confirmButtonColor: '#ea4335',
          confirmButtonHoverColor: '#d32f2f'
        };
      case 'warning':
        return {
          backgroundColor: '#fbbc05',
          icon: faExclamationTriangle,
          confirmButtonColor: '#fbbc05',
          confirmButtonHoverColor: '#f9a825'
        };
      case 'info':
        return {
          backgroundColor: '#4285f4',
          icon: faInfoCircle,
          confirmButtonColor: '#4285f4',
          confirmButtonHoverColor: '#3367d6'
        };
      default:
        return {
          backgroundColor: '#4285f4',
          icon: faQuestionCircle,
          confirmButtonColor: '#4285f4',
          confirmButtonHoverColor: '#3367d6'
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          backgroundColor: typeConfig.backgroundColor,
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={typeConfig.icon} />
            {title}
          </h3>
        </div>
        
        {/* Content */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ 
            margin: '0 0 24px 0', 
            fontSize: '1rem', 
            lineHeight: '1.5',
            color: '#333'
          }}>
            {message}
          </p>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center'
          }}>
            <button
              onClick={onCancel}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                minWidth: '100px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e9ecef';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f5f5f5';
              }}
            >
              {cancelText}
            </button>
            
            <button
              onClick={onConfirm}
              style={{
                padding: '12px 24px',
                backgroundColor: typeConfig.confirmButtonColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                minWidth: '100px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = typeConfig.confirmButtonHoverColor;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = typeConfig.confirmButtonColor;
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ConfirmationDialog;