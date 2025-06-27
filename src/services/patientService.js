// src/services/patientService.js - Updated for multi-clinic compatibility
import { supabase } from '../lib/supabase';
import { uploadPhotoFromDataURL } from './photoService';

// Get all patients (only non-deleted for staff)
export const getPatients = async () => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        clinic:clinics(name)
      `)
      .eq('is_deleted', false) // Only show non-deleted patients to staff
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match your existing format
    return data.map(patient => ({
      id: patient.id,
      name: patient.name,
      species: patient.species,
      breed: patient.breed || '',
      owner: patient.owner_name,
      phone: patient.owner_phone,
      email: patient.owner_email,
      status: patient.status,
      photoUrl: patient.photo_url,
      lastUpdate: new Date(patient.updated_at).toLocaleTimeString()
    }));
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

// Get patient by ID (staff - only non-deleted)
export const getPatientById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        clinic:clinics(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Patient with ID ${id} not found`);

    // Transform data to match your existing format
    return {
      id: data.id,
      name: data.name,
      species: data.species,
      breed: data.breed || '',
      owner: data.owner_name,
      phone: data.owner_phone,
      email: data.owner_email,
      status: data.status,
      photoUrl: data.photo_url,
      lastUpdate: new Date(data.updated_at).toLocaleTimeString()
    };
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

// Get patient by ID for owners (allows viewing during grace period)
export const getPatientByIdForOwner = async (id) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        clinic:clinics(name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Patient with ID ${id} not found`);

    // Check if patient is in grace period
    const now = new Date();
    const deletionExpires = data.deletion_expires_at ? new Date(data.deletion_expires_at) : null;
    const isInGracePeriod = data.is_deleted && deletionExpires && deletionExpires > now;
    const timeRemaining = isInGracePeriod ? 
      Math.ceil((deletionExpires - now) / (1000 * 60 * 60)) : 0;

    // Transform data to match your existing format
    return {
      id: data.id,
      name: data.name,
      species: data.species,
      breed: data.breed || '',
      owner: data.owner_name,
      phone: data.owner_phone,
      email: data.owner_email,
      status: data.status,
      photoUrl: data.photo_url,
      lastUpdate: new Date(data.updated_at).toLocaleTimeString(),
      isDeleted: data.is_deleted,
      isInGracePeriod: isInGracePeriod,
      timeRemaining: timeRemaining
    };
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

// Get patient status history
export const getPatientStatusHistory = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    return data.map(entry => ({
      id: entry.id,
      title: entry.new_status,
      time: new Date(entry.changed_at).toLocaleTimeString(),
      photoUrl: entry.photo_url,
      changedBy: entry.changed_by
    }));
  } catch (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }
};

// Update patient status
export const updatePatientStatus = async (patientId, newStatus, photoUrl = null) => {
  try {
    // Get current patient data
    const { data: currentPatient, error: fetchError } = await supabase
      .from('patients')
      .select('status')
      .eq('id', patientId)
      .single();

    if (fetchError) throw fetchError;

    // Update patient status
    const { data, error: updateError } = await supabase
      .from('patients')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', patientId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add to status history
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        patient_id: patientId,
        old_status: currentPatient.status,
        new_status: newStatus,
        changed_by: 'Staff User',
        photo_url: photoUrl
      });

    if (historyError) {
      console.error('Error creating status history:', historyError);
    }

    return {
      success: true,
      message: `Status updated to "${newStatus}" successfully`
    };
  } catch (error) {
    console.error('Error updating patient status:', error);
    throw error;
  }
};

// Add status photo
export const addStatusPhoto = async (patientId, status, photoDataUrl) => {
  try {
    // Upload photo and get URL
    const photoUrl = await uploadPhotoFromDataURL(photoDataUrl, `${patientId}-${Date.now()}`);

    // Get the most recent status history entry for this patient and status
    const { data: statusEntry, error: statusError } = await supabase
      .from('status_history')
      .select('id')
      .eq('patient_id', patientId)
      .eq('new_status', status)
      .order('changed_at', { ascending: false })
      .limit(1)
      .single();

    if (statusError) throw statusError;

    // Add photo to status_photos table
    const { error } = await supabase
      .from('status_photos')
      .insert({
        status_history_id: statusEntry.id,
        patient_id: patientId,
        status: status,
        photo_url: photoUrl,
        added_by: 'Staff User'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      photoUrl: photoUrl,
      message: `Photo added to "${status}" status successfully`
    };
  } catch (error) {
    console.error('Error adding status photo:', error);
    throw error;
  }
};

// Delete all photos from a specific status
export const deleteStatusPhotos = async (patientId, status) => {
  try {
    // Get all photos for this patient's current status
    const { data: photos, error: fetchError } = await supabase
      .from('status_photos')
      .select('id, photo_url')
      .eq('patient_id', patientId)
      .eq('status', status);

    if (fetchError) throw fetchError;

    if (!photos || photos.length === 0) {
      return {
        success: true,
        message: `No photos found for status "${status}"`
      };
    }

    // Delete all photo records from the database
    const { error: deleteError } = await supabase
      .from('status_photos')
      .delete()
      .eq('patient_id', patientId)
      .eq('status', status);

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: `Deleted ${photos.length} photo(s) from "${status}" status`,
      deletedCount: photos.length
    };
  } catch (error) {
    console.error('Error deleting status photos:', error);
    throw error;
  }
};

// Add new patient with initial status history - UPDATED FOR MULTI-CLINIC
export const addPatient = async (patientData) => {
  try {
    // FIXED: Get clinic ID generically instead of hardcoding clinic name
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)  // Just get the first (and only) clinic in this database
      .single();

    if (!clinic) {
      throw new Error('No clinic found in this database');
    }

    let photoUrl = null;
    
    // Upload photo if provided and it's a data URL
    if (patientData.photoUrl && patientData.photoUrl.startsWith('data:')) {
      photoUrl = await uploadPhotoFromDataURL(patientData.photoUrl, patientData.id);
    } else {
      photoUrl = patientData.photoUrl;
    }

    const newPatient = {
      id: patientData.id,
      clinic_id: clinic.id,
      name: patientData.name,
      species: patientData.species,
      breed: patientData.breed || '',
      owner_name: patientData.owner,
      owner_phone: patientData.phone,
      owner_email: patientData.email || null,
      status: patientData.status || 'Admitted',
      photo_url: photoUrl,
      public_token: patientData.id // Use the same ID as public token for simplicity
    };

    const { data, error } = await supabase
      .from('patients')
      .insert(newPatient)
      .select()
      .single();

    if (error) throw error;

    // Create initial status history entry
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        patient_id: data.id,
        old_status: null,
        new_status: data.status,
        changed_by: 'Staff User'
      });

    if (historyError) {
      console.error('Error creating initial status history:', historyError);
    }

    // Transform back to your format
    return {
      id: data.id,
      name: data.name,
      species: data.species,
      breed: data.breed || '',
      owner: data.owner_name,
      phone: data.owner_phone,
      email: data.owner_email,
      status: data.status,
      photoUrl: data.photo_url,
      lastUpdate: new Date(data.created_at).toLocaleTimeString()
    };
  } catch (error) {
    console.error('Error adding patient:', error);
    throw error;
  }
};

// Soft delete patient with 24-hour grace period
export const deletePatient = async (id) => {
  try {
    // Soft delete: mark as deleted with 24-hour grace period
    const { error } = await supabase
      .from('patients')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deletion_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Patient deleted successfully' 
    };
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// Update patient photo
export const updatePatientPhoto = async (id, photoData) => {
  try {
    // Upload photo to Supabase Storage and get URL
    const photoUrl = await uploadPhotoFromDataURL(photoData, id);
    
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        photo_url: photoUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      photoUrl: photoUrl,
      message: 'Photo updated successfully'
    };
  } catch (error) {
    console.error('Error updating patient photo:', error);
    throw error;
  }
};

// Update patient information
export const updatePatient = async (id, patientData) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .update({
        name: patientData.name,
        species: patientData.species,
        breed: patientData.breed || '',
        owner_name: patientData.owner,
        owner_phone: patientData.phone,
        owner_email: patientData.email || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Transform back to your format
    return {
      id: data.id,
      name: data.name,
      species: data.species,
      breed: data.breed || '',
      owner: data.owner_name,
      phone: data.owner_phone,
      email: data.owner_email,
      status: data.status,
      photoUrl: data.photo_url,
      lastUpdate: new Date(data.updated_at).toLocaleTimeString()
    };
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

// Get status options from clinic_statuses table
export const getAllStatusOptions = async () => {
  try {
    // UPDATED: Get clinic generically instead of hardcoding
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      // Fallback to default statuses if no clinic found
      return [
        { value: 'Admitted', label: 'Admitted', color: '#ffc107' },
        { value: 'Being Examined', label: 'Being Examined', color: '#17a2b8' },
        { value: 'In Surgery', label: 'In Surgery', color: '#dc3545' },
        { value: 'Recovery', label: 'Recovery', color: '#fd7e14' },
        { value: 'Ready for Pickup', label: 'Ready for Pickup', color: '#28a745' }
      ];
    }

    const { data, error } = await supabase
      .from('clinic_statuses')
      .select('*')
      .eq('clinic_id', clinic.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return data.map(status => ({
      value: status.name,
      label: status.name,
      color: status.color,
      description: status.description
    }));
  } catch (error) {
    console.error('Error fetching status options:', error);
    // Return default statuses as fallback
    return [
      { value: 'Admitted', label: 'Admitted', color: '#ffc107' },
      { value: 'Being Examined', label: 'Being Examined', color: '#17a2b8' },
      { value: 'In Surgery', label: 'In Surgery', color: '#dc3545' },
      { value: 'Recovery', label: 'Recovery', color: '#fd7e14' },
      { value: 'Ready for Pickup', label: 'Ready for Pickup', color: '#28a745' }
    ];
  }
};

// Get soft deleted patients (for recovery)
export const getSoftDeletedPatients = async () => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        clinic:clinics(name)
      `)
      .eq('is_deleted', true)
      .order('deleted_at', { ascending: false });

    if (error) throw error;

    return data.map(patient => {
      const deletionExpires = patient.deletion_expires_at ? new Date(patient.deletion_expires_at) : null;
      const now = new Date();
      const timeRemaining = deletionExpires && deletionExpires > now ? 
        Math.ceil((deletionExpires - now) / (1000 * 60 * 60)) : 0;

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
        expiresAt: deletionExpires ? deletionExpires.toLocaleString() : null,
        timeRemaining: timeRemaining,
        canRecover: timeRemaining > 0
      };
    });
  } catch (error) {
    console.error('Error fetching soft deleted patients:', error);
    throw error;
  }
};

// Restore a soft deleted patient
export const restorePatient = async (id) => {
  try {
    const { error } = await supabase
      .from('patients')
      .update({
        is_deleted: false,
        deleted_at: null,
        deletion_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Patient restored successfully' 
    };
  } catch (error) {
    console.error('Error restoring patient:', error);
    throw error;
  }
};

// Permanently delete a patient
export const permanentlyDeletePatient = async (id) => {
  try {
    // Delete status history first (foreign key constraint)
    const { error: historyError } = await supabase
      .from('status_history')
      .delete()
      .eq('patient_id', id);

    if (historyError) throw historyError;

    // Delete status photos
    const { error: photosError } = await supabase
      .from('status_photos')
      .delete()
      .eq('patient_id', id);

    if (photosError) throw photosError;

    // Delete patient updates
    const { error: updatesError } = await supabase
      .from('patient_updates')
      .delete()
      .eq('patient_id', id);

    if (updatesError) throw updatesError;

    // Finally delete the patient
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return { 
      success: true, 
      message: 'Patient permanently deleted' 
    };
  } catch (error) {
    console.error('Error permanently deleting patient:', error);
    throw error;
  }
};

// Delete last status update (revert to previous status)
export const deleteLastStatusUpdate = async (patientId) => {
  try {
    // Get status history sorted by most recent first
    const { data: statusHistory, error: historyError } = await supabase
      .from('status_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('changed_at', { ascending: false })
      .limit(2);

    if (historyError) throw historyError;

    if (!statusHistory || statusHistory.length < 2) {
      throw new Error('Cannot revert: Patient must have at least 2 status entries. Use "Clear Status History" to reset to Admitted.');
    }

    // Get the most recent entry (to delete) and the previous entry (to revert to)
    const mostRecentEntry = statusHistory[0];
    const previousEntry = statusHistory[1];

    // Delete the most recent status history entry
    const { error: deleteError } = await supabase
      .from('status_history')
      .delete()
      .eq('id', mostRecentEntry.id);

    if (deleteError) throw deleteError;

    // Update patient status to the previous status
    const { error: updateError } = await supabase
      .from('patients')
      .update({ 
        status: previousEntry.new_status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', patientId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      message: `Reverted from "${mostRecentEntry.new_status}" back to "${previousEntry.new_status}"`,
      revertedFrom: mostRecentEntry.new_status,
      revertedTo: previousEntry.new_status
    };
  } catch (error) {
    console.error('Error deleting last status update:', error);
    throw error;
  }
};

// Send update to owner with real SMS/Email integration
export const sendPatientUpdate = async (updateData) => {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-patient-update', {
      body: {
        patientId: updateData.patientId,
        messageType: updateData.messageType,
        message: updateData.message,
        sendVia: updateData.sendVia,
        includePhoto: updateData.includePhoto,
        recipientName: updateData.recipientName,
        recipientContact: updateData.recipientContact,
        recipientEmail: updateData.recipientEmail,
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Failed to send update: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to send update');
    }

    return {
      success: true,
      message: data.message,
      results: data.results
    };
  } catch (error) {
    console.error('Error sending update:', error);
    throw error;
  }
};

// Clear patient status history and reset to Admitted
export const clearPatientStatusHistory = async (patientId) => {
  try {
    // Delete all status history for this patient
    const { error: deleteError } = await supabase
      .from('status_history')
      .delete()
      .eq('patient_id', patientId);

    if (deleteError) throw deleteError;

    // Reset patient status to "Admitted"
    const { error: updateError } = await supabase
      .from('patients')
      .update({ 
        status: 'Admitted',
        updated_at: new Date().toISOString() 
      })
      .eq('id', patientId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create new initial status history entry
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        patient_id: patientId,
        old_status: null,
        new_status: 'Admitted',
        changed_by: 'Staff User (Reset)'
      });

    if (historyError) {
      console.error('Error creating new status history:', historyError);
    }

    return {
      success: true,
      message: 'Status history cleared and patient reset to Admitted'
    };
  } catch (error) {
    console.error('Error clearing status history:', error);
    throw error;
  }
};