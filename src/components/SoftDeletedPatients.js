// src/components/SoftDeletedPatients.js - Component to manage soft-deleted patients
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faTrash, 
  faUndo, 
  faClock, 
  faExclamationTriangle,
  faUser,
  faPhone,
  faEnvelope,
  faHeart,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useConfirmation } from '../hooks/useConfirmation';
import { ToastContainer } from './Toast';
import ConfirmationDialog from './ConfirmationDialog';
import '../styles/SoftDeletedPatients.css';

const SoftDeletedPatients = ({ onClose }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Toast and confirmation
  const { toasts, showSuccess, showError, hideToast } = useToast();
  const { 
    confirmation, 
    handleConfirm, 
    handleCancel, 
    confirmDelete,
    showConfirmation 
  } = useConfirmation();

  useEffect(() => {
    loadSoftDeletedPatients();
    
    // Set up auto-refresh every 30 seconds to update time remaining
    const refreshInterval = setInterval(() => {
      loadSoftDeletedPatients();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const loadSoftDeletedPatients = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          clinic:clinics(name)
        `)
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      // Transform data and calculate time remaining
      const now = new Date();
      const transformedPatients = data.map(patient => {
        const deletionExpires = new Date(patient.deletion_expires_at);
        const timeRemainingMs = deletionExpires - now;
        const hoursRemaining = Math.max(0, Math.ceil(timeRemainingMs / (1000 * 60 * 60)));
        const isExpired = timeRemainingMs <= 0;

        return {
          id: patient.id,
          name: patient.name,
          species: patient.species,
          breed: patient.breed || '',
          owner: patient.owner_name,
          phone: patient.owner_phone,
          email: patient.owner_email,
          status: patient.status,
          photoUrl: patient.photo_url,
          deletedAt: new Date(patient.deleted_at).toLocaleString(),
          deletionExpiresAt: deletionExpires,
          timeRemainingHours: hoursRemaining,
          isExpired
        };
      });

      setPatients(transformedPatients);
    } catch (error) {
      console.error('Error loading soft-deleted patients:', error);
      setError('Failed to load deleted patients: ' + error.message);
      showError('Failed to load deleted patients');
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePatient = (patientId, patientName) => {
    showConfirmation({
      title: 'Restore Patient',
      message: `Restore "${patientName}" back to the active patient list?`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      type: 'info', // Changed from 'danger' to 'info' for blue/green styling
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('patients')
            .update({
              is_deleted: false,
              deleted_at: null,
              deletion_expires_at: null
            })
            .eq('id', patientId);

          if (error) throw error;

          setPatients(prev => prev.filter(p => p.id !== patientId));
          showSuccess(`"${patientName}" has been restored successfully!`);
        } catch (error) {
          console.error('Error restoring patient:', error);
          showError('Failed to restore patient');
        }
      },
      onCancel: () => {
        // Just close the dialog
      }
    });
  };

  const handlePermanentDelete = (patientId, patientName) => {
    confirmDelete(
      'Permanently Delete Patient',
      `Permanently delete "${patientName}"? This action cannot be undone and will remove all data including photos and status history.`,
      async () => {
        try {
          // First delete related data
          const deletePromises = [
            supabase.from('status_photos').delete().eq('patient_id', patientId),
            supabase.from('status_history').delete().eq('patient_id', patientId)
          ];

          await Promise.all(deletePromises);

          // Then delete the patient
          const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', patientId);

          if (error) throw error;

          setPatients(prev => prev.filter(p => p.id !== patientId));
          showSuccess(`"${patientName}" has been permanently deleted.`);
        } catch (error) {
          console.error('Error permanently deleting patient:', error);
          showError('Failed to permanently delete patient');
        }
      }
    );
  };

  const getTimeRemainingColor = (hours, isExpired) => {
    if (isExpired) return '#d32f2f';
    if (hours <= 2) return '#ff9800';
    if (hours <= 6) return '#fbc02d';
    return '#4caf50';
  };

  const getTimeRemainingText = (hours, isExpired) => {
    if (isExpired) return 'Expired';
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  const renderPatientCard = (patient) => (
    <div 
      key={patient.id}
      className={`deleted-patient-card ${patient.isExpired ? 'expired' : ''}`}
    >
      <div className="patient-main-info">
        <div className="patient-avatar-small">
          <img 
            src={patient.photoUrl || '/images/placeholder-pet.png'} 
            alt={patient.name} 
          />
        </div>
        
        <div className="patient-details">
          <div className="patient-header">
            <h4 className="patient-name">{patient.name}</h4>
            <div 
              className="time-remaining-badge"
              style={{ 
                backgroundColor: getTimeRemainingColor(patient.timeRemainingHours, patient.isExpired) + '20',
                color: getTimeRemainingColor(patient.timeRemainingHours, patient.isExpired)
              }}
            >
              <FontAwesomeIcon icon={faClock} />
              {getTimeRemainingText(patient.timeRemainingHours, patient.isExpired)}
            </div>
          </div>
          
          <div className="patient-info-row">
            <span className="info-item">
              <FontAwesomeIcon icon={faHeart} />
              {patient.species} • {patient.breed}
            </span>
            <span className="status-badge-small">
              {patient.status}
            </span>
          </div>
          
          <div className="patient-info-row">
            <span className="info-item">
              <FontAwesomeIcon icon={faUser} />
              {patient.owner}
            </span>
          </div>
          
          <div className="patient-contact-row">
            <span className="info-item">
              <FontAwesomeIcon icon={faPhone} />
              {patient.phone}
            </span>
            {patient.email && (
              <span className="info-item">
                <FontAwesomeIcon icon={faEnvelope} />
                {patient.email}
              </span>
            )}
          </div>
          
          <div className="deletion-info">
            <span className="deleted-date">
              Deleted: {patient.deletedAt}
            </span>
            {!patient.isExpired && (
              <span className="expires-date">
                Expires: {patient.deletionExpiresAt.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="patient-actions">
        <button
          onClick={() => handleRestorePatient(patient.id, patient.name)}
          className="action-btn restore-btn"
          title="Restore patient"
        >
          <FontAwesomeIcon icon={faUndo} />
          Restore
        </button>
        
        <button
          onClick={() => handlePermanentDelete(patient.id, patient.name)}
          className="action-btn delete-btn"
          title="Permanently delete"
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete Forever
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="soft-deleted-modal">
        <div className="soft-deleted-card">
          <div className="soft-deleted-header">
            <h3>
              <FontAwesomeIcon icon={faTrash} />
              Recently Deleted Patients
            </h3>
            <button className="close-button" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="soft-deleted-content">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="info-banner">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <div>
                <strong>24-Hour Grace Period:</strong> Deleted patients remain accessible to owners 
                for 24 hours, then are permanently removed. You can restore or permanently delete them here.
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading deleted patients...</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="no-patients">
                <FontAwesomeIcon icon={faCheck} size="3x" />
                <h4>No Recently Deleted Patients</h4>
                <p>All deleted patients have either been restored or permanently removed.</p>
              </div>
            ) : (
              <>
                <div className="patients-summary">
                  <h4>Found {patients.length} deleted patient{patients.length !== 1 ? 's' : ''}</h4>
                  <div className="legend">
                    <span className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
                      6+ hours remaining
                    </span>
                    <span className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#fbc02d' }}></div>
                      2-6 hours remaining
                    </span>
                    <span className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#ff9800' }}></div>
                      &lt;2 hours remaining
                    </span>
                    <span className="legend-item">
                      <div className="legend-color" style={{ backgroundColor: '#d32f2f' }}></div>
                      Expired
                    </span>
                  </div>
                </div>

                <div className="patients-list">
                  {patients.map(renderPatientCard)}
                </div>
              </>
            )}

            <div className="help-section">
              <h5>Actions Available:</h5>
              <ul>
                <li><strong>Restore:</strong> Move patient back to active list and remove deletion timer</li>
                <li><strong>Delete Forever:</strong> Permanently remove patient and all associated data</li>
                <li><strong>Wait:</strong> Patient will be automatically deleted when timer expires</li>
              </ul>
            </div>
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

export default SoftDeletedPatients;