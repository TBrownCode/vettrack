import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faQrcode, faChevronDown, faCheck, faPaperPlane, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getPatientById, updatePatientStatus, deletePatient } from '../services/patientService';
import '../styles/PatientDetail.css';
import CameraCapture from '../components/CameraCapture';
import { updatePatientPhoto } from '../services/patientService';
import SimpleCameraCapture from '../components/SimpleCameraCapture';

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

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handleCapturePhoto = async (photoData) => {
    console.log("Photo captured! Data length:", photoData?.length || 0);
    // Add a simple validation check for the image data
    if (!photoData || photoData.length < 1000) {
      console.error("Invalid photo data received");
      alert("Photo couldn't be captured. Please try again.");
      return;
    }
    
    try {
      // Show some kind of loading indicator
      setLoading(true);
      
      const updatedPatient = await updatePatientPhoto(id, photoData);
      console.log("Patient photo updated successfully");
      
      setPatient(updatedPatient);
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
    // In a real implementation, this would generate a QR code
    setTimeout(() => {
      alert('QR code generation will be implemented in the next phase');
      setShowQRCode(false);
    }, 500);
  };

  const handleSendUpdate = () => {
    // Navigate to send update page (to be implemented later)
    alert('Send update functionality will be implemented in the next phase');
    // navigate(`/send-update/${id}`);
  };

  // Add this delete handler function
  const handleDeletePatient = async () => {
    if (window.confirm(`Are you sure you want to delete ${patient.name}?`)) {
      try {
        await deletePatient(id);
        // Navigate back to the home page
        navigate('/');
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient');
      }
    }
  };

  if (loading) {
    return <div className="loading-container">Loading patient details...</div>;
  }

  if (error || !patient) {
    return <div className="error-container">{error || 'Patient not found'}</div>;
  }

  // Helper function to get status style class
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
        
        <button 
          className="action-button secondary"
          onClick={handleTakePhoto}
        >
          <FontAwesomeIcon icon={faCamera} />
          Take New Photo
        </button>
        
        <button 
          className="action-button secondary"
          onClick={handleGenerateQR}
        >
          <FontAwesomeIcon icon={faQrcode} />
          View/Print QR Code
        </button>
        
        {/* Add this button */}
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
    </div>
  );
};

export default PatientDetail;