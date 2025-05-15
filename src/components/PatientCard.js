// src/components/PatientCard.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import '../styles/PatientCard.css';

const PatientCard = ({ patient, onClick, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false);
  
  // Get appropriate status styles
  const getStatusStyle = (status) => {
    if (status.includes('Surgery')) return 'status-surgery';
    if (status.includes('Recovery')) return 'status-recovery';
    if (status === 'Admitted') return 'status-admitted';
    if (status.includes('Discharge')) return 'status-discharge';
    return 'status-default';
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
        <p className="patient-breed">{patient.species} • {patient.breed}</p>
        <p className="patient-owner">Owner: {patient.owner}</p>
        <div className={`patient-status ${getStatusStyle(patient.status)}`}>
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