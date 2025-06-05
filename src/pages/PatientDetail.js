// src/pages/PatientDetail.js - Complete file with all changes
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faQrcode, faChevronDown, faCheck, faPaperPlane, faTrash, faHistory, faUndo, faPlus, faImages } from '@fortawesome/free-solid-svg-icons';
import { getPatientById, updatePatientStatus, deletePatient, sendPatientUpdate, clearPatientStatusHistory, deleteLastStatusUpdate, addStatusPhoto, deleteStatusPhotos } from '../services/patientService';
import '../styles/PatientDetail.css';
import { updatePatientPhoto } from '../services/patientService';
import SimpleCameraCapture from '../components/SimpleCameraCapture';
import QRCodeGenerator from '../components/QRCodeGenerator';
import SendUpdateForm from '../components/SendUpdateForm';
import UpdateConfirmation from '../components/UpdateConfirmation';

const statusOptions = [
  'Admitted',
  'Being Examined',
  'Awaiting Tests',
  'Test Results Pending',
  'Being Prepped for Surgery',
  'In Surgery',
  'In Recovery',
  'Awake & Responsive',
  'Ready for Discharge',
  'Discharged'
];

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSendUpdate, setShowSendUpdate] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cameraMode, setCameraMode] = useState('profile'); // 'profile' or 'status'
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPatient = async () => {
      try {
        const patientData = await getPatientById(id);
        setPatient(patientData);
      } catch (error) {
        console.error('Error loading patient:', error);
        setError('Could not load patient information');
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updatePatientStatus(id, newStatus);
      setPatient(prev => ({
        ...prev,
        status: newStatus,
        lastUpdate: new Date().toLocaleTimeString()
      }));
      setShowStatusDropdown(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  // Updated to handle both profile and status photos
  const handleTakePhoto = (mode = 'profile') => {
    setCameraMode(mode);
    setShowCamera(true);
  };

  const handleCapturePhoto = async (photoData) => {
    console.log(`Photo captured for ${cameraMode}! Data length:`, photoData?.length || 0);
    if (!photoData || photoData.length < 1000) {
      console.error("Invalid photo data received");
      alert("Photo couldn't be captured. Please try again.");
      return;
    }
    
    try {
      setLoading(true);
      
      if (cameraMode === 'profile') {
        // Update the main patient photo
        const updatedPatient = await updatePatientPhoto(id, photoData);
        console.log("Patient profile photo updated successfully");
        setPatient(updatedPatient);
      } else if (cameraMode === 'status') {
        // Add photo to current status
        await addStatusPhoto(id, patient.status, photoData);
        console.log("Status photo added successfully");
        alert(`Photo added to "${patient.status}" status successfully!`);
      }
      
      setShowCamera(false);
    } catch (error) {
      console.error('Error updating photo:', error);
      alert('Failed to update photo: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = () => {
    setShowQRCode(true);
  };

  const handleSendUpdate = () => {
    setShowSendUpdate(true);
  };

  const handleUpdateSent = async (updateData) => {
    try {
      await sendPatientUpdate(updateData);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error sending update:', error);
      alert('Failed to send update');
    }
  };

  const handleDeletePatient = async () => {
    if (window.confirm(`Are you sure you want to delete ${patient.name}?`)) {
      try {
        await deletePatient(id);
        navigate('/');
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient');
      }
    }
  };

  const handleDeleteLastStatus = async () => {
    if (window.confirm(`Are you sure you want to undo the last status update for ${patient.name}? This will revert to the previous status.`)) {
      try {
        setLoading(true);
        const result = await deleteLastStatusUpdate(id);
        
        const updatedPatient = await getPatientById(id);
        setPatient(updatedPatient);
        
        alert(`Success! ${result.message}`);
      } catch (error) {
        console.error('Error deleting last status update:', error);
        alert('Failed to delete last status update: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearStatusHistory = async () => {
    if (window.confirm(`Are you sure you want to clear ${patient.name}'s status history? This will reset them back to "Admitted" status and cannot be undone.`)) {
      try {
        setLoading(true);
        await clearPatientStatusHistory(id);
        
        const updatedPatient = await getPatientById(id);
        setPatient(updatedPatient);
        
        alert('Status history cleared successfully. Patient has been reset to "Admitted" status.');
      } catch (error) {
        console.error('Error clearing status history:', error);
        alert('Failed to clear status history: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  // NEW: Handle delete photos from current status
  const handleDeleteStatusPhotos = async () => {
    if (window.confirm(`Are you sure you want to delete all photos from ${patient.name}'s current status "${patient.status}"? This cannot be undone.`)) {
      try {
        setLoading(true);
        const result = await deleteStatusPhotos(id, patient.status);
        
        alert(`Success! ${result.message}`);
      } catch (error) {
        console.error('Error deleting status photos:', error);
        alert('Failed to delete photos: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="loading-container">Loading patient details...</div>;
  }

  if (error || !patient) {
    return <div className="error-container">{error || 'Patient not found'}</div>;
  }

  const getStatusStyle = (status) => {
    if (status.includes('Surgery')) return 'status-surgery';
    if (status.includes('Recovery')) return 'status-recovery';
    if (status === 'Admitted') return 'status-admitted';
    if (status.includes('Discharge')) return 'status-discharge';
    return 'status-default';
  };

  return (
    <div className="patient-detail-container">
      <div className="patient-header">
        <div className="patient-avatar-large">
          <img src={patient.photoUrl || '/images/placeholder-pet.png'} alt={patient.name} />
          {/* New overlay camera button for profile photo */}
          <button 
            className="photo-overlay-button"
            onClick={() => handleTakePhoto('profile')}
            title="Update profile photo"
          >
            <FontAwesomeIcon icon={faCamera} />
          </button>
        </div>
        <div className="patient-header-info">
          <h2 className="patient-name-large">{patient.name}</h2>
          <p className="patient-species">{patient.breed} {patient.species}</p>
          <p className="patient-owner-info">Owner: {patient.owner}</p>
          <p className="patient-owner-info">Phone: {patient.phone}</p>
        </div>
      </div>

      <div className="status-section">
        <h3 className="section-title">Current Status</h3>
        <div className="status-dropdown-container">
          <button 
            className="status-dropdown-button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span className={`status-badge ${getStatusStyle(patient.status)}`}>
              {patient.status}
            </span>
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
          
          {showStatusDropdown && (
            <div className="status-options-dropdown">
              {statusOptions.map(status => (
                <button 
                  key={status} 
                  className="status-option"
                  onClick={() => handleStatusChange(status)}
                >
                  {status === patient.status && <FontAwesomeIcon icon={faCheck} className="status-selected-icon" />}
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="last-updated">Last updated: {patient.lastUpdate}</p>
      </div>

      <div className="action-buttons">
        <button 
          className="action-button primary"
          onClick={handleSendUpdate}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
          Send Update to Owner
        </button>
        
        {/* Replaced "Take New Photo" with "Add Photo to Current Status" */}
        <button 
          className="action-button secondary"
          onClick={() => handleTakePhoto('status')}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Photo to Current Status
        </button>
        
        <button 
          className="action-button secondary"
          onClick={handleGenerateQR}
        >
          <FontAwesomeIcon icon={faQrcode} />
          View/Print QR Code
        </button>
        
        <button 
          className="action-button secondary"
          onClick={handleDeleteLastStatus}
        >
          <FontAwesomeIcon icon={faUndo} />
          Undo Last Status
        </button>
        
        <button 
          className="action-button secondary"
          onClick={handleClearStatusHistory}
        >
          <FontAwesomeIcon icon={faHistory} />
          Clear Status History
        </button>
        
        {/* NEW: Delete photos from current status button */}
        <button 
          className="action-button secondary"
          onClick={handleDeleteStatusPhotos}
        >
          <FontAwesomeIcon icon={faImages} />
          Delete Photos from Current Status
        </button>
        
        <button 
          className="action-button danger"
          onClick={handleDeletePatient}
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete Patient
        </button>
      </div>
      
      {showCamera && (
        <SimpleCameraCapture
          onCapture={handleCapturePhoto}
          onClose={() => setShowCamera(false)}
        />
      )}
      
      {showQRCode && (
        <QRCodeGenerator 
          patient={patient}
          onClose={() => setShowQRCode(false)}
        />
      )}
      
      {showSendUpdate && (
        <SendUpdateForm
          patient={patient}
          onSend={handleUpdateSent}
          onClose={() => setShowSendUpdate(false)}
        />
      )}
      
      {showConfirmation && (
        <UpdateConfirmation
          onDismiss={() => setShowConfirmation(false)}
        />
      )}
    </div>
  );
};

export default PatientDetail;