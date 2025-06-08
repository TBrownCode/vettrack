// src/pages/PatientDetail.js - Complete file with working status protection using simple approach
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, 
  faQrcode, 
  faChevronDown, 
  faCheck, 
  faPaperPlane, 
  faTrash, 
  faHistory, 
  faUndo, 
  faPlus, 
  faImages, 
  faExternalLinkAlt, 
  faCopy, 
  faTimes, 
  faEllipsisV,
  faCog,
  faShieldAlt // Icon for protected statuses
} from '@fortawesome/free-solid-svg-icons';
import { getPatientById, updatePatientStatus, deletePatient, sendPatientUpdate, clearPatientStatusHistory, deleteLastStatusUpdate, addStatusPhoto, deleteStatusPhotos } from '../services/patientService';
import { getAllStatusOptions } from '../services/statusService';
import StatusProtectionDialog from '../components/StatusProtectionDialog';
import '../styles/PatientDetail.css';
import { updatePatientPhoto } from '../services/patientService';
import SimpleCameraCapture from '../components/SimpleCameraCapture';
import QRCodeGenerator from '../components/QRCodeGenerator';
import SendUpdateForm from '../components/SendUpdateForm';
import UpdateConfirmation from '../components/UpdateConfirmation';
import StatusManagement from '../components/StatusManagement';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSendUpdate, setShowSendUpdate] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showStatusManagement, setShowStatusManagement] = useState(false);
  const [cameraMode, setCameraMode] = useState('profile');
  const [error, setError] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Simple protection dialog state
  const [protectionDialog, setProtectionDialog] = useState({
    isOpen: false,
    status: '',
    patientName: '',
    protectionType: 'confirmation',
    onConfirm: null,
    onCancel: null
  });

  useEffect(() => {
    const loadPatientAndStatuses = async () => {
      try {
        setLoading(true);
        setStatusLoading(true);
        
        const [patientData, statusOpts] = await Promise.all([
          getPatientById(id),
          getAllStatusOptions()
        ]);
        
        console.log('Loaded patient:', patientData);
        console.log('Loaded status options:', statusOpts);
        setPatient(patientData);
        setStatusOptions(statusOpts);
      } catch (error) {
        console.error('Error loading patient or statuses:', error);
        setError('Could not load patient information');
      } finally {
        setLoading(false);
        setStatusLoading(false);
      }
    };

    loadPatientAndStatuses();
  }, [id]);

  // Extract the actual status change logic
  const performStatusChange = async (newStatus) => {
    try {
      console.log('Performing status change to:', newStatus);
      await updatePatientStatus(id, newStatus);
      setPatient(prev => ({
        ...prev,
        status: newStatus,
        lastUpdate: new Date().toLocaleTimeString()
      }));
      setShowStatusDropdown(false);
      console.log('Status change completed successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  // FIXED: Simple status change handler with protection
  const handleStatusChange = async (newStatus) => {
    console.log('=== STATUS CHANGE ATTEMPT ===');
    console.log('Attempting to change status to:', newStatus);
    console.log('Available status options:', statusOptions);
    
    // Find the status option to check protection level
    const statusOption = statusOptions.find(opt => opt.value === newStatus);
    const protectionLevel = statusOption?.protection_level;
    
    console.log('Status option found:', statusOption);
    console.log('Protection level:', protectionLevel);
    
    // Check if protection is needed
    if (protectionLevel && protectionLevel !== 'none') {
      console.log('Protection required, showing dialog');
      
      // Show protection dialog
      setProtectionDialog({
        isOpen: true,
        status: newStatus,
        patientName: patient.name,
        protectionType: protectionLevel,
        onConfirm: async () => {
          console.log('Protection confirmed, proceeding with status change');
          await performStatusChange(newStatus);
          setProtectionDialog(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          console.log('Protection cancelled');
          setShowStatusDropdown(false);
          setProtectionDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      console.log('No protection needed, changing immediately');
      await performStatusChange(newStatus);
    }
  };

  // Helper function to check if status requires protection (for UI indicators)
  const requiresProtection = (statusName) => {
    if (!statusOptions || statusOptions.length === 0) return false;
    const statusOption = statusOptions.find(opt => opt.value === statusName);
    return statusOption?.protection_level && statusOption.protection_level !== 'none';
  };

  // Get protection description for tooltips
  const getProtectionDescription = (statusName) => {
    if (!statusOptions || statusOptions.length === 0) return 'Standard status change';
    
    const statusOption = statusOptions.find(opt => opt.value === statusName);
    const protectionType = statusOption?.protection_level;
    
    switch (protectionType) {
      case 'double-confirm':
        return 'Critical status - requires double confirmation';
      case 'delay':
        return 'Important status - 5 second delay with cancel option';
      case 'confirmation':
        return 'Sensitive status - requires confirmation';
      default:
        return 'Standard status change';
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
        const updatedPatient = await updatePatientPhoto(id, photoData);
        console.log("Patient profile photo updated successfully");
        setPatient(updatedPatient);
      } else if (cameraMode === 'status') {
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

  const handleViewStatusTracker = () => {
    const statusUrl = `${window.location.origin}/status/${id}`;
    window.open(statusUrl, '_blank');
  };

  const handleCopyStatusLink = async () => {
    const statusUrl = `${window.location.origin}/status/${id}`;
    try {
      await navigator.clipboard.writeText(statusUrl);
      alert('Status tracking link copied to clipboard! You can share this with the pet owner.');
    } catch (error) {
      console.error('Failed to copy link:', error);
      const textArea = document.createElement('textarea');
      textArea.value = statusUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Status tracking link copied to clipboard!');
    }
  };

  const handleProfilePhotoClick = (e) => {
    if (e.target.closest('.photo-overlay-button')) {
      return;
    }
    setShowPhotoModal(true);
  };

  const handleClosePhotoModal = () => {
    setShowPhotoModal(false);
  };

  const handleToggleStatusMenu = () => {
    setShowStatusMenu(!showStatusMenu);
  };

  const handleStatusManagementClose = async () => {
    setShowStatusManagement(false);
    // Refresh status options after managing them
    try {
      const updatedStatusOptions = await getAllStatusOptions();
      setStatusOptions(updatedStatusOptions);
      console.log('Refreshed status options after management:', updatedStatusOptions);
    } catch (error) {
      console.error('Error reloading status options:', error);
    }
  };

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusMenu && !event.target.closest('.status-menu-container')) {
        setShowStatusMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusMenu]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.status-dropdown-container')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown]);

  // Handle both default and custom status styling
  const getStatusStyle = (status) => {
    // First check if it's a default status
    const defaultStatusCSSMap = {
      'Admitted': 'status-admitted',
      'Being Examined': 'status-being-examined',
      'Awaiting Tests': 'status-awaiting-tests', 
      'Test Results Pending': 'status-test-results-pending',
      'Being Prepped for Surgery': 'status-being-prepped-for-surgery',
      'In Surgery': 'status-in-surgery',
      'In Recovery': 'status-in-recovery',
      'Awake & Responsive': 'status-awake-responsive', 
      'Ready for Discharge': 'status-ready-for-discharge',
      'Discharged': 'status-discharged'
    };
    
    // If it's a default status, use the predefined CSS class
    if (defaultStatusCSSMap[status]) {
      return defaultStatusCSSMap[status];
    }
    
    // For custom statuses, return a special class name
    return 'status-custom';
  };

  // Get current status color from statusOptions
  const getCurrentStatusColor = () => {
    const statusOption = statusOptions.find(opt => opt.value === patient?.status);
    return statusOption ? statusOption.color : '#5f6368';
  };

  // Convert hex color to background color with opacity
  const getCurrentStatusBgColor = () => {
    const color = getCurrentStatusColor();
    // Convert hex to rgba with low opacity for background
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };

  // Check if current status is custom
  const isCustomStatus = (status) => {
    const defaultStatuses = [
      'Admitted', 'Being Examined', 'Awaiting Tests', 'Test Results Pending',
      'Being Prepped for Surgery', 'In Surgery', 'In Recovery', 'Awake & Responsive',
      'Ready for Discharge', 'Discharged'
    ];
    return !defaultStatuses.includes(status);
  };

  if (loading) {
    return <div className="loading-container">Loading patient details...</div>;
  }

  if (error || !patient) {
    return <div className="error-container">{error || 'Patient not found'}</div>;
  }

  return (
    <div className="patient-detail-container">
      <div className="patient-header">
        <div className="patient-avatar-large" onClick={handleProfilePhotoClick} style={{ cursor: 'pointer' }}>
          <img src={patient.photoUrl || '/images/placeholder-pet.png'} alt={patient.name} />
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
        <div className="status-section-header">
          <h3 className="section-title">Current Status</h3>
          <div className="status-menu-container">
            <button 
              className="status-menu-button"
              onClick={handleToggleStatusMenu}
              aria-label="Status options"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            
            {showStatusMenu && (
              <div className="status-menu-dropdown">
                <button 
                  className="status-menu-item"
                  onClick={() => {
                    handleDeleteLastStatus();
                    setShowStatusMenu(false);
                  }}
                >
                  <FontAwesomeIcon icon={faUndo} />
                  Undo Last Status
                </button>
                <button 
                  className="status-menu-item"
                  onClick={() => {
                    handleClearStatusHistory();
                    setShowStatusMenu(false);
                  }}
                >
                  <FontAwesomeIcon icon={faHistory} />
                  Clear Status History
                </button>
                <button 
                  className="status-menu-item"
                  onClick={() => {
                    handleDeleteStatusPhotos();
                    setShowStatusMenu(false);
                  }}
                >
                  <FontAwesomeIcon icon={faImages} />
                  Delete Photos from Current Status
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="status-dropdown-container">
          <button 
            className="status-dropdown-button"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <span 
              className={`status-badge ${getStatusStyle(patient.status)}`}
              style={isCustomStatus(patient.status) ? {
                backgroundColor: getCurrentStatusBgColor(),
                color: getCurrentStatusColor()
              } : {}}
            >
              {patient.status}
              {/* Add protection indicator close to the end of text */}
              {requiresProtection(patient.status) && (
                <FontAwesomeIcon 
                  icon={faShieldAlt} 
                  style={{ marginLeft: '4px', fontSize: '0.8em' }}
                  title={getProtectionDescription(patient.status)}
                />
              )}
            </span>
            <FontAwesomeIcon icon={faChevronDown} />
          </button>
          
          {showStatusDropdown && (
            <div className="status-options-dropdown">
              {statusLoading ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                  Loading statuses...
                </div>
              ) : (
                statusOptions.map(status => (
                  <button 
                    key={status.value} 
                    className="status-option"
                    onClick={() => handleStatusChange(status.value)}
                  >
                    <div className="status-option-main">
                      {status.value === patient.status && (
                        <FontAwesomeIcon icon={faCheck} className="status-selected-icon" />
                      )}
                      <span style={{ color: status.color, marginRight: '8px', fontSize: '18px' }}>●</span>
                      
                      <span>{status.label}</span>
                      
                      {/* Add protection indicator close to the end of text */}
                      {requiresProtection(status.value) && (
                        <FontAwesomeIcon 
                          icon={faShieldAlt} 
                          style={{ 
                            color: '#ff9800', 
                            marginLeft: '4px', 
                            fontSize: '12px' 
                          }}
                          title={getProtectionDescription(status.value)}
                        />
                      )}
                    </div>
                  </button>
                ))
              )}
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
          Send Message to Owner
        </button>
        
        <button 
          className="action-button secondary"
          onClick={() => handleTakePhoto('status')}
        >
          <FontAwesomeIcon icon={faCamera} />
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
          onClick={handleViewStatusTracker}
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} />
          View Status Tracker
        </button>
        
        <button 
          className="action-button secondary"
          onClick={handleCopyStatusLink}
        >
          <FontAwesomeIcon icon={faCopy} />
          Copy Owner Link
        </button>
        
        <button 
          className="action-button secondary"
          onClick={() => setShowStatusManagement(true)}
        >
          <FontAwesomeIcon icon={faCog} />
          Manage Status Options
        </button>
        
        <button 
          className="action-button danger"
          onClick={handleDeletePatient}
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete Patient
        </button>
      </div>
      
      {/* FIXED: Simple Status Protection Dialog */}
      <StatusProtectionDialog
        isOpen={protectionDialog.isOpen}
        status={protectionDialog.status}
        patientName={protectionDialog.patientName}
        protectionType={protectionDialog.protectionType}
        onConfirm={protectionDialog.onConfirm}
        onCancel={protectionDialog.onCancel}
      />
      
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

      {showPhotoModal && (
        <div className="photo-modal" onClick={handleClosePhotoModal}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={handleClosePhotoModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img 
              src={patient.photoUrl || '/images/placeholder-pet.png'} 
              alt={patient.name}
              className="photo-modal-image"
            />
            <div className="photo-modal-caption">
              <h3>{patient.name}</h3>
              <p>{patient.species} • {patient.breed}</p>
            </div>
          </div>
        </div>
      )}

      {showStatusManagement && (
        <StatusManagement onClose={handleStatusManagementClose} />
      )}
    </div>
  );
};

export default PatientDetail;