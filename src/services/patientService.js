// src/services/patientService.js - Updated with real SMS/Email integration
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
      email: patient.owner_email, // Add email field
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
      email: data.owner_email, // Add email field
      status: data.status,
      photoUrl: data.photo_url,
      lastUpdate: new Date(data.updated_at).toLocaleTimeString()
    };
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

// Update patient status
export const updatePatientStatus = async (id, newStatus) => {
  try {
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

    // Also log the status change
    await supabase
      .from('status_history')
      .insert({
        patient_id: id,
        new_status: newStatus,
        changed_by: 'Staff User', // We'll improve this with auth later
      });

    return data;
  } catch (error) {
    console.error('Error updating patient status:', error);
    throw error;
  }
};

// Add new patient - UPDATED to include email
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
      owner_email: patientData.email || null, // Add email field
      status: patientData.status || 'Admitted',
      photo_url: photoUrl,
    };

    const { data, error } = await supabase
      .from('patients')
      .insert(newPatient)
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
      email: data.owner_email, // Add email field
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
      email: data.owner_email, // Add email field
      status: data.status,
      photoUrl: data.photo_url,
      lastUpdate: new Date(data.updated_at).toLocaleTimeString()
    };
  } catch (error) {
    console.error('Error updating photo:', error);
    throw error;
  }
};

// UPDATED: Send update to owner with real SMS/Email integration
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
        recipientEmail: updateData.recipientEmail, // Add email support
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