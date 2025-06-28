// src/components/PatientCard.js - Updated with dynamic status colors and patient ID display
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { getAllStatusOptions } from '../services/statusService';
import '../styles/PatientCard.css';

const PatientCard = ({ patient, onClick, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  
  // Load status options to get dynamic colors
  useEffect(() => {
    const loadStatusOptions = async () => {
      try {
        const options = await getAllStatusOptions();
        setStatusOptions(options);
      } catch (error) {
        console.error('Error loading status options in PatientCard:', error);
      }
    };
    
    loadStatusOptions();
  }, []);
  
  // Get current status color and background from loaded options
  const getCurrentStatusStyle = () => {
    const statusOption = statusOptions.find(opt => opt.value === patient.status);
    
    if (statusOption) {
      // Convert hex color to rgba with low opacity for background
      const hex = statusOption.color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const backgroundColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
      
      return {
        backgroundColor: backgroundColor,
        color: statusOption.color
      };
    }
    
    // Fallback to default styling if status option not found
    return getStatusStyle(patient.status);
  };
  
  // Keep the old function as fallback for default statuses
  const getStatusStyle = (status) => {
    const styleMap = {
      'Admitted': { backgroundColor: '#e8f0fe', color: '#4285f4' },
      'Being Examined': { backgroundColor: '#fce8e6', color: '#ea4335' },
      'Awaiting Tests': { backgroundColor: '#fef7e0', color: '#fbbc05' },
      'Test Results Pending': { backgroundColor: '#fef7e0', color: '#fbbc05' },
      'Being Prepped for Surgery': { backgroundColor: '#fff0e8', color: '#fa903e' },
      'In Surgery': { backgroundColor: '#fce8e6', color: '#ea4335' },
      'In Recovery': { backgroundColor: '#e6f4ea', color: '#34a853' },
      'Awake & Responsive': { backgroundColor: '#e6f4ea', color: '#34a853' },
      'Ready for Discharge': { backgroundColor: '#f3e8fd', color: '#a142f4' },
      'Discharged': { backgroundColor: '#f3e8fd', color: '#a142f4' }
    };
    
    return styleMap[status] || { backgroundColor: '#f5f5f5', color: '#5f6368' };
  };
  
  const handleDelete = (e) => {
    // Stop event from propagating to parent (which would navigate to detail view)
    e.stopPropagation();
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete ${patient.name}?`)) {
      onDelete(patient.id);
    }
    // Hide options menu
    setShowOptions(false);
  };
  
  const toggleOptions = (e) => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  return (
    <div className="patient-card" onClick={onClick}>
      <div className="patient-avatar">
        <img src={patient.photoUrl || '/images/placeholder-pet.png'} alt={patient.name} />
      </div>
      <div className="patient-info">
        <h3 className="patient-name">{patient.name}</h3>
        <p className="patient-id">{patient.id}</p>
        <p className="patient-breed">{patient.species} • {patient.breed}</p>
        <p className="patient-owner">Owner: {patient.owner}</p>
        <div 
          className="patient-status"
          style={getCurrentStatusStyle()}
        >
          {patient.status}
        </div>
      </div>
      
      {/* Options button - moved to top right corner */}
      <button 
        className="patient-options-button"
        onClick={toggleOptions}
        aria-label="Patient options"
      >
        <FontAwesomeIcon icon={faEllipsisV} />
      </button>
      
      {/* Options menu */}
      {showOptions && (
        <div className="patient-options-menu">
          <button 
            className="patient-delete-option"
            onClick={handleDelete}
          >
            <FontAwesomeIcon icon={faTrash} /> Delete
          </button>
        </div>
      )}
      
      {/* Time moved to bottom right */}
      <div className="patient-time">
        {patient.lastUpdate}
      </div>
    </div>
  );
};

export default PatientCard;