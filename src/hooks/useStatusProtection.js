// src/hooks/useStatusProtection.js - Complete hook with database integration
import { useState, useCallback } from 'react';
import { getAllStatusOptions } from '../services/statusService';

export const useStatusProtection = () => {
  const [protection, setProtection] = useState({
    isOpen: false,
    status: '',
    patientName: '',
    protectionType: 'confirmation',
    onConfirm: null,
    onCancel: null
  });

  // Get protection type from database status options
  const getStatusProtectionType = useCallback(async (statusName) => {
    try {
      const statusOptions = await getAllStatusOptions();
      const statusOption = statusOptions.find(opt => opt.value === statusName);
      
      // Return the protection_level from database, or null if none/not found
      return statusOption?.protection_level && statusOption.protection_level !== 'none' 
        ? statusOption.protection_level 
        : null;
    } catch (error) {
      console.error('Error getting status protection type:', error);
      return null;
    }
  }, []);

  const requiresProtection = useCallback(async (statusName) => {
    const protectionType = await getStatusProtectionType(statusName);
    return protectionType !== null;
  }, [getStatusProtectionType]);

  const showStatusProtection = useCallback(async ({
    status,
    patientName,
    onConfirm,
    onCancel
  }) => {
    const protectionType = await getStatusProtectionType(status);
    
    if (!protectionType) {
      // No protection needed, immediately confirm
      onConfirm();
      return;
    }

    setProtection({
      isOpen: true,
      status,
      patientName,
      protectionType,
      onConfirm,
      onCancel
    });
  }, [getStatusProtectionType]);

  const hideStatusProtection = useCallback(() => {
    setProtection(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (protection.onConfirm) {
      protection.onConfirm();
    }
    hideStatusProtection();
  }, [protection.onConfirm, hideStatusProtection]);

  const handleCancel = useCallback(() => {
    if (protection.onCancel) {
      protection.onCancel();
    }
    hideStatusProtection();
  }, [protection.onCancel, hideStatusProtection]);

  // Convenience method for status changes
  const changeStatusWithProtection = useCallback((statusName, patientName, onSuccess, onCancel) => {
    showStatusProtection({
      status: statusName,
      patientName,
      onConfirm: onSuccess,
      onCancel: onCancel || (() => {})
    });
  }, [showStatusProtection]);

  // Get user-friendly description of protection level
  const getProtectionDescription = useCallback(async (statusName) => {
    const protectionType = await getStatusProtectionType(statusName);
    
    switch (protectionType) {
      case 'double-confirm':
        return 'Critical status - requires double confirmation';
      case 'delay':
        return 'Important status - 5 second delay with cancel option';
      case 'confirmation':
        return 'Sensitive status - requires confirmation';
      default:
        return 'Standard status change';
    }
  }, [getStatusProtectionType]);

  // Synchronous version for UI display (checks cached status options)
  const requiresProtectionSync = useCallback((statusName, statusOptions) => {
    if (!statusOptions) return false;
    const statusOption = statusOptions.find(opt => opt.value === statusName);
    return statusOption?.protection_level && statusOption.protection_level !== 'none';
  }, []);

  const getProtectionDescriptionSync = useCallback((statusName, statusOptions) => {
    if (!statusOptions) return 'Standard status change';
    
    const statusOption = statusOptions.find(opt => opt.value === statusName);
    const protectionType = statusOption?.protection_level;
    
    switch (protectionType) {
      case 'double-confirm':
        return 'Critical status - requires double confirmation';
      case 'delay':
        return 'Important status - 5 second delay with cancel option';
      case 'confirmation':
        return 'Sensitive status - requires confirmation';
      default:
        return 'Standard status change';
    }
  }, []);

  return {
    protection,
    requiresProtection,
    requiresProtectionSync,
    showStatusProtection,
    hideStatusProtection,
    handleConfirm,
    handleCancel,
    changeStatusWithProtection,
    getProtectionDescription,
    getProtectionDescriptionSync,
    getStatusProtectionType
  };
};