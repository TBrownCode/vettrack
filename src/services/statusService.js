// src/services/statusService.js - Complete file with color override fix
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
          // Apply color corrections to custom statuses
          return customStatuses.map(status => {
            let correctedColor = status.color;
            
            // FORCE CORRECT COLORS for specific statuses (override database)
            if (status.name === 'In Surgery') {
              correctedColor = '#ea4335'; // Force red for surgery
              console.log('Corrected "In Surgery" color from', status.color, 'to', correctedColor);
            }
            if (status.name === 'Being Examined') {
              correctedColor = '#ea4335'; // Force red for examination
              console.log('Corrected "Being Examined" color from', status.color, 'to', correctedColor);
            }
            
            return {
              value: status.name,
              label: status.name,
              color: correctedColor,
              description: status.description
            };
          });
        }
      }
    } catch (dbError) {
      console.log('Custom statuses not available, using defaults:', dbError.message);
    }

    // Fallback to default statuses with corrected colors
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

// Helper function to get default colors for built-in statuses - COMPLETE & CORRECTED
const getDefaultStatusColor = (status) => {
  const colorMap = {
    'Admitted': '#4285f4',                    // Blue - calm, trustworthy, initial
    'Being Examined': '#ea4335',              // Red - attention needed, active examination
    'Awaiting Tests': '#fbbc05',              // Yellow - waiting, caution
    'Test Results Pending': '#fbbc05',        // Yellow - waiting, caution
    'Being Prepped for Surgery': '#fa903e',   // Orange - preparing for critical procedure
    'In Surgery': '#ea4335',                  // Red - CRITICAL, urgent, active procedure
    'In Recovery': '#34a853',                 // Green - healing, positive progress
    'Awake & Responsive': '#34a853',          // Green - positive recovery milestone
    'Ready for Discharge': '#a142f4',         // Purple - completion, ready to go
    'Discharged': '#a142f4'                   // Purple - completed care, premium service
  };
  return colorMap[status] || '#4285f4';
};