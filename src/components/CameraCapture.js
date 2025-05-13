import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTimes, faSync } from '@fortawesome/free-solid-svg-icons';
import useCamera from '../hooks/useCamera';
import '../styles/CameraCapture.css';

const CameraCapture = ({ onCapture, onClose }) => {
  const {
    videoRef,
    canvasRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    toggleCamera,
    takePhoto
  } = useCamera();
  
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  useEffect(() => {
    // Check if browser supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      return;
    }

    // Start the camera when component mounts
    const initCamera = async () => {
      try {
        await startCamera();
        setPermissionStatus('granted');
      } catch (err) {
        console.error('Camera permission error:', err);
        setPermissionStatus('denied');
      }
    };
    
    initCamera();
    
    // Stop the camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const photoData = takePhoto();
    if (photoData && onCapture) {
      onCapture(photoData);
    }
  };

  const renderCameraContent = () => {
    if (error || permissionStatus === 'denied' || permissionStatus === 'unsupported') {
      return (
        <div className="camera-error">
          <p>{error || 'Camera access denied'}</p>
          <p>
            Please ensure you've given permission to access the camera and 
            are using a supported browser.
          </p>
          <p className="camera-help-text">
            For iOS: Please add this app to your home screen for full camera access.<br/>
            For Android: Make sure camera permissions are enabled for this site.
          </p>
        </div>
      );
    }
    
    if (!isActive) {
      return <div className="camera-loading">Initializing camera...</div>;
    }
    
    return (
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted
        className="camera-video"
      />
    );
  };

  return (
    <div className="camera-modal">
      <div className="camera-header">
        <h3>Take Photo</h3>
        <button className="close-button" onClick={onClose} aria-label="Close">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="camera-preview">
        {renderCameraContent()}
        {/* Hidden canvas for capturing the photo */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      <div className="camera-controls">
        <button 
          className="control-button switch-camera" 
          onClick={toggleCamera}
          disabled={!isActive}
          aria-label="Switch camera"
        >
          <FontAwesomeIcon icon={faSync} />
        </button>
        
        <button 
          className="control-button capture-button" 
          onClick={handleCapture}
          disabled={!isActive}
          aria-label="Take photo"
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>
        
        <div className="spacer"></div> {/* Empty div for layout */}
      </div>
    </div>
  );
};

export default CameraCapture;