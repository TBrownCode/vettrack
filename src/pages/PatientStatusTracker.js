// src/pages/PatientStatusTracker.js - Complete file with minimal grace period changes
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSpinner, 
  faPaw, 
  faCheck, 
  faClock, 
  faHourglassHalf,
  faCamera,
  faFileAlt,
  faVideo,
  faHeart,
  faExpand,
  faTimes,
  faExternalLinkAlt,
  faStar,
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { getPatientByIdForOwner, getPatientStatusHistory } from '../services/patientService'; // UPDATED: Changed import
import { getAllStatusOptions } from '../services/statusService';
import { getResourcesForStatus } from '../services/educationalService';
import '../styles/PatientStatusTracker.css';

// Default patient journey (fallback for when custom statuses aren't loaded)
const PATIENT_JOURNEY = [
  {
    id: 'admitted',
    title: 'Admitted',
    description: 'Your pet has arrived and is being settled in',
    icon: faHeart,
    color: '#4285f4'
  },
  {
    id: 'being-examined',
    title: 'Being Examined',
    description: 'Initial examination and assessment',
    icon: faHeart,
    color: '#ea4335'
  },
  {
    id: 'awaiting-tests',
    title: 'Awaiting Tests',
    description: 'Waiting for diagnostic tests or results',
    icon: faHourglassHalf,
    color: '#fbbc05'
  },
  {
    id: 'test-results-pending',
    title: 'Test Results Pending',
    description: 'Tests completed, waiting for results',
    icon: faHourglassHalf,
    color: '#fbbc05'
  },
  {
    id: 'being-prepped-for-surgery',
    title: 'Being Prepped for Surgery',
    description: 'Preparing for the surgical procedure',
    icon: faHeart,
    color: '#fa903e'
  },
  {
    id: 'in-surgery',
    title: 'In Surgery',
    description: 'Surgical procedure in progress',
    icon: faHeart,
    color: '#ea4335'
  },
  {
    id: 'in-recovery',
    title: 'In Recovery',
    description: 'Surgery complete, recovering comfortably',
    icon: faHeart,
    color: '#34a853'
  },
  {
    id: 'awake-responsive',
    title: 'Awake & Responsive',
    description: 'Alert and responding well to treatment',
    icon: faHeart,
    color: '#34a853'
  },
  {
    id: 'ready-for-discharge',
    title: 'Ready for Discharge',
    description: 'All set to go home!',
    icon: faHeart,
    color: '#a142f4'
  },
  {
    id: 'discharged',
    title: 'Discharged',
    description: 'Successfully discharged and on the way home',
    icon: faCheck,
    color: '#a142f4'
  }
];

const PatientStatusTracker = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [educationalResources, setEducationalResources] = useState({});
  const [loadingResources, setLoadingResources] = useState(true);
  
  useEffect(() => {
    const loadPatient = async () => {
      try {
        // UPDATED: Use getPatientByIdForOwner to allow grace period access
        const [patientData, statusOpts] = await Promise.all([
          getPatientByIdForOwner(id), // CHANGED: This allows access during grace period
          getAllStatusOptions()
        ]);
        
        setPatient(patientData);
        setStatusOptions(statusOpts);
        
        // Load real status history from database
        const history = await getPatientStatusHistory(id);
        
        // Update descriptions with custom status descriptions
        const updatedHistory = history.map(entry => ({
          ...entry,
          description: getStatusDescription(entry.title, statusOpts)
        }));
        
        // Mark the most recent entry as current (unless patient is deleted)
        if (updatedHistory.length > 0 && !patientData.isDeleted) {
          updatedHistory[0].status = 'current';
        }
        
        setStatusHistory(updatedHistory);

        // Load educational resources for each status in the history
        await loadEducationalResources(updatedHistory, statusOpts);
      } catch (error) {
        console.error('Error loading patient:', error);
        setError('Could not find pet information. Please check the link or contact the clinic.');
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
    
    // Set up auto-refresh every minute (only if not in grace period)
    const refreshInterval = setInterval(() => {
      loadPatient();
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [id]);

  // Load educational resources for each status
  const loadEducationalResources = async (historyEntries, statusOpts) => {
    try {
      setLoadingResources(true);
      const resourcesMap = {};
      
      // Get unique statuses from history
      const uniqueStatuses = [...new Set(historyEntries.map(entry => entry.title))];
      
      // Load resources for each status
      for (const status of uniqueStatuses) {
        try {
          const resources = await getResourcesForStatus(status);
          if (resources && resources.length > 0) {
            resourcesMap[status] = resources;
          }
        } catch (error) {
          console.warn(`No resources found for status: ${status}`, error);
        }
      }
      
      setEducationalResources(resourcesMap);
    } catch (error) {
      console.error('Error loading educational resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };
  
  // Helper function that uses custom status descriptions
  const getStatusDescription = (status, statusOptionsArray = statusOptions) => {
    // First try to find custom status description
    const customStatus = statusOptionsArray.find(
      opt => opt.value.toLowerCase() === status.toLowerCase()
    );
    
    if (customStatus && customStatus.description) {
      return customStatus.description;
    }
    
    // Fallback to default descriptions
    const descriptions = {
      'Admitted': 'Your pet has arrived and is being settled in',
      'Being Examined': 'Initial examination and assessment',
      'Awaiting Tests': 'Waiting for diagnostic tests or results',
      'Test Results Pending': 'Tests completed, waiting for results',
      'Being Prepped for Surgery': 'Preparing for the surgical procedure',
      'In Surgery': 'Surgical procedure in progress',
      'In Recovery': 'Surgery complete, recovering comfortably',
      'Awake & Responsive': 'Alert and responding well to treatment',
      'Ready for Discharge': 'All set to go home!',
      'Discharged': 'Successfully discharged and on the way home'
    };
    
    return descriptions[status] || 'Status updated';
  };
  
  // Get current step info with custom status support AND description
  const getCurrentStepInfo = () => {
    // First try to find in loaded status options (includes custom statuses)
    const customStatus = statusOptions.find(
      opt => opt.value.toLowerCase() === patient?.status.toLowerCase()
    );
    
    if (customStatus) {
      return {
        title: customStatus.label,
        description: customStatus.description || getStatusDescription(customStatus.value),
        icon: faHeart, // Default icon for custom statuses
        color: customStatus.color
      };
    }
    
    // Fallback to default journey
    return PATIENT_JOURNEY.find(
      step => step.title.toLowerCase() === patient?.status.toLowerCase()
    ) || PATIENT_JOURNEY[0];
  };

  // Get step info for timeline items with custom status support
  const getStepInfo = (statusTitle) => {
    // First try to find in loaded status options (includes custom statuses)
    const customStatus = statusOptions.find(
      opt => opt.value.toLowerCase() === statusTitle.toLowerCase()
    );
    
    if (customStatus) {
      return {
        color: customStatus.color,
        icon: faHeart // Default icon for custom statuses
      };
    }
    
    // Fallback to default journey
    return PATIENT_JOURNEY.find(
      step => step.title.toLowerCase() === statusTitle.toLowerCase()
    ) || PATIENT_JOURNEY[0];
  };

  // Handle photo click to open modal
  const handlePhotoClick = (photoUrl) => {
    setSelectedPhoto(photoUrl);
  };

  // Close photo modal
  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  // Handle educational resource click
  const handleResourceClick = (resource) => {
    console.log('Resource clicked:', resource);
    
    // Open the resource URL in a new tab
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  // Get resource icon based on type
  const getResourceIcon = (type) => {
    switch (type) {
      case 'youtube':
        return faVideo;
      case 'pdf':
        return faFileAlt;
      case 'website':
        return faExternalLinkAlt;
      default:
        return faExternalLinkAlt;
    }
  };

  // Get resource button class based on type
  const getResourceButtonClass = (type) => {
    switch (type) {
      case 'youtube':
        return 'resource-button youtube-button';
      case 'pdf':
        return 'resource-button pdf-button';
      case 'website':
        return 'resource-button website-button';
      default:
        return 'resource-button website-button';
    }
  };

  // Render educational resources for a status
  const renderEducationalResources = (statusTitle) => {
    const resources = educationalResources[statusTitle];
    
    if (loadingResources) {
      return (
        <div className="resources-loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          Loading resources...
        </div>
      );
    }
    
    if (!resources || resources.length === 0) {
      return null; // Don't show anything if no resources
    }

    // Sort resources: featured first, then by link_order
    const sortedResources = [...resources].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (a.link_order || 0) - (b.link_order || 0);
    });

    return (
      <div className="educational-resources">
        {sortedResources.map((resource, index) => (
          <button
            key={resource.id}
            className={getResourceButtonClass(resource.resource_type)}
            onClick={() => handleResourceClick(resource)}
            style={resource.is_featured ? {
              backgroundColor: '#fff3cd',
              borderWidth: '3px',
              fontWeight: '600',
              boxShadow: '0 2px 6px rgba(255, 193, 7, 0.3)'
            } : {}}
            title={resource.description || resource.title}
          >
            <FontAwesomeIcon icon={getResourceIcon(resource.resource_type)} />
            {resource.title}
            <FontAwesomeIcon icon={faExternalLinkAlt} style={{ opacity: 0.6, marginLeft: '4px', fontSize: '0.8em' }} />
            {resource.is_featured && (
              <FontAwesomeIcon 
                icon={faStar} 
                className="fa-star"
                style={{ 
                  position: 'absolute',
                  top: '3px',
                  right: '3px',
                  fontSize: '0.7em',
                  color: '#ffc107'
                }}
              />
            )}
          </button>
        ))}
      </div>
    );
  };

  // NEW: Render grace period banner
  const renderGracePeriodBanner = () => {
    if (!patient?.isInGracePeriod) return null;

    return (
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '16px',
        margin: '16px 0',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#856404' }} />
          <h3 style={{ margin: 0, color: '#856404', fontSize: '1.1rem' }}>
            Visit Completed
          </h3>
        </div>
        <p style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '0.9rem' }}>
          {patient.name}'s visit with us has been completed. This timeline will remain 
          available for <strong>{patient.timeRemaining} more hours</strong>.
        </p>
        <p style={{ margin: 0, color: '#856404', fontSize: '0.8rem' }}>
          Save any important information or photos you'd like to keep.
        </p>
      </div>
    );
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

  // NEW: Check if patient is permanently deleted (grace period expired)
  if (patient.isDeleted && !patient.isInGracePeriod) {
    return (
      <div className="status-tracker-container error-state">
        <div className="error-message">
          <FontAwesomeIcon icon={faPaw} style={{ color: '#4285f4', fontSize: '3rem', marginBottom: '16px' }} />
          <h2>Your Pet Is Not Currently Being Tracked</h2>
          <p>Your pet's visit with us has been completed, or the tracking link may be outdated.</p>
          <p>If you believe this is an error, please contact the clinic directly.</p>
          
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#e8f0fe',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#4285f4' }}>Need help?</h4>
            <p style={{ margin: '4px 0', color: '#4285f4' }}>
              📞 Phone: (555) 123-4567
            </p>
            <p style={{ margin: '4px 0', color: '#4285f4' }}>
              📧 Email: info@vetclinic.com
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const currentStep = getCurrentStepInfo();
  
  return (
    <div className="status-tracker-container">
      <header className="tracker-header">
        <h1><FontAwesomeIcon icon={faPaw} /> InPawgress</h1>
      </header>
      
      {/* NEW: Grace Period Banner */}
      {renderGracePeriodBanner()}
      
      {/* Pet Info Card */}
      <div className="pet-status-card">
        <div className="pet-photo">
          <img 
            src={patient.photoUrl || '/images/placeholder-pet.png'} 
            alt={patient.name} 
          />
        </div>
        
        <h2 className="pet-name">{patient.name}</h2>
        <p className="pet-info">{patient.species} • {patient.breed}</p>
        
        {/* Current Status */}
        <div className="current-status-section">
          <div className="status-badge-large" style={{ backgroundColor: currentStep.color + '20', color: currentStep.color }}>
            <FontAwesomeIcon icon={currentStep.icon} />
            {patient.status}
          </div>
          <p className="status-description">{currentStep.description}</p>
          <p className="status-time">Last Updated: {patient.lastUpdate}</p>
        </div>
      </div>
      
      {/* Timeline Section */}
      <div className="timeline-section">
        <h3 className="timeline-title">
          <FontAwesomeIcon icon={faClock} />
          {patient.name}'s Journey
        </h3>
        
        <div className="timeline-container">
          {statusHistory.map((update, index) => {
            // Get step info with custom status support
            const stepInfo = getStepInfo(update.title);
            
            return (
              <div key={update.id} className={`timeline-item ${update.status}`}>
                <div className="timeline-marker">
                  <FontAwesomeIcon 
                    icon={update.status === 'current' && !patient.isDeleted ? faClock : faCheck} 
                    style={{ color: stepInfo.color }}
                  />
                </div>
                
                <div className="timeline-content">
                  <div className="timeline-header">
                    <h4 className="timeline-title-text">{update.title}</h4>
                    <span className="timeline-time">{update.timestamp}</span>
                  </div>
                  
                  <p className="timeline-description">{update.description}</p>
                  
                  {/* Status Photos */}
                  {update.photos && update.photos.length > 0 && (
                    <div className="status-photos">
                      {update.photos.map((photo, photoIndex) => (
                        <div 
                          key={photo.id}
                          className="status-photo-thumbnail"
                          onClick={() => handlePhotoClick(photo.photo_url)}
                        >
                          <img 
                            src={photo.photo_url} 
                            alt={`${update.title} photo ${photoIndex + 1}`}
                          />
                          <div className="photo-overlay">
                            <FontAwesomeIcon icon={faExpand} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Educational Resources */}
                  {renderEducationalResources(update.title)}
                  
                  {update.status === 'current' && !patient.isDeleted && (
                    <div className="current-indicator">
                      <FontAwesomeIcon icon={faClock} />
                      Currently here
                    </div>
                  )}
                </div>
                
                {index < statusHistory.length - 1 && <div className="timeline-line"></div>}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Clinic Info */}
      <div className="clinic-info">
        <p>If you have any questions, please contact your clinic directly.</p>
      </div>
      
      {/* Refresh note - only show if not in grace period */}
      {!patient.isInGracePeriod && (
        <div className="refresh-note">
          <p>This page automatically refreshes to show the latest information.</p>
        </div>
      )}
      
      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="photo-modal" onClick={closePhotoModal}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={closePhotoModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedPhoto} alt="Status update photo" />
          </div>
        </div>
      )}
      
      <footer className="tracker-footer">
        <p>&copy; 2025 InPawgress • Pet Status Tracking System</p>
      </footer>
    </div>
  );
};

export default PatientStatusTracker;