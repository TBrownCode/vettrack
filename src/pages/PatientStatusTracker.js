// src/pages/PatientStatusTracker.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSpinner, faPaw } from '@fortawesome/free-solid-svg-icons';
import { getPatientById } from '../services/patientService';
import '../styles/PatientStatusTracker.css';

const PatientStatusTracker = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadPatient = async () => {
      try {
        const patientData = await getPatientById(id);
        setPatient(patientData);
      } catch (error) {
        console.error('Error loading patient:', error);
        setError('Could not find pet information. Please check the link or contact the clinic.');
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
    
    // Set up auto-refresh every minute to show real-time updates
    const refreshInterval = setInterval(() => {
      loadPatient();
    }, 60000); // 1 minute refresh
    
    return () => clearInterval(refreshInterval);
  }, [id]);
  
  // Helper function to get status style class
  const getStatusStyle = (status) => {
    if (status.includes('Surgery')) return 'status-surgery';
    if (status.includes('Recovery')) return 'status-recovery';
    if (status === 'Admitted') return 'status-admitted';
    if (status.includes('Discharge')) return 'status-discharge';
    return 'status-default';
  };
  
  if (loading) {
    return (
      <div className="status-tracker-container loading-state">
        <div className="loading-animation">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Loading pet information...</p>
        </div>
      </div>
    );
  }
  
  if (error || !patient) {
    return (
      <div className="status-tracker-container error-state">
        <div className="error-message">
          <FontAwesomeIcon icon={faPaw} />
          <h2>Pet Not Found</h2>
          <p>{error}</p>
          <Link to="/" className="home-link">Go to Home</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="status-tracker-container">
      <header className="tracker-header">
        <h1><FontAwesomeIcon icon={faPaw} /> VetTrack</h1>
      </header>
      
      <div className="pet-status-card">
        <div className="pet-photo">
          <img 
            src={patient.photoUrl || '/images/placeholder-pet.png'} 
            alt={patient.name} 
          />
        </div>
        
        <h2 className="pet-name">{patient.name}</h2>
        <p className="pet-info">{patient.species} • {patient.breed}</p>
        
        <div className="status-display">
          <h3>Current Status</h3>
          <div className={`status-badge-large ${getStatusStyle(patient.status)}`}>
            {patient.status}
          </div>
          <p className="status-time">Last Updated: {patient.lastUpdate}</p>
        </div>
        
        <div className="status-message">
          {patient.status === 'In Surgery' && (
            <p>Your pet is currently in surgery. We'll update this status when they're moved to recovery.</p>
          )}
          {patient.status === 'In Recovery' && (
            <p>Your pet's surgery is complete and they're now in recovery. The vet will contact you soon.</p>
          )}
          {patient.status === 'Ready for Discharge' && (
            <p>Great news! Your pet is ready to go home. Please contact us to arrange pickup.</p>
          )}
          {patient.status === 'Admitted' && (
            <p>Your pet has been admitted and is being cared for by our team.</p>
          )}
          {/* Add more conditional messages based on status */}
        </div>
        
        <div className="clinic-info">
          <p>If you have any questions, please contact us at:</p>
          <p className="contact">Phone: (555) 123-4567</p>
          <p className="contact">Email: info@vetclinic.com</p>
        </div>
        
        <div className="refresh-note">
          <p>This page automatically refreshes to show the latest information.</p>
        </div>
      </div>
      
      <footer className="tracker-footer">
        <p>&copy; 2025 VetTrack • Pet Status Tracking System</p>
      </footer>
    </div>
  );
};

export default PatientStatusTracker;