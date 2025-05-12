import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Start the camera when component mounts
    startCamera();
    
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

  return (
    <div className="camera-modal">
      <div className="camera-header">
        <h3>Take Photo</h3>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="camera-preview">
        {error ? (
          <div className="camera-error">
            <p>{error}</p>
            <p>Please ensure you've given permission to access the camera.</p>
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="camera-video"
            onCanPlay={() => videoRef.current.play()}
          />
        )}
        {/* Hidden canvas for capturing the photo */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      <div className="camera-controls">
        <button 
          className="control-button switch-camera" 
          onClick={toggleCamera}
          disabled={!isActive}
        >
          <FontAwesomeIcon icon={faSync} />
        </button>
        
        <button 
          className="control-button capture-button" 
          onClick={handleCapture}
          disabled={!isActive}
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>
        
        <div className="spacer"></div> {/* Empty div for layout */}
      </div>
    </div>
  );
};

export default CameraCapture;