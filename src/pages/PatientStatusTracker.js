// src/pages/PatientStatusTracker.js - Complete file with photo display functionality
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
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { getPatientById, getPatientStatusHistory } from '../services/patientService';
import '../styles/PatientStatusTracker.css';

// Define the complete patient journey with icons and descriptions
const PATIENT_JOURNEY = [
  {
    id: 'admitted',
    title: 'Admitted',
    description: 'Your pet has arrived and is being settled in',
    icon: faHeart,
    color: '#1a73e8'
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
    color: '#f9ab00'
  },
  {
    id: 'test-results-pending',
    title: 'Test Results Pending',
    description: 'Tests completed, waiting for results',
    icon: faHourglassHalf,
    color: '#f9ab00'
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
    color: '#fa903e'
  },
  {
    id: 'in-recovery',
    title: 'In Recovery',
    description: 'Surgery complete, recovering comfortably',
    icon: faHeart,
    color: '#1e8e3e'
  },
  {
    id: 'awake-responsive',
    title: 'Awake & Responsive',
    description: 'Alert and responding well to treatment',
    icon: faHeart,
    color: '#1e8e3e'
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
    color: '#1e8e3e'
  }
];

const PatientStatusTracker = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null); // For photo modal
  
  useEffect(() => {
    const loadPatient = async () => {
      try {
        const patientData = await getPatientById(id);
        setPatient(patientData);
        
        // Load real status history from database
        const history = await getPatientStatusHistory(id);
        
        // Mark the most recent entry as current
        if (history.length > 0) {
          history[0].status = 'current';
        }
        
        setStatusHistory(history);
      } catch (error) {
        console.error('Error loading patient:', error);
        setError('Could not find pet information. Please check the link or contact the clinic.');
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
    
    // Set up auto-refresh every minute
    const refreshInterval = setInterval(() => {
      loadPatient();
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [id]);
  
  // Get the current step info
  const getCurrentStepInfo = () => {
    return PATIENT_JOURNEY.find(
      step => step.title.toLowerCase() === patient?.status.toLowerCase()
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
  
  const currentStep = getCurrentStepInfo();
  
  return (
    <div className="status-tracker-container">
      <header className="tracker-header">
        <h1><FontAwesomeIcon icon={faPaw} /> VetTrack</h1>
      </header>
      
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
            // Get the appropriate icon and color for each status
            const stepInfo = PATIENT_JOURNEY.find(
              step => step.title.toLowerCase() === update.title.toLowerCase()
            ) || PATIENT_JOURNEY[0];
            
            return (
              <div key={update.id} className={`timeline-item ${update.status}`}>
                <div className="timeline-marker">
                  <FontAwesomeIcon 
                    icon={update.status === 'current' ? faClock : faCheck} 
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
                  
                  {/* Media and Content */}
                  <div className="timeline-media">
                    {update.hasPhoto && update.photos && update.photos.length > 0 && (
                      <button 
                        className="media-button photo-button"
                        onClick={() => handlePhotoClick(update.photos[0].photo_url)}
                      >
                        <FontAwesomeIcon icon={faCamera} />
                        View Photo ({update.photos.length})
                      </button>
                    )}
                    
                    {update.hasEducationalContent && (
                      <div className="educational-links">
                        <button className="media-button educational-button">
                          <FontAwesomeIcon icon={faFileAlt} />
                          Learn More
                        </button>
                        <button className="media-button video-button">
                          <FontAwesomeIcon icon={faVideo} />
                          Watch Video
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {update.status === 'current' && (
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
        <p>If you have any questions, please contact us at:</p>
        <p className="contact">Phone: (555) 123-4567</p>
        <p className="contact">Email: info@vetclinic.com</p>
      </div>
      
      <div className="refresh-note">
        <p>This page automatically refreshes to show the latest information.</p>
      </div>
      
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
        <p>&copy; 2025 VetTrack • Pet Status Tracking System</p>
      </footer>
    </div>
  );
};

export default PatientStatusTracker;