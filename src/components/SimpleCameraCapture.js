// src/components/SimpleCameraCapture.js - Fixed camera initialization
import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTimes } from '@fortawesome/free-solid-svg-icons';

const SimpleCameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  
  // Robust camera initialization with timeout and fallback
  useEffect(() => {
    let mounted = true;
    let timeoutId;
    
    const initCamera = async () => {
      try {
        console.log('SimpleCameraCapture: Starting camera initialization...');
        
        // Set a timeout to prevent hanging
        timeoutId = setTimeout(() => {
          if (mounted && !stream) {
            console.log('SimpleCameraCapture: Camera initialization timeout');
            setError('Camera initialization timed out. Try refreshing the page or check camera permissions.');
          }
        }, 10000); // 10 second timeout
        
        // Enhanced device detection including iPad
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform));
        
        console.log('SimpleCameraCapture: User Agent:', navigator.userAgent);
        console.log('SimpleCameraCapture: Platform:', navigator.platform);
        console.log('SimpleCameraCapture: Touch Points:', navigator.maxTouchPoints);
        console.log('SimpleCameraCapture: Detected as mobile:', isMobile);
        
        let constraints;
        if (isMobile) {
          // Mobile device (including iPad) - use rear camera with high quality
          constraints = {
            audio: false,
            video: { 
              facingMode: 'environment',  // Force back camera
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              frameRate: { ideal: 30, min: 15 },
              aspectRatio: { ideal: 16/9 }
            }
          };
        } else {
          // Desktop - use highest quality webcam settings
          constraints = {
            audio: false,
            video: {
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              frameRate: { ideal: 30, min: 15 },
              aspectRatio: { ideal: 16/9 }
            }
          };
        }
        
        console.log('SimpleCameraCapture: Device type:', isMobile ? 'Mobile' : 'Desktop');
        console.log('SimpleCameraCapture: Using constraints:', constraints);
        let mediaStream;
        
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (basicError) {
          console.log('SimpleCameraCapture: Initial constraints failed:', basicError.message);
          console.log('SimpleCameraCapture: Trying fallback constraints...');
          
          // Fallback to most basic constraints
          constraints = {
            audio: false,
            video: true
          };
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        
        console.log('SimpleCameraCapture: Camera stream obtained');
        clearTimeout(timeoutId);
        
        if (mounted) {
          setStream(mediaStream);
          setError(null);
          
          // Force video ready state after stream is obtained
          setTimeout(() => {
            if (mounted) {
              console.log('SimpleCameraCapture: Forcing video ready state');
              setVideoReady(true);
            }
          }, 1000);
        } else {
          // Component unmounted, clean up
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error('SimpleCameraCapture: Camera error:', err);
        clearTimeout(timeoutId);
        
        if (mounted) {
          let errorMessage = 'Could not access camera';
          
          if (err.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found on this device.';
          } else if (err.name === 'NotReadableError') {
            errorMessage = 'Camera is already in use by another application.';
          } else if (err.name === 'OverconstrainedError') {
            errorMessage = 'Camera constraints not supported. Trying fallback...';
          }
          
          setError(errorMessage);
        }
      }
    };
    
    // Add a small delay to ensure component is fully mounted
    setTimeout(initCamera, 100);
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (stream) {
        console.log('SimpleCameraCapture: Cleaning up camera stream');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Set up video element when stream is available
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('SimpleCameraCapture: Setting up video element');
      
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      
      // More robust video ready handling
      const handleVideoReady = () => {
        console.log('SimpleCameraCapture: Video is ready to play');
        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        setVideoReady(true);
      };
      
      const handleVideoError = (e) => {
        console.error('SimpleCameraCapture: Video element error:', e);
        setError('Video playback error');
      };
      
      // Multiple event listeners for better compatibility
      video.onloadedmetadata = () => {
        console.log('SimpleCameraCapture: Video metadata loaded');
        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        
        // Force play the video
        video.play()
          .then(() => {
            console.log('SimpleCameraCapture: Video playback started successfully');
            setTimeout(handleVideoReady, 500); // Small delay to ensure everything is ready
          })
          .catch(e => {
            console.error('SimpleCameraCapture: Error starting video playback:', e);
            // Try again without play() - some browsers auto-play
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              handleVideoReady();
            } else {
              setError('Failed to start camera preview');
            }
          });
      };
      
      video.oncanplay = () => {
        console.log('SimpleCameraCapture: Video can play');
        if (!videoReady) {
          handleVideoReady();
        }
      };
      
      video.onerror = handleVideoError;
      
      // Fallback: If metadata doesn't load, try forcing play after a delay
      const fallbackTimeout = setTimeout(() => {
        if (!videoReady && video.readyState === 0) {
          console.log('SimpleCameraCapture: Fallback - forcing video play');
          video.load(); // Reload the video element
          video.play().then(handleVideoReady).catch(handleVideoError);
        }
      }, 3000);
      
      return () => {
        clearTimeout(fallbackTimeout);
        video.onloadedmetadata = null;
        video.oncanplay = null;
        video.onerror = null;
      };
    }
  }, [stream, videoReady]);
  
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !videoReady) {
      console.error('SimpleCameraCapture: Cannot take photo - video not ready');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Get the actual video dimensions for maximum quality
      const videoWidth = video.videoWidth || 1920;
      const videoHeight = video.videoHeight || 1080;
      
      console.log(`SimpleCameraCapture: Taking photo with dimensions ${videoWidth}x${videoHeight}`);
      
      // Set canvas to exact video dimensions (no scaling down)
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext('2d');
      
      // High-quality canvas rendering settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw the current video frame at full resolution
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      // Convert to high-quality JPEG (0.95 quality instead of 0.9)
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      console.log('SimpleCameraCapture: High-quality photo captured successfully');
      onCapture(imageData);
    } catch (err) {
      console.error('SimpleCameraCapture: Error taking photo:', err);
      setError('Failed to capture photo');
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
            <p style={{ fontSize: '18px', marginBottom: '16px' }}>{error}</p>
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
                cursor: 'pointer',
                fontSize: '16px'
              }}
              onClick={() => fileInputRef.current.click()}
            >
              Select Photo
            </button>
          </div>
        ) : !videoReady ? (
          <div style={{ 
            padding: '20px', 
            color: '#fff', 
            textAlign: 'center', 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            <p style={{ fontSize: '18px' }}>Initializing camera...</p>
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
      
      {/* Floating Capture Button */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100
      }}>
        <button 
          onClick={takePhoto}
          disabled={!!error || !videoReady}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: (!error && videoReady) ? '#fff' : '#555',
            color: '#000',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            cursor: (!error && videoReady) ? 'pointer' : 'default',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            opacity: (!error && videoReady) ? 1 : 0.6
          }}
        >
          <FontAwesomeIcon icon={faCamera} size="lg" />
        </button>
      </div>
    </div>
  );
};

export default SimpleCameraCapture;