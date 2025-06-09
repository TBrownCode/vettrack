// src/services/educationalService.js
import { supabase } from '../lib/supabase';

// Get all active educational resources
export const getEducationalResources = async () => {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      throw new Error('No clinic found');
    }

    const { data, error } = await supabase
      .from('educational_resources')
      .select('*')
      .eq('clinic_id', clinic.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching educational resources:', error);
    throw error;
  }
};

// Get educational resources linked to a specific status
export const getResourcesForStatus = async (statusName) => {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      throw new Error('No clinic found');
    }

    const { data, error } = await supabase
      .from('status_educational_links')
      .select(`
        *,
        educational_resource:educational_resources(*)
      `)
      .eq('clinic_id', clinic.id)
      .eq('status_name', statusName)
      .order('order_index', { ascending: true });

    if (error) throw error;

    // Return only the educational resources, filtered for active ones
    return (data || [])
      .filter(link => link.educational_resource?.is_active)
      .map(link => ({
        ...link.educational_resource,
        is_featured: link.is_featured,
        link_order: link.order_index
      }));
  } catch (error) {
    console.error('Error fetching resources for status:', error);
    throw error;
  }
};

// Link an educational resource to a status
export const linkResourceToStatus = async (statusName, resourceId, isFeatured = false) => {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      throw new Error('No clinic found');
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('status_educational_links')
      .select('id')
      .eq('clinic_id', clinic.id)
      .eq('status_name', statusName)
      .eq('educational_resource_id', resourceId)
      .single();

    if (existingLink) {
      throw new Error('Resource is already linked to this status');
    }

    // Get the next order index
    const { data: existingLinks } = await supabase
      .from('status_educational_links')
      .select('order_index')
      .eq('clinic_id', clinic.id)
      .eq('status_name', statusName)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingLinks && existingLinks.length > 0 
      ? existingLinks[0].order_index + 1 
      : 1;

    const { data, error } = await supabase
      .from('status_educational_links')
      .insert({
        clinic_id: clinic.id,
        status_name: statusName,
        educational_resource_id: resourceId,
        is_featured: isFeatured,
        order_index: nextOrderIndex
      })
      .select(`
        *,
        educational_resource:educational_resources(*)
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error linking resource to status:', error);
    throw error;
  }
};

// Unlink an educational resource from a status
export const unlinkResourceFromStatus = async (statusName, resourceId) => {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      throw new Error('No clinic found');
    }

    const { error } = await supabase
      .from('status_educational_links')
      .delete()
      .eq('clinic_id', clinic.id)
      .eq('status_name', statusName)
      .eq('educational_resource_id', resourceId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error unlinking resource from status:', error);
    throw error;
  }
};

// Update the featured status of a resource link
export const updateResourceLinkFeatured = async (statusName, resourceId, isFeatured) => {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      throw new Error('No clinic found');
    }

    const { data, error } = await supabase
      .from('status_educational_links')
      .update({ is_featured: isFeatured })
      .eq('clinic_id', clinic.id)
      .eq('status_name', statusName)
      .eq('educational_resource_id', resourceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating resource link featured status:', error);
    throw error;
  }
};

// Reorder resource links for a status
export const reorderStatusResourceLinks = async (statusName, orderedResourceIds) => {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      throw new Error('No clinic found');
    }

    // Update each link with its new order index
    const updatePromises = orderedResourceIds.map((resourceId, index) =>
      supabase
        .from('status_educational_links')
        .update({ order_index: index + 1 })
        .eq('clinic_id', clinic.id)
        .eq('status_name', statusName)
        .eq('educational_resource_id', resourceId)
    );

    const results = await Promise.all(updatePromises);
    
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error('Failed to update some resource link orders');
    }

    return { success: true };
  } catch (error) {
    console.error('Error reordering resource links:', error);
    throw error;
  }
};

// Get all status-resource links for management
export const getAllStatusResourceLinks = async () => {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .single();

    if (!clinic) {
      throw new Error('No clinic found');
    }

    const { data, error } = await supabase
      .from('status_educational_links')
      .select(`
        *,
        educational_resource:educational_resources(*)
      `)
      .eq('clinic_id', clinic.id)
      .order('status_name', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) throw error;

    // Group by status
    const groupedLinks = {};
    (data || []).forEach(link => {
      if (!groupedLinks[link.status_name]) {
        groupedLinks[link.status_name] = [];
      }
      groupedLinks[link.status_name].push({
        ...link.educational_resource,
        linkId: link.id,
        is_featured: link.is_featured,
        link_order: link.order_index
      });
    });

    return groupedLinks;
  } catch (error) {
    console.error('Error fetching all status resource links:', error);
    throw error;
  }
};

// Utility function to extract YouTube video ID
export const extractYouTubeVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Generate YouTube thumbnail URL
export const getYouTubeThumbnail = (videoId, quality = 'maxresdefault') => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

// Validate resource URL
export const validateResourceUrl = (url, type) => {
  try {
    new URL(url); // Basic URL validation
    
    switch (type) {
      case 'youtube':
        return url.includes('youtube.com') || url.includes('youtu.be');
      case 'pdf':
        return url.toLowerCase().includes('.pdf') || url.includes('pdf');
      case 'website':
        return true; // Any valid URL is acceptable for websites
      default:
        return true;
    }
  } catch {
    return false;
  }
};

// Get resource icon based on type
export const getResourceIcon = (type) => {
  switch (type) {
    case 'youtube': return 'faVideo';
    case 'pdf': return 'faFilePdf';
    case 'website': return 'faGlobe';
    default: return 'faLink';
  }
};

// Get resource type color
export const getResourceTypeColor = (type) => {
  switch (type) {
    case 'youtube': return '#ff0000';
    case 'pdf': return '#dc3545';
    case 'website': return '#4285f4';
    default: return '#6c757d';
  }
};