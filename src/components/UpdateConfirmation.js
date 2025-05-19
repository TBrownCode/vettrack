// src/components/UpdateConfirmation.js
import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/UpdateConfirmation.css';

const UpdateConfirmation = ({ onDismiss }) => {
  useEffect(() => {
    // Automatically dismiss after 3 seconds
    const timer = setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <div className="update-confirmation">
      <div className="confirmation-content">
        <FontAwesomeIcon icon={faCheckCircle} className="confirmation-icon" />
        <h3>Update Sent!</h3>
        <p>The owner has been notified about their pet's status.</p>
      </div>
    </div>
  );
};

export default UpdateConfirmation;