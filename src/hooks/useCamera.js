import { useState, useEffect, useRef } from 'react';

const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front

  // Setup polyfill for older browsers and iOS
  useEffect(() => {
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {};
    }

    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        const getUserMedia = 
          navigator.webkitGetUserMedia || 
          navigator.mozGetUserMedia ||
          navigator.msGetUserMedia;
        
        if (!getUserMedia) {
          return Promise.reject(
            new Error('getUserMedia is not supported in this browser')
          );
        }

        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
  }, []);

  // Start the camera
  const startCamera = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in your browser');
      }
      
      const constraints = {
        video: { facingMode }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => {
            console.error("Error playing video:", e);
          });
        };
      }
      
      setStream(mediaStream);
      setIsActive(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(err.message || 'Could not access camera');
      setIsActive(false);
    }
  };

  // Stop the camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
  };

  // Toggle between front and back cameras
  const toggleCamera = async () => {
    stopCamera();
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
  };

  // Take a photo
  const takePhoto = () => {
    if (!isActive || !videoRef.current || !canvasRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match the video
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    
    // Draw the current video frame to the canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL (base64 encoded image)
    try {
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      return imageDataUrl;
    } catch (err) {
      console.error("Error converting canvas to image:", err);
      return null;
    }
  };

  // Start camera when facingMode changes
  useEffect(() => {
    if (isActive) {
      stopCamera();
      startCamera();
    }
  }, [facingMode]);

  // Clean up by stopping the camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    facingMode,
    startCamera,
    stopCamera,
    toggleCamera,
    takePhoto
  };
};

export default useCamera;