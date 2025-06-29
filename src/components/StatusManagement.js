// src/components/StatusManagement.js - Complete file with protection level configuration
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTimes, 
  faTrash, 
  faCog,
  faCircle,
  faEllipsisV,
  faEdit,
  faSave,
  faGripVertical,
  faCheck,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useConfirmation } from '../hooks/useConfirmation';
import { ToastContainer } from './Toast';
import ConfirmationDialog from './ConfirmationDialog';

const StatusManagement = ({ onClose }) => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState({
    name: '',
    description: '',
    color: '#4285f4',
    protection_level: 'none'
  });
  const [editingStatus, setEditingStatus] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color: '#4285f4',
    protection_level: 'none'
  });
  const [error, setError] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  // Reordering states
  const [reorderMode, setReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);

  // Toast notifications
  const { toasts, showSuccess, showError, showWarning, hideToast } = useToast();
  
  // Confirmation dialog
  const { 
    confirmation, 
    handleConfirm, 
    handleCancel, 
    confirmDelete 
  } = useConfirmation();

  // Protection level options
  const protectionLevels = [
    { value: 'none', label: 'No Protection', description: 'Immediate status change', color: '#6c757d' },
    { value: 'confirmation', label: 'Confirmation Required', description: 'Single confirmation dialog', color: '#17a2b8' },
    { value: 'delay', label: 'Delay Protection', description: '5-second delay with cancel option', color: '#ffc107' },
    { value: 'double-confirm', label: 'Double Confirmation', description: 'Two-step confirmation process', color: '#dc3545' }
  ];

  // Color options
  const colorOptions = [
    '#4285f4', // Blue
    '#34a853', // Green
    '#ea4335', // Red
    '#fbbc05', // Yellow
    '#fa903e', // Orange
    '#a142f4'  // Purple
  ];

  // Load existing custom statuses
  useEffect(() => {
    loadStatuses();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.status-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Close modal when clicking outside
  const handleModalBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      if (editingStatus) {
        handleCancelEdit();
      } else {
        onClose();
      }
    }
  };

  const loadStatuses = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .limit(1)
        .single();

      if (clinic) {
        const { data, error } = await supabase
          .from('clinic_statuses')
          .select('*')
          .eq('clinic_id', clinic.id)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setStatuses(data || []);
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
      setError('Failed to load statuses: ' + error.message);
      showError('Failed to load statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = async (e) => {
    e.preventDefault();
    
    if (!newStatus.name.trim()) {
      setError('Status name is required');
      showWarning('Status name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .limit(1)
        .single();

      if (!clinic) {
        throw new Error('No clinic found');
      }

      const statusToAdd = {
        clinic_id: clinic.id,
        name: newStatus.name,
        description: newStatus.description,
        color: newStatus.color,
        protection_level: newStatus.protection_level,
        category: 'general',
        order_index: statuses.length + 1,
        is_active: true
      };

      const { data, error } = await supabase
        .from('clinic_statuses')
        .insert(statusToAdd)
        .select()
        .single();

      if (error) throw error;

      setStatuses(prev => [...prev, data]);
      setNewStatus({ name: '', description: '', color: '#4285f4', protection_level: 'none' });
      showSuccess(`Status "${newStatus.name}" added successfully!`);
    } catch (error) {
      console.error('Error adding status:', error);
      setError('Failed to add status: ' + error.message);
      showError('Failed to add status');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStatus = (status) => {
    setOpenDropdownId(null);
    setReorderMode(false);
    
    setEditingStatus(status);
    setEditForm({
      name: status.name,
      description: status.description || '',
      color: status.color,
      protection_level: status.protection_level || 'none'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name.trim()) {
      setError('Status name is required');
      showWarning('Status name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('clinic_statuses')
        .update({
          name: editForm.name,
          description: editForm.description,
          color: editForm.color,
          protection_level: editForm.protection_level,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStatus.id)
        .select()
        .single();

      if (error) throw error;

      setStatuses(prev => prev.map(status => 
        status.id === editingStatus.id ? data : status
      ));

      const oldName = editingStatus.name;
      setEditingStatus(null);
      setEditForm({ name: '', description: '', color: '#4285f4', protection_level: 'none' });
      
      showSuccess(`Status "${oldName}" updated successfully!`);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status: ' + error.message);
      showError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStatus(null);
    setEditForm({ name: '', description: '', color: '#4285f4', protection_level: 'none' });
    setError('');
  };

  const handleToggleActive = async (statusId, currentActiveState, statusName) => {
    setOpenDropdownId(null);
    
    try {
      const newActiveState = !currentActiveState;
      
      const { error } = await supabase
        .from('clinic_statuses')
        .update({ 
          is_active: newActiveState,
          updated_at: new Date().toISOString() 
        })
        .eq('id', statusId);

      if (error) throw error;

      setStatuses(prev => prev.map(status => 
        status.id === statusId 
          ? { ...status, is_active: newActiveState }
          : status
      ));

      const action = newActiveState ? 'activated' : 'deactivated';
      showSuccess(`Status "${statusName}" ${action} successfully!`);
    } catch (error) {
      console.error('Error toggling status active state:', error);
      showError('Failed to update status');
    }
  };

  const handleDeleteStatus = (statusId, statusName) => {
    setOpenDropdownId(null);
    setReorderMode(false);
    
    // Use the confirmation dialog instead of window.confirm
    confirmDelete(
      'Delete Status',
      `Delete "${statusName}"? This cannot be undone.`,
      async () => {
        try {
          const { error } = await supabase
            .from('clinic_statuses')
            .delete()
            .eq('id', statusId);

          if (error) throw error;
          setStatuses(prev => prev.filter(status => status.id !== statusId));
          showSuccess(`Status "${statusName}" deleted successfully!`);
        } catch (error) {
          console.error('Error deleting status:', error);
          setError('Failed to delete status: ' + error.message);
          showError('Failed to delete status');
        }
      }
    );
  };

  const toggleDropdown = (statusId) => {
    if (reorderMode) return;
    setOpenDropdownId(openDropdownId === statusId ? null : statusId);
  };

  // Long press handlers for reordering
  const handleMouseDown = (index) => {
    if (editingStatus) return;
    
    const timer = setTimeout(() => {
      setReorderMode(true);
      setOpenDropdownId(null);
    }, 800);
    
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchStart = (index) => {
    if (editingStatus) return;
    
    const timer = setTimeout(() => {
      setReorderMode(true);
      setOpenDropdownId(null);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 800);
    
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newStatuses = [...statuses];
    const draggedStatus = newStatuses[draggedIndex];
    
    newStatuses.splice(draggedIndex, 1);
    newStatuses.splice(dropIndex, 0, draggedStatus);
    
    setStatuses(newStatuses);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSaveOrder = async () => {
    try {
      setLoading(true);
      setError('');

      const updatePromises = statuses.map((status, index) => 
        supabase
          .from('clinic_statuses')
          .update({ order_index: index + 1 })
          .eq('id', status.id)
      );

      const results = await Promise.all(updatePromises);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Failed to update some status orders');
      }

      setReorderMode(false);
      showSuccess('Status order saved successfully!');
    } catch (error) {
      console.error('Error saving status order:', error);
      setError('Failed to save status order: ' + error.message);
      showError('Failed to save status order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReorder = () => {
    setReorderMode(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
    loadStatuses();
  };

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={handleModalBackdropClick}
      >
        <div 
          style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            width: '100%', 
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '20px',
            backgroundColor: reorderMode ? '#28a745' : (editingStatus ? '#ffc107' : '#4285f4'),
            color: 'white',
            borderRadius: '12px 12px 0 0'
          }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={reorderMode ? faGripVertical : (editingStatus ? faEdit : faCog)} />
              {reorderMode ? 'Reorder Statuses' : (editingStatus ? 'Edit Status' : 'Manage Status Options')}
            </h3>
            <button 
              onClick={reorderMode ? handleCancelReorder : (editingStatus ? handleCancelEdit : onClose)}
              style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.25rem', cursor: 'pointer' }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {error && (
              <div style={{ 
                backgroundColor: '#fee', 
                color: '#d63031', 
                padding: '12px', 
                borderRadius: '6px', 
                marginBottom: '20px',
                border: '1px solid #fab1a0'
              }}>
                {error}
              </div>
            )}

            {/* Reorder Instructions */}
            {reorderMode && (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                border: '1px solid #c3e6cb'
              }}>
                <strong>Reorder Mode Active</strong><br />
                Drag and drop statuses to reorder them. The order here will be the order in dropdown menus.
              </div>
            )}

            {/* Reorder Action Buttons */}
            {reorderMode && (
              <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveOrder}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  Save Order
                </button>
                <button
                  onClick={handleCancelReorder}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Edit Status Form */}
            {editingStatus && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#856404' }}>
                  <FontAwesomeIcon icon={faEdit} style={{ marginRight: '8px' }} />
                  Editing: {editingStatus.name}
                </h4>
                <form onSubmit={handleSaveEdit}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Status Name*
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Dental Cleaning, X-Ray Complete"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description for pet owners"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Color
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      flexWrap: 'wrap',
                      justifyContent: 'flex-start',
                      alignItems: 'center'
                    }}>
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, color }))}
                          style={{
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            minHeight: '36px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: editForm.color === color ? '3px solid #333' : '2px solid #e1e5e9',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                          }}
                        >
                          {editForm.color === color && <FontAwesomeIcon icon={faCircle} style={{ fontSize: '10px' }} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Protection Level
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {protectionLevels.map(level => (
                        <label
                          key={level.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            border: editForm.protection_level === level.value ? `2px solid ${level.color}` : '1px solid #e1e5e9',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: editForm.protection_level === level.value ? `${level.color}10` : 'white',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input
                            type="radio"
                            name="editProtectionLevel"
                            value={level.value}
                            checked={editForm.protection_level === level.value}
                            onChange={(e) => setEditForm(prev => ({ ...prev, protection_level: e.target.value }))}
                            style={{ marginRight: '12px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500', 
                              color: editForm.protection_level === level.value ? level.color : '#333',
                              marginBottom: '2px'
                            }}>
                              {level.label}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#666',
                              lineHeight: '1.3'
                            }}>
                              {level.description}
                            </div>
                          </div>
                          {editForm.protection_level === level.value && (
                            <FontAwesomeIcon 
                              icon={faCheck} 
                              style={{ color: level.color, marginLeft: '8px' }}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      <FontAwesomeIcon icon={faSave} />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add New Status Form */}
            {!editingStatus && !reorderMode && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Add New Status</h4>
                <form onSubmit={handleAddStatus}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Status Name*
                    </label>
                    <input
                      type="text"
                      value={newStatus.name}
                      onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Dental Cleaning, X-Ray Complete"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={newStatus.description}
                      onChange={(e) => setNewStatus(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description for pet owners"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Color
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      flexWrap: 'wrap',
                      justifyContent: 'flex-start',
                      alignItems: 'center'
                    }}>
                      {colorOptions.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewStatus(prev => ({ ...prev, color }))}
                          style={{
                            width: '36px',
                            height: '36px',
                            minWidth: '36px',
                            minHeight: '36px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: newStatus.color === color ? '3px solid #333' : '2px solid #e1e5e9',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                          }}
                        >
                          {newStatus.color === color && <FontAwesomeIcon icon={faCircle} style={{ fontSize: '10px' }} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Protection Level
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {protectionLevels.map(level => (
                        <label
                          key={level.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            border: newStatus.protection_level === level.value ? `2px solid ${level.color}` : '1px solid #e1e5e9',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: newStatus.protection_level === level.value ? `${level.color}10` : 'white',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input
                            type="radio"
                            name="newProtectionLevel"
                            value={level.value}
                            checked={newStatus.protection_level === level.value}
                            onChange={(e) => setNewStatus(prev => ({ ...prev, protection_level: e.target.value }))}
                            style={{ marginRight: '12px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: '500', 
                              color: newStatus.protection_level === level.value ? level.color : '#333',
                              marginBottom: '2px'
                            }}>
                              {level.label}
                            </div>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              color: '#666',
                              lineHeight: '1.3'
                            }}>
                              {level.description}
                            </div>
                          </div>
                          {newStatus.protection_level === level.value && (
                            <FontAwesomeIcon 
                              icon={faCheck} 
                              style={{ color: level.color, marginLeft: '8px' }}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#4285f4',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    {loading ? 'Adding...' : 'Add Status'}
                  </button>
                </form>
              </div>
            )}

            {/* Current Statuses */}
            {!editingStatus && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0 }}>Current Custom Statuses ({statuses.length})</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34a853' }}></div>
                        Active
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ccc' }}></div>
                        Inactive
                      </span>
                    </div>
                    {!reorderMode && statuses.length > 1 && (
                      <p style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        Long press to reorder
                      </p>
                    )}
                  </div>
                </div>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    Loading statuses...
                  </div>
                ) : statuses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <p>No custom statuses yet.</p>
                    <p style={{ fontSize: '14px' }}>Add your first custom status above!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {statuses.map((status, index) => (
                      <div 
                        key={status.id}
                        draggable={reorderMode}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onMouseDown={() => handleMouseDown(index)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onTouchStart={() => handleTouchStart(index)}
                        onTouchEnd={handleTouchEnd}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          backgroundColor: dragOverIndex === index ? '#e3f2fd' : (reorderMode ? '#f8f9fa' : 'white'),
                          border: reorderMode ? '2px dashed #ccc' : '1px solid #e1e5e9',
                          borderRadius: '6px',
                          boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                          position: 'relative',
                          cursor: reorderMode ? 'grab' : 'default',
                          userSelect: 'none',
                          opacity: status.is_active ? (draggedIndex === index ? 0.5 : 1) : 0.6,
                          transform: draggedIndex === index ? 'rotate(2deg)' : 'none',
                          transition: reorderMode ? 'none' : 'all 0.2s ease',
                          zIndex: (openDropdownId === status.id) ? 15 : 1
                        }}
                      >
                        {reorderMode && (
                          <div style={{
                            position: 'absolute',
                            left: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666',
                            fontSize: '16px'
                          }}>
                            <FontAwesomeIcon icon={faGripVertical} />
                          </div>
                        )}
                        
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          flex: 1,
                          marginLeft: reorderMode ? '24px' : '0'
                        }}>
                          <div 
                            style={{
                              width: '20px',
                              height: '20px',
                              minWidth: '20px',
                              minHeight: '20px',
                              borderRadius: '50%',
                              backgroundColor: status.color,
                              border: '2px solid white',
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: '500', 
                              fontSize: '16px', 
                              wordBreak: 'break-word',
                              textDecoration: status.is_active ? 'none' : 'line-through',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>{status.name}</span>
                              {/* Protection level indicator */}
                              {status.protection_level && status.protection_level !== 'none' && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  backgroundColor: protectionLevels.find(p => p.value === status.protection_level)?.color || '#6c757d',
                                  color: 'white',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {status.protection_level === 'double-confirm' ? 'CRITICAL' :
                                   status.protection_level === 'delay' ? 'DELAY' :
                                   status.protection_level === 'confirmation' ? 'CONFIRM' : 'PROTECTED'}
                                </span>
                              )}
                            </div>
                            {status.description && (
                              <div style={{ 
                                fontSize: '14px', 
                                color: '#666', 
                                marginTop: '2px',
                                wordBreak: 'break-word',
                                lineHeight: '1.4'
                              }}>
                                {status.description}
                              </div>
                            )}
                            {/* Protection level description */}
                            {status.protection_level && status.protection_level !== 'none' && (
                              <div style={{ 
                                fontSize: '12px', 
                                color: protectionLevels.find(p => p.value === status.protection_level)?.color || '#6c757d',
                                marginTop: '4px',
                                fontStyle: 'italic'
                              }}>
                                {protectionLevels.find(p => p.value === status.protection_level)?.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {!reorderMode && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Active/Inactive status indicator */}
                            <div 
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: status.is_active ? '#34a853' : '#ccc',
                                flexShrink: 0
                              }}
                              title={status.is_active ? 'Active - appears in dropdowns' : 'Inactive - hidden from dropdowns'}
                            />
                            
                            {/* Options dropdown */}
                            <div className="status-dropdown-container" style={{ position: 'relative' }}>
                              <button
                                onClick={() => toggleDropdown(status.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#666',
                                  cursor: 'pointer',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  fontSize: '16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Status options"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} />
                              </button>
                              
                              {openDropdownId === status.id && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: 0,
                                  backgroundColor: 'white',
                                  border: '1px solid #e1e5e9',
                                  borderRadius: '6px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                  zIndex: 20,
                                  minWidth: '140px',
                                  marginTop: '4px',
                                  overflow: 'hidden'
                                }}>
                                  <button
                                    onClick={() => handleToggleActive(status.id, status.is_active, status.name)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '10px 12px',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      color: status.is_active ? '#d32f2f' : '#28a745'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    <FontAwesomeIcon 
                                      icon={status.is_active ? faEyeSlash : faEye} 
                                      style={{ color: status.is_active ? '#d32f2f' : '#28a745' }} 
                                    />
                                    {status.is_active ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => handleEditStatus(status)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '10px 12px',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      color: '#333'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    <FontAwesomeIcon icon={faEdit} style={{ color: '#4285f4' }} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStatus(status.id, status.name)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      width: '100%',
                                      padding: '10px 12px',
                                      border: 'none',
                                      background: 'none',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      color: '#d32f2f'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!editingStatus && !reorderMode && (
              <div style={{ 
                marginTop: '24px', 
                padding: '12px', 
                backgroundColor: '#e8f0fe', 
                borderRadius: '6px',
                fontSize: '14px',
                color: '#1a73e8'
              }}>
                <strong>Note:</strong> Custom statuses will be available in patient status dropdowns. 
                You can create statuses specific to your clinic's procedures and workflow.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        type={confirmation.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onHideToast={hideToast} />
    </>
  );
};

export default StatusManagement;