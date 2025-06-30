// src/hooks/useCamera.js - Enhanced Version with Navigation Cleanup
import { useState, useEffect, useRef } from 'react';

const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [initializationStep, setInitializationStep] = useState('not-started');

  // ENHANCED: Camera cleanup function
  const cleanupCamera = () => {
    console.log('useCamera: Performing camera cleanup');
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('useCamera: Stopping track:', track.label);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setInitializationStep('not-started');
  };

  // Start the camera with debug logs
  const startCamera = async () => {
    try {
      console.log('useCamera: Starting camera initialization...');
      setInitializationStep('checking-api');
      
      // Check if the API is available
      if (!navigator.mediaDevices) {
        console.error('useCamera: mediaDevices API not available');
        throw new Error('Camera API not supported in your browser');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        console.error('useCamera: getUserMedia not available');
        throw new Error('getUserMedia not available');
      }
      
      setInitializationStep('setting-constraints');
      
      // Enhanced constraints based on facing mode
      const constraints = {
        audio: false,
        video: facingMode === 'environment' ? {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 }
        } : {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };
      
      console.log('useCamera: Requesting camera with constraints:', JSON.stringify(constraints));
      setInitializationStep('requesting-stream');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('useCamera: Camera stream obtained successfully');
      
      setInitializationStep('attaching-to-video');
      setStream(mediaStream);
      
      if (videoRef.current) {
        console.log('useCamera: Attaching stream to video element');
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', ''); // Critical for iOS
        videoRef.current.setAttribute('autoplay', '');
        videoRef.current.setAttribute('muted', '');
        
        // Add explicit event listeners for debugging
        videoRef.current.onloadedmetadata = () => {
          console.log('useCamera: Video metadata loaded');
          videoRef.current.play()
            .then(() => {
              console.log('useCamera: Video playback started successfully');
              setIsActive(true);
              setInitializationStep('ready');
            })
            .catch(err => {
              console.error('useCamera: Error starting video playback:', err);
              setError('Failed to start video playback');
            });
        };
        
        videoRef.current.onerror = (e) => {
          console.error('useCamera: Video element error:', e);
          setError('Video playback error');
        };
      }
    } catch (err) {
      console.error('useCamera: Camera error:', err);
      setError(err.message || 'Failed to access camera');
      setInitializationStep('error');
    }
  };

  // Stop the camera
  const stopCamera = () => {
    console.log('useCamera: Stopping camera');
    cleanupCamera();
  };

  // Toggle between front and back camera
  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    console.log('useCamera: Toggling camera to:', newMode);
    setFacingMode(newMode);
  };

  // Take a photo
  const takePhoto = () => {
    if (!isActive || !videoRef.current || !canvasRef.current) {
      console.error('useCamera: Cannot take photo - camera not active or references not available');
      return null;
    }

    try {
      console.log('useCamera: Taking photo...');
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match the video
      const videoWidth = video.videoWidth || 320;
      const videoHeight = video.videoHeight || 240;
      
      console.log(`useCamera: Setting canvas dimensions: ${videoWidth}x${videoHeight}`);
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL (base64 encoded image)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      console.log('useCamera: Photo taken successfully');
      return imageDataUrl;
    } catch (err) {
      console.error('useCamera: Error taking photo:', err);
      return null;
    }
  };

  // ENHANCED: Navigation cleanup effect
  useEffect(() => {
    // ENHANCED: Listen for page navigation events
    const handleBeforeUnload = () => {
      console.log('useCamera: Page unloading, cleaning up camera');
      cleanupCamera();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('useCamera: Page became hidden, cleaning up camera');
        cleanupCamera();
      }
    };
    
    const handlePopState = () => {
      console.log('useCamera: Navigation detected, cleaning up camera');
      cleanupCamera();
    };
    
    // Add event listeners for navigation cleanup
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      
      // Perform cleanup
      cleanupCamera();
    };
  }, []);

  // When facingMode changes, restart the camera
  useEffect(() => {
    if (facingMode && initializationStep !== 'not-started' && isActive) {
      console.log('useCamera: FacingMode changed to:', facingMode);
      stopCamera();
      // Small delay to ensure cleanup is complete before restarting
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [facingMode]);

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    facingMode,
    startCamera,
    stopCamera,
    toggleCamera,
    takePhoto,
    initializationStep,
    stream
  };
};

export default useCamera;