// src/components/SendUpdateForm.js - Updated with cancel button moved below
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPaperPlane, faImage } from '@fortawesome/free-solid-svg-icons';
import '../styles/SendUpdateForm.css';

const MESSAGE_TEMPLATES = {
  'status_update': 'Just updating you on {pet_name}\'s status. They are now {status}.',
  'ready_pickup': '{pet_name} is ready to be picked up! Their current status is: {status}.',
  'post_surgery': '{pet_name}\'s surgery is complete. Their current status is: {status}.',
  'medication': '{pet_name} has received their medication. Their current status is: {status}.',
  'general_update': 'Here\'s an update on {pet_name}. Their current status is: {status}.'
};

const SendUpdateForm = ({ patient, onSend, onClose }) => {
  const [messageType, setMessageType] = useState('status_update');
  const [customMessage, setCustomMessage] = useState('');
  const [sendMethod, setSendMethod] = useState('both'); // 'sms', 'email', or 'both'
  const [includePhoto, setIncludePhoto] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Generate message text from template and patient data
  const getMessageText = () => {
    let template = MESSAGE_TEMPLATES[messageType] || '';
    
    // Replace placeholders with actual values
    let message = template
      .replace('{pet_name}', patient.name)
      .replace('{status}', patient.status);
    
    // Add status tracker link
    const statusUrl = `${window.location.origin}/status/${patient.id}`;
    message += `\n\nTrack ${patient.name}'s status in real-time: ${statusUrl}`;
    
    return message;
  };
  
  // Combine template and custom message
  const getFullMessage = () => {
    const templateText = getMessageText();
    
    if (customMessage.trim()) {
      return `${templateText}\n\n${customMessage}`;
    }
    
    return templateText;
  };
  
  // Check if we can send via the selected method
  const canSendViaMethod = (method) => {
    if (method === 'sms' || method === 'both') {
      if (!patient.phone) return false;
    }
    if (method === 'email' || method === 'both') {
      if (!patient.email) return false;
    }
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that we have the necessary contact info
    if (!canSendViaMethod(sendMethod)) {
      alert(`Cannot send via ${sendMethod}. Missing ${sendMethod === 'sms' ? 'phone number' : sendMethod === 'email' ? 'email address' : 'phone number or email address'}.`);
      return;
    }
    
    try {
      setSending(true);
      
      // Prepare update data
      const updateData = {
        patientId: patient.id,
        messageType,
        message: getFullMessage(),
        sendVia: sendMethod,
        includePhoto,
        timestamp: new Date().toISOString(),
        recipientName: patient.owner,
        recipientContact: patient.phone,
        recipientEmail: patient.email, // Include email
      };
      
      // Call the onSend callback with the update data
      if (onSend) {
        await onSend(updateData);
      }
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error sending update:', error);
      alert('Failed to send update: ' + (error.message || 'Unknown error'));
      setSending(false);
    }
  };
  
  return (
    <div className="send-update-container">
      <div className="update-header">
        <h3>Send Message to Owner</h3>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="update-form">
        <div className="patient-info-summary">
          <div className="patient-photo-small">
            <img 
              src={patient.photoUrl || '/images/placeholder-pet.png'} 
              alt={patient.name} 
            />
          </div>
          <div className="patient-info-text">
            <h4>{patient.name}</h4>
            <p>{patient.species} • {patient.breed}</p>
            <p className="owner-info">Owner: {patient.owner}</p>
            <p className="contact-info">📱 {patient.phone || 'No phone'}</p>
            <p className="contact-info">📧 {patient.email || 'No email'}</p>
            <p className="current-status">Status: {patient.status}</p>
          </div>
        </div>
        
        <div className="form-row">
          <label htmlFor="messageType">Update Type</label>
          <select 
            id="messageType" 
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
          >
            <option value="status_update">Status Update</option>
            <option value="ready_pickup">Ready for Pickup</option>
            <option value="post_surgery">Post-Surgery Update</option>
            <option value="medication">Medication Given</option>
            <option value="general_update">General Update</option>
          </select>
        </div>
        
        <div className="form-row">
          <label>Message Preview</label>
          <div className="message-preview">
            {getMessageText()}
          </div>
        </div>
        
        <div className="form-row">
          <label htmlFor="customMessage">Additional Notes (Optional)</label>
          <textarea
            id="customMessage"
            rows="3"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add any additional information here..."
          ></textarea>
        </div>
        
        <div className="form-row">
          <label>Send Via</label>
          <div className="send-method-options">
            <label className="method-option">
              <input
                type="radio"
                name="sendMethod"
                value="sms"
                checked={sendMethod === 'sms'}
                onChange={() => setSendMethod('sms')}
                disabled={!patient.phone}
              />
              <span style={{ opacity: !patient.phone ? 0.5 : 1 }}>
                SMS {!patient.phone && '(No phone)'}
              </span>
            </label>
            <label className="method-option">
              <input
                type="radio"
                name="sendMethod"
                value="email"
                checked={sendMethod === 'email'}
                onChange={() => setSendMethod('email')}
                disabled={!patient.email}
              />
              <span style={{ opacity: !patient.email ? 0.5 : 1 }}>
                Email {!patient.email && '(No email)'}
              </span>
            </label>
            <label className="method-option">
              <input
                type="radio"
                name="sendMethod"
                value="both"
                checked={sendMethod === 'both'}
                onChange={() => setSendMethod('both')}
                disabled={!patient.phone || !patient.email}
              />
              <span style={{ opacity: (!patient.phone || !patient.email) ? 0.5 : 1 }}>
                Both {(!patient.phone || !patient.email) && '(Missing contact info)'}
              </span>
            </label>
          </div>
        </div>
        
        <div className="form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includePhoto}
              onChange={(e) => setIncludePhoto(e.target.checked)}
            />
            <span>Include Latest Photo</span>
          </label>
        </div>
        
        {includePhoto && patient.photoUrl && (
          <div className="photo-preview">
            <img 
              src={patient.photoUrl} 
              alt={`${patient.name} - Latest Photo`} 
            />
            <FontAwesomeIcon icon={faImage} className="photo-icon" />
          </div>
        )}
        
        <div className="form-buttons">
          <button 
            type="submit" 
            className="send-button"
            disabled={sending || !canSendViaMethod(sendMethod)}
          >
            {sending ? 'Sending...' : `Send Message via ${sendMethod.toUpperCase()}`}
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendUpdateForm;