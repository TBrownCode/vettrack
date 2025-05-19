// src/components/SendUpdateForm.js
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
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        // Include other relevant fields
      };
      
      // In a real app, this would send the actual message
      // For now, we'll simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the onSend callback with the update data
      if (onSend) {
        onSend(updateData);
      }
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error sending update:', error);
      alert('Failed to send update. Please try again.');
      setSending(false);
    }
  };
  
  return (
    <div className="send-update-container">
      <div className="update-header">
        <h3>Send Update to Owner</h3>
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
              />
              <span>SMS</span>
            </label>
            <label className="method-option">
              <input
                type="radio"
                name="sendMethod"
                value="email"
                checked={sendMethod === 'email'}
                onChange={() => setSendMethod('email')}
              />
              <span>Email</span>
            </label>
            <label className="method-option">
              <input
                type="radio"
                name="sendMethod"
                value="both"
                checked={sendMethod === 'both'}
                onChange={() => setSendMethod('both')}
              />
              <span>Both</span>
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
            type="button" 
            className="cancel-button"
            onClick={onClose}
            disabled={sending}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="send-button"
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Update'}
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendUpdateForm;