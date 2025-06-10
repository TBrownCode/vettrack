// src/components/StatusProtectionDialog.js - FIXED version with consistent delay protection
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExclamationTriangle, 
  faTimes, 
  faCheck, 
  faUndo,
  faClock,
  faHeartbeat,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

const StatusProtectionDialog = ({ 
  isOpen, 
  status, 
  patientName,
  onConfirm, 
  onCancel,
  protectionType = 'confirmation' // 'confirmation', 'delay', 'double-confirm'
}) => {
  const [countdown, setCountdown] = useState(5);
  const [isDelayComplete, setIsDelayComplete] = useState(false);
  const [hasConfirmedFirst, setHasConfirmedFirst] = useState(false);

  // FIXED: Reset states when dialog opens and ensure delay starts properly
  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setIsDelayComplete(false);
      setHasConfirmedFirst(false);
      
      // FIXED: For delay protection, explicitly set delay as incomplete
      if (protectionType === 'delay') {
        setIsDelayComplete(false);
      }
    }
  }, [isOpen, protectionType]); // Added protectionType as dependency

  // FIXED: Countdown timer with proper cleanup and state management
  useEffect(() => {
    let timer = null;
    
    if (isOpen && protectionType === 'delay' && countdown > 0 && !isDelayComplete) {
      timer = setTimeout(() => {
        setCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            setIsDelayComplete(true);
            return 0;
          }
          return newCount;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isOpen, protectionType, countdown, isDelayComplete]);

  if (!isOpen) return null;

  const getCriticalStatusConfig = (statusName) => {
    const criticalStatuses = {
      'In Surgery': {
        icon: faHeartbeat,
        color: '#ea4335',
        title: 'Critical Status Warning',
        warningText: 'This will notify the owner that their pet is currently in surgery.',
        consequences: 'The owner will receive immediate notifications and may become concerned.'
      },
      'Being Prepped for Surgery': {
        icon: faExclamationTriangle,
        color: '#ff9800',
        title: 'Surgery Preparation Warning',
        warningText: 'This indicates the pet is being prepared for a surgical procedure.',
        consequences: 'The owner will be notified that surgery preparation has begun.'
      },
      'Emergency Care': {
        icon: faExclamationTriangle,
        color: '#ea4335',
        title: 'Emergency Status Warning',
        warningText: 'This will alert the owner that their pet requires emergency care.',
        consequences: 'This may cause significant concern for the pet owner.'
      }
    };
    
    return criticalStatuses[statusName] || {
      icon: faExclamationTriangle,
      color: '#ff9800',
      title: 'Important Status Change',
      warningText: `This will change the status to "${statusName}".`,
      consequences: 'The owner will be notified of this status change.'
    };
  };

  const config = getCriticalStatusConfig(status);

  const handleFirstConfirm = () => {
    if (protectionType === 'double-confirm') {
      setHasConfirmedFirst(true);
    } else {
      onConfirm();
    }
  };

  const handleFinalConfirm = () => {
    onConfirm();
  };

  // FIXED: Delay protection with proper button state management
  const renderDelayProtection = () => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '450px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: config.color,
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
          <FontAwesomeIcon icon={faClock} />
          Status Change Pending
        </h3>
      </div>
      
      {/* Content */}
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{
          fontSize: '3rem',
          color: config.color,
          marginBottom: '16px'
        }}>
          <FontAwesomeIcon icon={config.icon} />
        </div>
        
        <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>
          {patientName} → "{status}"
        </h4>
        
        <p style={{ 
          margin: '0 0 20px 0', 
          fontSize: '1rem', 
          lineHeight: '1.5',
          color: '#666'
        }}>
          {config.warningText}
        </p>
        
        {/* FIXED: Countdown logic - only show countdown if delay is NOT complete */}
        {!isDelayComplete && countdown > 0 ? (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#856404',
              marginBottom: '8px'
            }}>
              {countdown}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#856404' }}>
              Applying status change in {countdown} seconds...
              <br />Click Cancel to stop this change.
            </p>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            backgroundColor: '#d4edda',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#155724' }}>
              ✓ Ready to apply status change
            </p>
          </div>
        )}
        
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FontAwesomeIcon icon={faUndo} />
            Cancel Change
          </button>
          
          {/* FIXED: Only show Apply button when delay is actually complete */}
          {isDelayComplete && (
            <button
              onClick={handleFinalConfirm}
              style={{
                padding: '12px 24px',
                backgroundColor: config.color,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FontAwesomeIcon icon={faCheck} />
              Apply Status
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDoubleConfirm = () => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '450px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: config.color,
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
          <FontAwesomeIcon icon={config.icon} />
          {hasConfirmedFirst ? 'Final Confirmation' : config.title}
        </h3>
      </div>
      
      {/* Content */}
      <div style={{ padding: '24px', textAlign: 'center' }}>
        {!hasConfirmedFirst ? (
          <>
            <div style={{
              fontSize: '3rem',
              color: config.color,
              marginBottom: '16px'
            }}>
              <FontAwesomeIcon icon={config.icon} />
            </div>
            
            <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>
              Change {patientName}'s status to "{status}"?
            </h4>
            
            <p style={{ 
              margin: '0 0 16px 0', 
              fontSize: '1rem', 
              lineHeight: '1.5',
              color: '#666'
            }}>
              {config.warningText}
            </p>
            
            <div style={{
              padding: '12px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #ffeaa7'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#856404' }}>
                <strong>⚠️ Warning:</strong> {config.consequences}
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: '2.5rem',
              color: '#ea4335',
              marginBottom: '16px'
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            
            <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>
              Are you absolutely sure?
            </h4>
            
            <p style={{ 
              margin: '0 0 20px 0', 
              fontSize: '1rem', 
              lineHeight: '1.5',
              color: '#666'
            }}>
              This will immediately notify {patientName}'s owner that their pet is "{status}".
              This action cannot be easily undone.
            </p>
          </>
        )}
        
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
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={hasConfirmedFirst ? handleFinalConfirm : handleFirstConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: hasConfirmedFirst ? '#ea4335' : config.color,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {hasConfirmedFirst ? 'Yes, Apply Status' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStandardConfirm = () => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '400px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: config.color,
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
          <FontAwesomeIcon icon={config.icon} />
          {config.title}
        </h3>
      </div>
      
      {/* Content */}
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ 
          margin: '0 0 16px 0', 
          fontSize: '1rem', 
          lineHeight: '1.5',
          color: '#333'
        }}>
          Change {patientName}'s status to <strong>"{status}"</strong>?
        </p>
        
        <p style={{ 
          margin: '0 0 20px 0', 
          fontSize: '0.875rem', 
          lineHeight: '1.4',
          color: '#666'
        }}>
          {config.warningText}
        </p>
        
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
              fontWeight: '500'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleFinalConfirm}
            style={{
              padding: '12px 24px',
              backgroundColor: config.color,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Confirm Status
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {protectionType === 'delay' && renderDelayProtection()}
      {protectionType === 'double-confirm' && renderDoubleConfirm()}
      {protectionType === 'confirmation' && renderStandardConfirm()}
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StatusProtectionDialog;