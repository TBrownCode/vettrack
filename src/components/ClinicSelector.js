// src/components/ClinicSelector.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { getClinicId, getClinicDisplayName, switchClinic } from '../lib/supabase';
import '../styles/ClinicSelector.css';

const ClinicSelector = ({ showInProduction = false }) => {
  const [currentClinic, setCurrentClinic] = useState(getClinicId());
  const [isOpen, setIsOpen] = useState(false);
  
  // Available clinics
  const clinics = [
    {
      id: 'happypaws',
      name: 'Happy Paws Veterinary',
      color: '#4285f4',
      description: 'Original clinic database'
    },
    {
      id: 'cityanimalhospital', 
      name: 'City Animal Hospital',
      color: '#34a853',
      description: 'Second clinic database'
    }
  ];

  // Don't show in production unless explicitly enabled
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  if (isProduction && !showInProduction) {
    return null;
  }

  const handleClinicSwitch = (clinicId) => {
    setCurrentClinic(clinicId);
    setIsOpen(false);
    switchClinic(clinicId); // This will reload the page with new database connection
  };

  const currentClinicInfo = clinics.find(c => c.id === currentClinic) || clinics[0];

  return (
    <div className="clinic-selector-container">
      <div className="clinic-selector-label">
        <FontAwesomeIcon icon={faBuilding} />
        Current Clinic:
      </div>
      
      <div className="clinic-dropdown">
        <button 
          className="clinic-dropdown-button"
          onClick={() => setIsOpen(!isOpen)}
          style={{ borderColor: currentClinicInfo.color }}
        >
          <div className="clinic-info">
            <div 
              className="clinic-color-indicator"
              style={{ backgroundColor: currentClinicInfo.color }}
            />
            <div className="clinic-details">
              <span className="clinic-name">{currentClinicInfo.name}</span>
              <span className="clinic-description">{currentClinicInfo.description}</span>
            </div>
          </div>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="clinic-dropdown-menu">
            {clinics.map(clinic => (
              <button
                key={clinic.id}
                className={`clinic-option ${clinic.id === currentClinic ? 'active' : ''}`}
                onClick={() => handleClinicSwitch(clinic.id)}
              >
                <div 
                  className="clinic-color-indicator"
                  style={{ backgroundColor: clinic.color }}
                />
                <div className="clinic-details">
                  <span className="clinic-name">{clinic.name}</span>
                  <span className="clinic-description">{clinic.description}</span>
                </div>
                {clinic.id === currentClinic && (
                  <div className="active-indicator">✓</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicSelector;