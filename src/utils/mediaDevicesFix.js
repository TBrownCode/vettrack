// src/utils/mediaDevicesFix.js

export const applyMediaDevicesFix = () => {
  // Check if browser has navigator.mediaDevices
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {};
  }

  // Check if browser has navigator.mediaDevices.getUserMedia
  if (!navigator.mediaDevices.getUserMedia) {
    // Use the older versions of getUserMedia if available
    navigator.mediaDevices.getUserMedia = (constraints) => {
      const getUserMedia = 
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      // Return a rejected promise if getUserMedia is not supported
      if (!getUserMedia) {
        return Promise.reject(
          new Error('getUserMedia is not implemented in this browser')
        );
      }

      // Otherwise, return a promise that wraps the old getUserMedia API
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }
};

// Call this function immediately
applyMediaDevicesFix();