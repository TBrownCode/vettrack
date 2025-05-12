// Utility functions for camera access and permissions

/**
 * Check if the device has camera support
 * @returns {boolean} Whether camera is supported
 */
export const isCameraSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };
  
  /**
   * Check if the device has camera permission
   * @returns {Promise<boolean>} Promise resolving to whether permission is granted
   */
  export const checkCameraPermission = async () => {
    try {
      // Try to get user media with only video to check permission without activating camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // If successful, stop all tracks and return true
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.log('Camera permission check error:', error);
      // If permission denied or not available
      return false;
    }
  };
  
  /**
   * Request camera permission
   * @returns {Promise<boolean>} Promise resolving to whether permission was granted
   */
  export const requestCameraPermission = async () => {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // If successful, stop all tracks and return true
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };
  
  /**
   * Get available cameras on the device
   * @returns {Promise<MediaDeviceInfo[]>} Promise resolving to list of video input devices
   */
  export const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Error getting available cameras:', error);
      return [];
    }
  };