// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Clinic configurations using environment variables
const CLINIC_CONFIGS = {
  'happypaws': {
    url: process.env.REACT_APP_SUPABASE_URL_HAPPYPAWS || process.env.REACT_APP_SUPABASE_URL,
    key: process.env.REACT_APP_SUPABASE_ANON_KEY_HAPPYPAWS || process.env.REACT_APP_SUPABASE_ANON_KEY
  },
  'cityanimalhospital': {
    url: process.env.REACT_APP_SUPABASE_URL_CITYANIMALHOSPITAL,
    key: process.env.REACT_APP_SUPABASE_ANON_KEY_CITYANIMALHOSPITAL
  }
};

// Get clinic from URL parameter, localStorage, or default
const getClinicId = () => {
  // 1. Check URL parameter (for testing and clinic switching)
  const urlParams = new URLSearchParams(window.location.search);
  const clinicParam = urlParams.get('clinic');
  if (clinicParam && CLINIC_CONFIGS[clinicParam]) {
    localStorage.setItem('selectedClinic', clinicParam);
    return clinicParam;
  }
  
  // 2. Check saved clinic selection
  const savedClinic = localStorage.getItem('selectedClinic');
  if (savedClinic && CLINIC_CONFIGS[savedClinic]) {
    return savedClinic;
  }
  
  // 3. Default to happypaws
  return 'happypaws';
};

// Create Supabase client based on current clinic
const createClinicClient = () => {
  const clinicId = getClinicId();
  const config = CLINIC_CONFIGS[clinicId];
  
  if (!config || !config.url || !config.key) {
    console.error(`Invalid configuration for clinic: ${clinicId}`);
    // Fallback to original environment variables
    return createClient(
      process.env.REACT_APP_SUPABASE_URL, 
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
  }
  
  console.log(`Connected to clinic: ${clinicId}`);
  return createClient(config.url, config.key);
};

// Export the client and utility functions
export const supabase = createClinicClient();
export { getClinicId };

// Optional: Export function to get clinic display name
export const getClinicDisplayName = () => {
  const clinicId = getClinicId();
  const displayNames = {
    'happypaws': 'Happy Paws Veterinary',
    'cityanimalhospital': 'City Animal Hospital'
  };
  return displayNames[clinicId] || 'Veterinary Clinic';
};

// Optional: Function to switch clinics programmatically
export const switchClinic = (clinicId) => {
  if (CLINIC_CONFIGS[clinicId]) {
    localStorage.setItem('selectedClinic', clinicId);
    window.location.reload(); // Refresh to reconnect to new database
  } else {
    console.error(`Unknown clinic: ${clinicId}`);
  }
};