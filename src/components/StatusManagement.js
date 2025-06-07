// src/components/StatusManagement.js - Full featured version
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTimes, 
  faTrash, 
  faCog,
  faCircle
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
  const [error, setError] = useState('');

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

  const handleDeleteStatus = async (statusId, statusName) => {
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
            Manage Status Options
          </h3>
          <button 
            onClick={onClose}
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

          {/* Add New Status */}
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
                        minWidth: '36px', // Prevent shrinking
                        minHeight: '36px', // Prevent shrinking
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: newStatus.color === color ? '3px solid #333' : '2px solid #e1e5e9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0 // Prevent flex shrinking
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

          {/* Current Statuses */}
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
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div 
                        style={{
                          width: '20px',
                          height: '20px',
                          minWidth: '20px', // Prevent shrinking
                          minHeight: '20px', // Prevent shrinking
                          borderRadius: '50%',
                          backgroundColor: status.color,
                          border: '2px solid white',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
                          flexShrink: 0 // Prevent flex shrinking
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth: 0 allows text to wrap */}
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
                    <button
                      onClick={() => handleDeleteStatus(status.id, status.name)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d32f2f',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                      title={`Delete ${status.name}`}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Footer */}
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
        </div>
      </div>
    </div>
  );
};

export default StatusManagement;