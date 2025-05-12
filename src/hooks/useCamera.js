import { useState, useEffect, useRef } from 'react';

const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front

  // Start the camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL (base64 encoded image)
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    
    return imageDataUrl;
  };

  // Clean up by stopping the camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Effect to restart camera when facingMode changes
  useEffect(() => {
    if (isActive) {
      startCamera();
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
    takePhoto
  };
};

export default useCamera;