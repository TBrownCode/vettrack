// src/services/patientService.js - Complete file with all functions including status photos
import { supabase } from '../lib/supabase';
import { uploadPhotoFromDataURL } from './photoService';

// Get all patients
export const getPatients = async () => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        *,
        clinic:clinics(name)
      `)
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

// Get patient by ID
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

// Get patient status history with photos
export const getPatientStatusHistory = async (patientId) => {
  try {
    const { data, error } = await supabase
      .from('status_history')
      .select(`
        *,
        status_photos (
          id,
          photo_url,
          created_at
        )
      `)
      .eq('patient_id', patientId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    // Transform to match timeline format
    return data.map(entry => ({
      id: entry.id,
      title: entry.new_status,
      description: getStatusDescription(entry.new_status),
      timestamp: new Date(entry.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(entry.changed_at).toLocaleDateString(),
      status: 'completed',
      hasPhoto: entry.status_photos && entry.status_photos.length > 0,
      photos: entry.status_photos || [], // Include photos in the timeline
      hasEducationalContent: true,
      changedBy: entry.changed_by
    }));
  } catch (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }
};

// Helper function to get status descriptions
const getStatusDescription = (status) => {
  const descriptions = {
    'Admitted': 'Your pet has arrived and is being settled in',
    'Being Examined': 'Initial examination and assessment',
    'Awaiting Tests': 'Waiting for diagnostic tests or results',
    'Test Results Pending': 'Tests completed, waiting for results',
    'Being Prepped for Surgery': 'Preparing for the surgical procedure',
    'In Surgery': 'Surgical procedure in progress',
    'In Recovery': 'Surgery complete, recovering comfortably',
    'Awake & Responsive': 'Alert and responding well to treatment',
    'Ready for Discharge': 'All set to go home!',
    'Discharged': 'Successfully discharged and on the way home'
  };
  return descriptions[status] || 'Status updated';
};

// Update patient status with history tracking
export const updatePatientStatus = async (id, newStatus) => {
  try {
    // First, get the current status
    const { data: currentPatient, error: fetchError } = await supabase
      .from('patients')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const oldStatus = currentPatient.status;

    // Update the patient status
    const { data, error } = await supabase
      .from('patients')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Save the status change to history
    const { error: historyError } = await supabase
      .from('status_history')
      .insert({
        patient_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: 'Staff User'
      });

    if (historyError) {
      console.error('Error saving status history:', historyError);
    }

    return data;
  } catch (error) {
    console.error('Error updating patient status:', error);
    throw error;
  }
};

// NEW: Add photo to a specific status
export const addStatusPhoto = async (patientId, status, photoData) => {
  try {
    // Upload photo to storage
    const photoUrl = await uploadPhotoFromDataURL(photoData, `${patientId}-${status}-${Date.now()}`);

    // Find the most recent status history entry for this status
    const { data: statusEntry, error: fetchError } = await supabase
      .from('status_history')
      .select('id')
      .eq('patient_id', patientId)
      .eq('new_status', status)
      .order('changed_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error finding status entry:', fetchError);
      throw new Error('Could not find status entry to attach photo to');
    }

    // Add photo to status_photos table
    const { data, error } = await supabase
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

// NEW: Delete all photos from a specific status
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

    // Delete photos from storage (optional - you might want to keep them for backup)
    // Note: You would need to extract the file path from the URL and delete from storage
    // For now, we'll just delete the database records

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

// Add new patient with initial status history
export const addPatient = async (patientData) => {
  try {
    // Get clinic ID (for now, we'll use the test clinic)
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('name', 'Happy Paws Veterinary Clinic')
      .single();

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

// Delete patient
export const deletePatient = async (id) => {
  try {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true, message: 'Patient deleted successfully' };
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
    console.error('Error updating photo:', error);
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

// Delete the most recent status update and revert to previous status
export const deleteLastStatusUpdate = async (patientId) => {
  try {
    // Get all status history for this patient, ordered by most recent first
    const { data: statusHistory, error: fetchError } = await supabase
      .from('status_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('changed_at', { ascending: false });

    if (fetchError) throw fetchError;

    // Check if there's more than one status entry
    if (!statusHistory || statusHistory.length <= 1) {
      throw new Error('Cannot delete the only status entry. Use "Clear Status History" to reset to Admitted.');
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
    const { data, error: updateError } = await supabase
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
    const { data, error: updateError } = await supabase
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