// src/pages/Home.js - Enhanced with automatic welcome emails
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faQrcode, faPlus } from '@fortawesome/free-solid-svg-icons';
import PatientCard from '../components/PatientCard';
import NewPatientForm from '../components/NewPatientForm';
import QRCodeScanner from '../components/QRCodeScanner';
import { getPatients, addPatient, deletePatient, sendPatientUpdate } from '../services/patientService';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const navigate = useNavigate();
  
  const { user } = useAuth();

  useEffect(() => {
    // Fetch patients
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced function to send welcome email
  const sendWelcomeEmail = async (patient) => {
    try {
      const welcomeMessage = `Welcome to our clinic! ${patient.name} has been successfully checked in and is now being cared for by our team.`;
      
      const welcomeData = {
        patientId: patient.id,
        messageType: 'general_update',
        message: welcomeMessage,
        sendVia: 'email',
        includePhoto: !!patient.photoUrl,
        recipientName: patient.owner,
        recipientContact: patient.phone,
        recipientEmail: patient.email,
      };

      console.log('Sending welcome email to:', patient.email);
      const result = await sendPatientUpdate(welcomeData);
      
      if (result.success) {
        console.log('Welcome email sent successfully!');
        // Show a brief success notification
        showNotification(`Welcome email sent to ${patient.owner}!`, 'success');
      } else {
        console.error('Welcome email failed:', result.message);
        showNotification(`Welcome email failed: ${result.message}`, 'warning');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      showNotification('Welcome email could not be sent', 'warning');
    }
  };

  // Simple notification system
  const showNotification = (message, type = 'info') => {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      background-color: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#17a2b8'};
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 4000);
  };
  
  const handleAddPatient = async (newPatient) => {
    try {
      setIsAddingPatient(true);
      console.log('Creating new patient:', newPatient);
      
      // Step 1: Save the patient to database
      const savedPatient = await addPatient(newPatient);
      console.log('Patient saved successfully:', savedPatient);
      
      // Step 2: Add the new patient to the state
      setPatients(prevPatients => [savedPatient, ...prevPatients]);
      
      // Step 3: Close the form
      setShowAddForm(false);
      
      // Step 4: Send welcome email automatically (if email provided)
      if (savedPatient.email && savedPatient.email.trim()) {
        console.log('Sending welcome email...');
        // Small delay to ensure the patient is fully created
        setTimeout(() => {
          sendWelcomeEmail(savedPatient);
        }, 1000);
      } else {
        console.log('No email provided, skipping welcome email');
      }
      
      // Show success message
      showNotification(`${savedPatient.name} has been successfully checked in!`, 'success');
      
    } catch (error) {
      console.error('Error adding patient:', error);
      showNotification('Failed to add patient: ' + (error.message || 'Unknown error'), 'warning');
    } finally {
      setIsAddingPatient(false);
    }
  };

  // Delete handler function
  const handleDeletePatient = async (id) => {
    try {
      setLoading(true);
      await deletePatient(id);
      
      // Remove the patient from state
      setPatients(prevPatients => prevPatients.filter(p => p.id !== id));
      showNotification('Patient deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting patient:', error);
      showNotification('Failed to delete patient', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // QR scanning handler
  const handleScanSuccess = (patientId) => {
    // Navigate to patient details
    navigate(`/patient/${patientId}`);
    setShowScanner(false);
  };

  return (
    <div className="home-container">
      {/* Search Section */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search patients..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="patients-list">
        {loading ? (
          <div className="loading">Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="no-results">No patients found</div>
        ) : (
          filteredPatients.map(patient => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onClick={() => navigate(`/patient/${patient.id}`)} 
              onDelete={handleDeletePatient}
            />
          ))
        )}
      </div>

      {/* Scan QR button */}
      <button 
        className="scan-button" 
        onClick={() => setShowScanner(true)}
        aria-label="Scan QR code"
      >
        <FontAwesomeIcon icon={faQrcode} />
      </button>
      
      {/* Add patient button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: isAddingPatient ? '#28a745' : '#34a853',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          border: 'none',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 5,
          cursor: isAddingPatient ? 'not-allowed' : 'pointer',
          opacity: isAddingPatient ? 0.7 : 1
        }}
        onClick={() => !isAddingPatient && setShowAddForm(true)}
        aria-label="Add new patient"
        disabled={isAddingPatient}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
      
      {/* Add new patient form */}
      {showAddForm && (
        <NewPatientForm 
          onSave={handleAddPatient}
          onCancel={() => setShowAddForm(false)}
          isLoading={isAddingPatient}
        />
      )}
      
      {/* QR code scanner */}
      {showScanner && (
        <QRCodeScanner 
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Home;