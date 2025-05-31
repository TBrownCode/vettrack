// src/services/photoService.js
import { supabase } from '../lib/supabase';

export const uploadPhoto = async (file, patientId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('patient-photos')
      .upload(filePath, file);

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('patient-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

export const uploadPhotoFromDataURL = async (dataURL, patientId) => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();
    
    // Create a file object
    const file = new File([blob], `${patientId}-photo.jpg`, { type: 'image/jpeg' });
    
    return await uploadPhoto(file, patientId);
  } catch (error) {
    console.error('Error converting and uploading photo:', error);
    throw error;
  }
};