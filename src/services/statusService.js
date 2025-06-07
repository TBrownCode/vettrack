// src/services/statusService.js - Complete file
import { supabase } from '../lib/supabase';

// Get all available statuses (default + custom) for dropdowns
export const getAllStatusOptions = async () => {
  try {
    // Default statuses (keep these as fallback)
    const defaultStatuses = [
      'Admitted',
      'Being Examined',
      'Awaiting Tests',
      'Test Results Pending',
      'Being Prepped for Surgery',
      'In Surgery',
      'In Recovery',
      'Awake & Responsive',
      'Ready for Discharge',
      'Discharged'
    ];

    // Try to get custom statuses from database
    try {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .limit(1)
        .single();

      if (clinic) {
        const { data: customStatuses, error } = await supabase
          .from('clinic_statuses')
          .select('name, color, description')
          .eq('clinic_id', clinic.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!error && customStatuses && customStatuses.length > 0) {
          // If we have custom statuses, use them instead of defaults
          return customStatuses.map(status => ({
            value: status.name,
            label: status.name,
            color: status.color,
            description: status.description
          }));
        }
      }
    } catch (dbError) {
      console.log('Custom statuses not available, using defaults:', dbError.message);
    }

    // Fallback to default statuses if custom ones fail
    return defaultStatuses.map(status => ({
      value: status,
      label: status,
      color: getDefaultStatusColor(status),
      description: null
    }));

  } catch (error) {
    console.error('Error getting status options:', error);
    // Return basic defaults if everything fails
    return [
      { value: 'Admitted', label: 'Admitted', color: '#4285f4', description: null },
      { value: 'In Recovery', label: 'In Recovery', color: '#34a853', description: null },
      { value: 'Ready for Discharge', label: 'Ready for Discharge', color: '#a142f4', description: null }
    ];
  }
};

// Helper function to get default colors for built-in statuses
const getDefaultStatusColor = (status) => {
  const colorMap = {
    'Admitted': '#4285f4',
    'Being Examined': '#ea4335',
    'Awaiting Tests': '#fbbc05',
    'Test Results Pending': '#fbbc05',
    'Being Prepped for Surgery': '#fa903e',
    'In Surgery': '#fa903e',
    'In Recovery': '#34a853',
    'Awake & Responsive': '#34a853',
    'Ready for Discharge': '#a142f4',
    'Discharged': '#a142f4'
  };
  return colorMap[status] || '#4285f4';
};