// src/components/StatusManagement.js - Complete with edit functionality
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
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';

const StatusManagement = ({ onClose }) => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState({
    name: '',
    description: '',
    color: '#4285f4'
  });
  const [editingStatus, setEditingStatus] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color: '#4285f4'
  });
  const [error, setError] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

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

  const loadStatuses = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get first clinic
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
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setStatuses(data || []);
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
      setError('Failed to load statuses: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = async (e) => {
    e.preventDefault();
    
    if (!newStatus.name.trim()) {
      setError('Status name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Get clinic ID
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
      setNewStatus({ name: '', description: '', color: '#4285f4' });
      alert('Status added successfully!');
    } catch (error) {
      console.error('Error adding status:', error);
      setError('Failed to add status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStatus = (status) => {
    // Close dropdown
    setOpenDropdownId(null);
    
    // Set up edit form with current status data
    setEditingStatus(status);
    setEditForm({
      name: status.name,
      description: status.description || '',
      color: status.color
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!editForm.name.trim()) {
      setError('Status name is required');
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
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStatus.id)
        .select()
        .single();

      if (error) throw error;

      // Update the status in local state
      setStatuses(prev => prev.map(status => 
        status.id === editingStatus.id ? data : status
      ));

      // Close edit modal
      setEditingStatus(null);
      setEditForm({ name: '', description: '', color: '#4285f4' });
      
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStatus(null);
    setEditForm({ name: '', description: '', color: '#4285f4' });
    setError('');
  };

  const handleDeleteStatus = async (statusId, statusName) => {
    // Close dropdown
    setOpenDropdownId(null);
    
    if (!window.confirm(`Delete "${statusName}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('clinic_statuses')
        .delete()
        .eq('id', statusId);

      if (error) throw error;
      setStatuses(prev => prev.filter(status => status.id !== statusId));
      alert('Status deleted successfully!');
    } catch (error) {
      console.error('Error deleting status:', error);
      setError('Failed to delete status: ' + error.message);
    }
  };

  const toggleDropdown = (statusId) => {
    setOpenDropdownId(openDropdownId === statusId ? null : statusId);
  };

  return (
    <div style={{ 
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
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        width: '100%', 
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '20px',
          backgroundColor: '#4285f4',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FontAwesomeIcon icon={faCog} />
            {editingStatus ? 'Edit Status' : 'Manage Status Options'}
          </h3>
          <button 
            onClick={editingStatus ? handleCancelEdit : onClose}
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

          {/* Add New Status - Hide when editing */}
          {!editingStatus && (
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

          {/* Current Statuses - Hide when editing */}
          {!editingStatus && (
            <div>
              <h4 style={{ margin: '0 0 16px 0' }}>Current Custom Statuses ({statuses.length})</h4>
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
                  {statuses.map(status => (
                    <div 
                      key={status.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'white',
                        border: '1px solid #e1e5e9',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
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
                          <div style={{ fontWeight: '500', fontSize: '16px', wordBreak: 'break-word' }}>
                            {status.name}
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
                        </div>
                      </div>
                      
                      {/* Dropdown Menu */}
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
                            zIndex: 10,
                            minWidth: '120px',
                            marginTop: '4px',
                            overflow: 'hidden'
                          }}>
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
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Footer - Hide when editing */}
          {!editingStatus && (
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
  );
};

export default StatusManagement;