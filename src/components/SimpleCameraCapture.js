// src/components/SimpleCameraCapture.js - Update with these changes

import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTimes } from '@fortawesome/free-solid-svg-icons';

const SimpleCameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  
  // Detect iOS device - but remove debug info display
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);
  }, []);
  
  // Simplified camera initialization
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      try {
        // Simple constraints for all devices
        const constraints = {
          audio: false,
          video: { facingMode: 'environment' }
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (mounted) {
          setStream(mediaStream);
          
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.setAttribute('muted', 'true');
          }
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (mounted) {
          setError(err.message || 'Could not access camera');
        }
      }
    };
    
    initCamera();
    
    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Get the actual video dimensions
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      onCapture(imageData);
    } catch (err) {
      console.error('Error converting canvas to image:', err);
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      onCapture(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: '#000', 
      zIndex: 10001,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '16px',
        borderBottom: '1px solid #333'
      }}>
        <h3 style={{ margin: 0, color: '#fff' }}>Take Photo</h3>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#fff', 
            fontSize: '20px',
            cursor: 'pointer' 
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      {/* Camera View */}
      <div style={{ flex: 1, position: 'relative' }}>
        {error ? (
          <div style={{ 
            padding: '20px', 
            color: '#fff', 
            textAlign: 'center', 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%'
          }}>
            <p>{error}</p>
            <p>You can upload a photo instead:</p>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button 
              style={{
                background: '#4285f4',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current.click()}
            >
              Select Photo
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        
        {/* Canvas for taking photos */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
      
      {/* Floating Capture Button - Always show this */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100
      }}>
        <button 
          onClick={takePhoto}
          disabled={!!error}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: !error ? '#fff' : '#555',
            color: '#000',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            cursor: !error ? 'pointer' : 'default',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          <FontAwesomeIcon icon={faCamera} size="lg" />
        </button>
      </div>
    </div>
  );
};

export default SimpleCameraCapture;