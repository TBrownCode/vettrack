// src/components/UpdateConfirmation.js - Fixed with close button
import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../styles/UpdateConfirmation.css';

const UpdateConfirmation = ({ onClose }) => {
  useEffect(() => {
    // Automatically dismiss after 3 seconds
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className="update-confirmation-overlay" onClick={handleClose}>
      <div className="update-confirmation" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header">
          <button className="close-button" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="confirmation-content">
          <FontAwesomeIcon icon={faCheckCircle} className="confirmation-icon" />
          <h3>Update Sent!</h3>
          <p>The owner has been notified about their pet's status.</p>
          <button className="ok-button" onClick={handleClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateConfirmation;