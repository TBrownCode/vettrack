// src/hooks/useCamera.js - Updated with debugging and fixes
import { useState, useEffect, useRef } from 'react';

const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [initializationStep, setInitializationStep] = useState('not-started');

  // Start the camera with debug logs
  const startCamera = async () => {
    try {
      console.log('Starting camera initialization...');
      setInitializationStep('checking-api');
      
      // Check if the API is available
      if (!navigator.mediaDevices) {
        console.error('mediaDevices API not available');
        throw new Error('Camera API not supported in your browser');
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not available');
        throw new Error('getUserMedia not available');
      }
      
      setInitializationStep('setting-constraints');
      
      // Use simpler constraints first to debug
      const constraints = {
        audio: false,
        video: true  // Start with simplest constraints
      };
      
      console.log('Requesting camera with constraints:', JSON.stringify(constraints));
      setInitializationStep('requesting-stream');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained successfully');
      
      setInitializationStep('attaching-to-video');
      
      if (videoRef.current) {
        console.log('Attaching stream to video element');
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', ''); // Critical for iOS
        videoRef.current.setAttribute('autoplay', '');
        videoRef.current.setAttribute('muted', '');
        
        // Add explicit event listeners for debugging
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play()
            .then(() => {
              console.log('Video playback started successfully');
              setIsActive(true);
              setInitializationStep('playing');
            })
            .catch(e => {
              console.error("Error playing video:", e);
              setError("Error playing video: " + e.message);
              setInitializationStep('play-error');
            });
        };
        
        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
          setError("Video element error: " + e.message);
          setInitializationStep('video-error');
        };
      } else {
        console.error('Video ref is null');
        setError('Video element not available');
        setInitializationStep('no-video-ref');
      }
      
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error('Camera initialization error:', err);
      setInitializationStep('error-' + err.name);
      
      let errorMessage = err.message || 'Could not access camera';
      
      // Specific errors for better debugging
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested settings.';
        // Try again with simpler constraints
        setTimeout(() => {
          setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
        }, 1000);
      }
      
      setError(errorMessage);
      setIsActive(false);
    }
  };

  // Stop the camera
  const stopCamera = () => {
    console.log('Stopping camera...');
    setInitializationStep('stopping');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
    setInitializationStep('stopped');
    console.log('Camera stopped');
  };

  // Toggle between front and back cameras
  const toggleCamera = async () => {
    stopCamera();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    console.log('Toggling camera to:', newMode);
    setFacingMode(newMode);
  };

  // Take a photo
  const takePhoto = () => {
    if (!isActive || !videoRef.current || !canvasRef.current) {
      console.error('Cannot take photo - camera not active or references not available');
      return null;
    }

    try {
      console.log('Taking photo...');
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match the video
      const videoWidth = video.videoWidth || 320;
      const videoHeight = video.videoHeight || 240;
      
      console.log(`Setting canvas dimensions: ${videoWidth}x${videoHeight}`);
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL (base64 encoded image)
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Photo taken successfully');
      return imageDataUrl;
    } catch (err) {
      console.error("Error taking photo:", err);
      return null;
    }
  };

  // When facingMode changes, restart the camera
  useEffect(() => {
    if (facingMode && initializationStep !== 'not-started') {
      console.log('FacingMode changed to:', facingMode);
      if (isActive) {
        stopCamera();
      }
      startCamera();
    }
  }, [facingMode]);

  // Clean up by stopping the camera when component unmounts
  useEffect(() => {
    return () => {
      if (isActive) {
        stopCamera();
      }
    };
  }, [isActive]);

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
    initializationStep
  };
};

export default useCamera;