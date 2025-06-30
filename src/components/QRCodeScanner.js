// src/components/QRCodeScanner.js - Enhanced Version with Navigation Cleanup
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faQrcode } from '@fortawesome/free-solid-svg-icons';
import jsQR from 'jsqr';
import '../styles/QRCodeScanner.css';

const QRCodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  const scanIntervalRef = useRef(null);
  
  // ENHANCED: Add cleanup for navigation events
  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      try {
        const constraints = {
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (mounted) {
          setStream(mediaStream);
        } else {
          // If component was unmounted during init, cleanup immediately
          mediaStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (mounted) {
          setError(err.message || 'Could not access camera');
        }
      }
    };
    
    initCamera();
    
    // ENHANCED: Cleanup function that handles both React unmount and navigation
    const cleanup = () => {
      console.log('QRCodeScanner: Performing cleanup');
      mounted = false;
      stopScanning();
      stopCamera();
    };
    
    // ENHANCED: Listen for page navigation events
    const handleBeforeUnload = () => {
      cleanup();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('QRCodeScanner: Page became hidden, cleaning up camera');
        cleanup();
      }
    };
    
    // ENHANCED: Listen for popstate (back/forward navigation)
    const handlePopState = () => {
      console.log('QRCodeScanner: Navigation detected, cleaning up camera');
      cleanup();
      onClose(); // Close the scanner when navigating
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
      cleanup();
    };
  }, [onClose]);
  
  // Set up video element after stream is available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      
      // Use onloadedmetadata instead of directly calling play()
      videoRef.current.onloadedmetadata = () => {
        // Wait a little bit before playing to ensure metadata is fully loaded
        setTimeout(() => {
          if (videoRef.current && stream) {
            const playPromise = videoRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('QRCodeScanner: Video playback started successfully');
                  setVideoReady(true);
                })
                .catch(err => {
                  console.error('QRCodeScanner: Error playing video:', err);
                  setError('Error starting video: ' + (err.message || 'Unknown error'));
                });
            }
          }
        }, 100);
      };
    }
  }, [stream]);
  
  // Start scanning when video is ready
  useEffect(() => {
    if (videoReady && !scanning) {
      setScanning(true);
      startScanning();
    }
  }, [videoReady, scanning]);
  
  const stopCamera = () => {
    if (stream) {
      console.log('QRCodeScanner: Stopping camera stream');
      stream.getTracks().forEach(track => {
        console.log('QRCodeScanner: Stopping track:', track.label);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setVideoReady(false);
  };
  
  const stopScanning = () => {
    if (scanIntervalRef.current) {
      console.log('QRCodeScanner: Stopping scan interval');
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };
  
  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Start scanning at regular intervals
    scanIntervalRef.current = setInterval(() => {
      // Only process frames if video is playing and has enough data
      if (videoRef.current && 
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        
        // Set canvas size to match video dimensions
        const videoWidth = videoRef.current.videoWidth || 640;
        const videoHeight = videoRef.current.videoHeight || 480;
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(
          videoRef.current, 
          0, 0, 
          canvas.width, 
          canvas.height
        );
        
        // Get image data for QR code processing
        let imageData;
        try {
          imageData = context.getImageData(
            0, 0, 
            canvas.width, 
            canvas.height
          );
          
          // Look for QR code in the image
          const code = jsQR(
            imageData.data, 
            imageData.width, 
            imageData.height, 
            { inversionAttempts: 'dontInvert' }
          );
          
          // If QR code found, process it
          if (code && code.data) {
            console.log('QRCodeScanner: QR code detected:', code.data);
            
            // Check if it's our app's QR code
            if (code.data.startsWith('INPAWGRESS:')) {
              // Extract patient ID from QR code
              const patientId = code.data.replace('INPAWGRESS:', '');
              
              // Stop scanning and close camera
              stopScanning();
              stopCamera();
              
              // Call the onScan callback with the patient ID
              if (onScan) {
                onScan(patientId);
              }
            }
          }
        } catch (err) {
          console.error('QRCodeScanner: Error processing frame:', err);
          // Continue scanning on error - don't interrupt the process
        }
      }
    }, 250); // Scan every 250ms for better performance
  };
  
  const handleCloseClick = () => {
    console.log('QRCodeScanner: Close button clicked');
    stopScanning();
    stopCamera();
    onClose();
  };
  
  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h3>Scan Patient QR Code</h3>
        <button className="close-button" onClick={handleCloseClick}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="scanner-content">
        {error ? (
          <div className="scanner-error">
            <p>{error}</p>
            <p>Please ensure you've given permission to access the camera.</p>
          </div>
        ) : (
          <div className="video-container">
            <video 
              ref={videoRef}
              className="scanner-video"
              muted
              playsInline
            />
            <div className="scanning-overlay">
              <div className="scan-area">
                <div className="corner-tl"></div>
                <div className="corner-tr"></div>
                <div className="corner-bl"></div>
                <div className="corner-br"></div>
              </div>
              <div className="scan-instructions">
                <FontAwesomeIcon icon={faQrcode} />
                <p>Position the QR code within the frame</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default QRCodeScanner;