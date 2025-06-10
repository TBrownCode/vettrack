// src/services/pdfUploadService.js
import { supabase } from '../lib/supabase';

/**
 * Upload a PDF file to Supabase Storage and return the public URL
 * @param {File} file - The PDF file to upload
 * @param {string} category - Category for organizing PDFs (optional)
 * @returns {Promise<string>} The public URL of the uploaded PDF
 */
export const uploadPDF = async (file, category = 'general') => {
  try {
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Please select a PDF file');
    }

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('PDF file must be smaller than 10MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const fileName = `${sanitizedCategory}/${timestamp}-${randomString}-${sanitizedName}`;

    console.log('Uploading PDF with filename:', fileName);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('educational-pdfs')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('Upload successful:', data);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('educational-pdfs')
      .getPublicUrl(fileName);

    console.log('Generated public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

/**
 * Delete a PDF from Supabase Storage
 * @param {string} pdfUrl - The public URL of the PDF to delete
 * @returns {Promise<boolean>} Success status
 */
export const deletePDF = async (pdfUrl) => {
  try {
    // Extract the file path from the public URL
    const urlParts = pdfUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'educational-pdfs');
    
    if (bucketIndex === -1) {
      console.warn('Could not extract file path from URL:', pdfUrl);
      return false;
    }

    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    console.log('Deleting PDF with path:', filePath);

    const { error } = await supabase.storage
      .from('educational-pdfs')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }

    console.log('PDF deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return false;
  }
};

/**
 * Validate PDF file before upload
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validatePDFFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Please select a PDF file' };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'PDF file must be smaller than 10MB' };
  }

  const minSize = 1024; // 1KB minimum
  if (file.size < minSize) {
    return { isValid: false, error: 'PDF file appears to be corrupted or empty' };
  }

  return { isValid: true, error: null };
};

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};