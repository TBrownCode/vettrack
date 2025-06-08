// src/hooks/useConfirmation.js - Hook for managing confirmation dialogs
import { useState, useCallback } from 'react';

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null,
    onCancel: null
  });

  const showConfirmation = useCallback(({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    onConfirm,
    onCancel
  }) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm,
      onCancel
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) {
      confirmation.onConfirm();
    }
    hideConfirmation();
  }, [confirmation.onConfirm, hideConfirmation]);

  const handleCancel = useCallback(() => {
    if (confirmation.onCancel) {
      confirmation.onCancel();
    }
    hideConfirmation();
  }, [confirmation.onCancel, hideConfirmation]);

  // Convenience methods for different types
  const confirmDelete = useCallback((title, message, onConfirm, onCancel) => {
    showConfirmation({
      title,
      message,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm,
      onCancel
    });
  }, [showConfirmation]);

  const confirmAction = useCallback((title, message, onConfirm, onCancel) => {
    showConfirmation({
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm,
      onCancel
    });
  }, [showConfirmation]);

  const confirmWarning = useCallback((title, message, onConfirm, onCancel) => {
    showConfirmation({
      title,
      message,
      confirmText: 'Continue',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm,
      onCancel
    });
  }, [showConfirmation]);

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    handleCancel,
    confirmDelete,
    confirmAction,
    confirmWarning
  };
};