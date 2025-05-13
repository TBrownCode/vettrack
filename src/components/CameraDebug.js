// src/components/CameraDebug.js
import React, { useEffect, useState } from 'react';

const CameraDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    userAgent: navigator.userAgent,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
    isSecure: window.location.protocol === 'https:',
    mediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    screen: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
  
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(device => device.kind === 'videoinput');
          setDebugInfo(prev => ({
            ...prev,
            cameras: cameras.length,
            cameraDetails: cameras.map(c => c.label || 'Unnamed camera').join(', ')
          }));
        }
      } catch (e) {
        console.error("Error checking cameras:", e);
      }
    };
    
    checkCameraSupport();
  }, []);
  
  /*return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '10px',
      fontFamily: 'monospace',
      zIndex: 9999
    }}>
      <div>User Agent: {debugInfo.userAgent}</div>
      <div>iOS: {debugInfo.isIOS ? 'Yes' : 'No'}</div>
      <div>Secure Context: {debugInfo.isSecure ? 'Yes' : 'No'}</div>
      <div>Media Devices API: {debugInfo.mediaDevices ? 'Available' : 'Not Available'}</div>
      <div>getUserMedia: {debugInfo.getUserMedia ? 'Available' : 'Not Available'}</div>
      <div>Cameras: {debugInfo.cameras || 'Unknown'}</div>
      <div>Screen: {debugInfo.screen.width}x{debugInfo.screen.height}</div>
    </div>
  ); */
};

export default CameraDebug;