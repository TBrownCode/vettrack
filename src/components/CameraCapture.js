// src/components/CameraCapture.js - Enhanced Version with Navigation Cleanup
import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTimes, faSync, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
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
    takePhoto,
    initializationStep
  } = useCamera();
  
  const [showFallback, setShowFallback] = useState(false);
  const fileInputRef = useRef(null);
  const [initializationTimeout, setInitializationTimeout] = useState(false);
  
  // ENHANCED: Start camera and set timeout for initialization with navigation cleanup
  useEffect(() => {
    console.log('CameraCapture: Component mounted');
    
    // Start the camera
    const initCamera = async () => {
      await startCamera();
    };
    
    initCamera();
    
    // Set a timeout to show fallback if camera doesn't initialize in 5 seconds
    const timeoutId = setTimeout(() => {
      if (!isActive) {
        setInitializationTimeout(true);
      }
    }, 5000);
    
    // ENHANCED: Cleanup function for navigation events
    const cleanup = () => {
      console.log('CameraCapture: Performing cleanup');
      clearTimeout(timeoutId);
      stopCamera();
    };
    
    // ENHANCED: Listen for page navigation events
    const handleBeforeUnload = () => {
      cleanup();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('CameraCapture: Page became hidden, cleaning up camera');
        cleanup();
      }
    };
    
    const handlePopState = () => {
      console.log('CameraCapture: Navigation detected, cleaning up camera');
      cleanup();
      onClose(); // Close the camera when navigating
    };
    
    // Add event listeners for navigation cleanup
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      console.log('CameraCapture: Component unmounting');
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      
      // Perform cleanup
      cleanup();
    };
  }, [startCamera, stopCamera, isActive, onClose]);
  
  // Show fallback after timeout or error
  useEffect(() => {
    if (error || initializationTimeout) {
      setShowFallback(true);
    }
  }, [error, initializationTimeout]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (onCapture) {
        onCapture(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleTakePhoto = () => {
    if (!isActive) {
      console.log('CameraCapture: Cannot take photo - camera not active');
      return;
    }
    
    const photoData = takePhoto();
    if (photoData && onCapture) {
      console.log('CameraCapture: Photo captured, invoking callback');
      onCapture(photoData);
    } else {
      console.error('CameraCapture: Failed to capture photo');
    }
  };
  
  const handleCloseClick = () => {
    console.log('CameraCapture: Close button clicked');
    onClose();
  };
  
  const renderCameraContent = () => {
    // If camera is active, show the video
    if (isActive) {
      return (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className="camera-video"
        />
      );
    }
    
    // If there's an error or initialization timeout, show error message
    if (error || initializationTimeout) {
      return (
        <div className="camera-error">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="error-icon" />
          <p>{error || 'Camera initialization timed out'}</p>
          <p className="step-info">Last step: {initializationStep}</p>
          <p className="browser-info">
            Browser: {navigator.userAgent}
          </p>
        </div>
      );
    }
    
    // Otherwise show loading message
    return (
      <div className="camera-loading">
        <p>Initializing camera...</p>
        <p className="step-info">Step: {initializationStep}</p>
      </div>
    );
  };
  
  return (
    <div className="camera-modal">
      <div className="camera-header">
        <h3>Take Photo</h3>
        <button 
          className="close-button" 
          onClick={handleCloseClick} 
          aria-label="Close"
          style={{
            padding: '8px',
            minWidth: '44px',
            minHeight: '44px'
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="camera-preview">
        {renderCameraContent()}
        
        {showFallback && (
          <div className="camera-fallback">
            <p>Camera access failed. You can upload a photo instead:</p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="file-input"
            />
            <button 
              className="fallback-button"
              onClick={() => fileInputRef.current.click()}
            >
              Select Photo
            </button>
          </div>
        )}
        
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
          onClick={handleTakePhoto}
          disabled={!isActive}
          aria-label="Take photo"
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>
        
        <div className="spacer"></div>
      </div>
    </div>
  );
};

export default CameraCapture;