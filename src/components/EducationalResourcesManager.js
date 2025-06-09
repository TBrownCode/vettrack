// src/components/EducationalResourcesManager.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTimes, 
  faTrash, 
  faEdit,
  faVideo,
  faFilePdf,
  faGlobe,
  faEye,
  faEyeSlash,
  faLink,
  faSave,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useConfirmation } from '../hooks/useConfirmation';
import { ToastContainer } from './Toast';
import ConfirmationDialog from './ConfirmationDialog';

const EducationalResourcesManager = ({ onClose }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    resource_type: 'youtube',
    category: '',
    thumbnail_url: ''
  });

  // Toast and confirmation
  const { toasts, showSuccess, showError, hideToast } = useToast();
  const { confirmation, handleConfirm, handleCancel, confirmDelete } = useConfirmation();

  // Color options
  const colorOptions = [
    '#4285f4', // Blue
    '#34a853', // Green
    '#ea4335', // Red
    '#fbbc05', // Yellow
    '#fa903e', // Orange
    '#a142f4'  // Purple
  ];

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError('');

      // Get clinic ID
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .limit(1)
        .single();

      if (clinic) {
        const { data, error } = await supabase
          .from('educational_resources')
          .select('*')
          .eq('clinic_id', clinic.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setResources(data || []);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      setError('Failed to load resources: ' + error.message);
      showError('Failed to load educational resources');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      resource_type: 'youtube',
      category: '',
      thumbnail_url: ''
    });
    setError('');
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.url.trim()) {
      setError('Title and URL are required');
      showError('Title and URL are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get clinic ID
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .limit(1)
        .single();

      if (!clinic) {
        throw new Error('No clinic found');
      }

      // Auto-generate thumbnail for YouTube videos
      let thumbnailUrl = formData.thumbnail_url;
      if (formData.resource_type === 'youtube' && (formData.url.includes('youtube.com') || formData.url.includes('youtu.be'))) {
        const videoId = extractYouTubeVideoId(formData.url);
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      const resourceData = {
        clinic_id: clinic.id,
        title: formData.title,
        description: formData.description,
        url: formData.url,
        resource_type: formData.resource_type,
        category: formData.category || 'General',
        thumbnail_url: thumbnailUrl,
        is_active: true,
        order_index: resources.length + 1,
        created_by: 'Current User' // You might want to get actual user info
      };

      const { data, error } = await supabase
        .from('educational_resources')
        .insert(resourceData)
        .select()
        .single();

      if (error) throw error;

      setResources(prev => [data, ...prev]);
      setShowAddForm(false);
      resetForm();
      showSuccess(`Resource "${formData.title}" added successfully!`);
    } catch (error) {
      console.error('Error adding resource:', error);
      setError('Failed to add resource: ' + error.message);
      showError('Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      url: resource.url,
      resource_type: resource.resource_type,
      category: resource.category || '',
      thumbnail_url: resource.thumbnail_url || ''
    });
    setShowAddForm(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.url.trim()) {
      setError('Title and URL are required');
      showError('Title and URL are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Auto-generate thumbnail for YouTube videos
      let thumbnailUrl = formData.thumbnail_url;
      if (formData.resource_type === 'youtube' && (formData.url.includes('youtube.com') || formData.url.includes('youtu.be'))) {
        const videoId = extractYouTubeVideoId(formData.url);
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      const { data, error } = await supabase
        .from('educational_resources')
        .update({
          title: formData.title,
          description: formData.description,
          url: formData.url,
          resource_type: formData.resource_type,
          category: formData.category || 'General',
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingResource.id)
        .select()
        .single();

      if (error) throw error;

      setResources(prev => prev.map(resource => 
        resource.id === editingResource.id ? data : resource
      ));

      const oldTitle = editingResource.title;
      setEditingResource(null);
      resetForm();
      showSuccess(`Resource "${oldTitle}" updated successfully!`);
    } catch (error) {
      console.error('Error updating resource:', error);
      setError('Failed to update resource: ' + error.message);
      showError('Failed to update resource');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingResource(null);
    setFormData({ title: '', description: '', url: '', resource_type: 'youtube', category: '', thumbnail_url: '' });
    setError('');
  };

  const handleToggleActive = async (resourceId, currentActiveState, resourceTitle) => {
    try {
      const newActiveState = !currentActiveState;
      
      const { error } = await supabase
        .from('educational_resources')
        .update({ 
          is_active: newActiveState,
          updated_at: new Date().toISOString() 
        })
        .eq('id', resourceId);

      if (error) throw error;

      setResources(prev => prev.map(resource => 
        resource.id === resourceId 
          ? { ...resource, is_active: newActiveState }
          : resource
      ));

      const action = newActiveState ? 'activated' : 'deactivated';
      showSuccess(`Resource "${resourceTitle}" ${action} successfully!`);
    } catch (error) {
      console.error('Error toggling resource active state:', error);
      showError('Failed to update resource');
    }
  };

  const handleDeleteResource = (resourceId, resourceTitle) => {
    confirmDelete(
      'Delete Resource',
      `Delete "${resourceTitle}"? This will also remove it from all status links.`,
      async () => {
        try {
          const { error } = await supabase
            .from('educational_resources')
            .delete()
            .eq('id', resourceId);

          if (error) throw error;
          
          setResources(prev => prev.filter(resource => resource.id !== resourceId));
          showSuccess(`Resource "${resourceTitle}" deleted successfully!`);
        } catch (error) {
          console.error('Error deleting resource:', error);
          setError('Failed to delete resource: ' + error.message);
          showError('Failed to delete resource');
        }
      }
    );
  };

  const extractYouTubeVideoId = (url) => {
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

  const getResourceIcon = (type) => {
    switch (type) {
      case 'youtube': return faVideo;
      case 'pdf': return faFilePdf;
      case 'website': return faGlobe;
      default: return faLink;
    }
  };

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'youtube': return '#ff0000';
      case 'pdf': return '#dc3545';
      case 'website': return '#4285f4';
      default: return '#6c757d';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          resource.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || resource.resource_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            backgroundColor: '#4285f4',
            color: 'white',
            borderRadius: '12px 12px 0 0'
          }}>
            <h3 style={{ 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <FontAwesomeIcon icon={faVideo} />
              Educational Resources Bank
            </h3>
            <button 
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                fontSize: '1.25rem', 
                cursor: 'pointer' 
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {error && (
              <div style={{
                backgroundColor: '#fee',
                color: '#d63031',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                border: '1px solid #fab1a0'
              }}>
                {error}
              </div>
            )}

            {/* Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '8px 12px 8px 36px',
                      border: '1px solid #e1e5e9',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '200px'
                    }}
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e1e5e9',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="youtube">YouTube</option>
                  <option value="pdf">PDF</option>
                  <option value="website">Website</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingResource(null);
                  resetForm();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Resource
              </button>
            </div>

            {/* Add/Edit Form */}
            {(showAddForm || editingResource) && (
              <div style={{
                marginBottom: '24px',
                padding: '20px',
                backgroundColor: editingResource ? '#fff3cd' : '#f8f9fa',
                borderRadius: '8px',
                border: editingResource ? '1px solid #ffeaa7' : '1px solid #e9ecef'
              }}>
                <h4 style={{ 
                  margin: '0 0 16px 0', 
                  color: editingResource ? '#856404' : '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={editingResource ? faEdit : faPlus} />
                  {editingResource ? `Editing: ${editingResource.title}` : 'Add New Resource'}
                </h4>
                
                <form onSubmit={editingResource ? handleSaveEdit : handleAddResource}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Title*
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Post-Surgery Care for Dogs"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Type*
                      </label>
                      <select
                        value={formData.resource_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, resource_type: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="youtube">YouTube Video</option>
                        <option value="pdf">PDF Document</option>
                        <option value="website">Website/Article</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      URL*
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=... or https://example.com/guide.pdf"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Post-Surgery, Dental Care"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Thumbnail URL (optional)
                      </label>
                      <input
                        type="url"
                        value={formData.thumbnail_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                        placeholder="Auto-generated for YouTube videos"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of what this resource covers"
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: editingResource ? '#28a745' : '#4285f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      <FontAwesomeIcon icon={editingResource ? faSave : faPlus} />
                      {loading ? 'Saving...' : (editingResource ? 'Save Changes' : 'Add Resource')}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingResource(null);
                        resetForm();
                      }}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Resources List */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: 0 }}>
                  Resources ({filteredResources.length})
                </h4>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34a853' }}></div>
                    Active
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ccc' }}></div>
                    Inactive
                  </span>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  Loading resources...
                </div>
              ) : filteredResources.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  {searchTerm || filterType !== 'all' ? (
                    <p>No resources match your search criteria.</p>
                  ) : (
                    <>
                      <p>No educational resources yet.</p>
                      <p style={{ fontSize: '14px' }}>Add YouTube videos, PDFs, and websites to help educate pet owners!</p>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredResources.map((resource) => (
                    <div 
                      key={resource.id}
                      style={{
                        display: 'flex',
                        padding: '16px',
                        backgroundColor: 'white',
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        opacity: resource.is_active ? 1 : 0.6
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        width: '80px',
                        height: '60px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        marginRight: '16px',
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {resource.thumbnail_url ? (
                          <img 
                            src={resource.thumbnail_url} 
                            alt={resource.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <FontAwesomeIcon 
                            icon={getResourceIcon(resource.resource_type)}
                            style={{
                              fontSize: '24px',
                              color: getResourceTypeColor(resource.resource_type)
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: '8px'
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h5 style={{
                              margin: '0 0 4px 0',
                              fontSize: '16px',
                              fontWeight: '600',
                              wordBreak: 'break-word',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <FontAwesomeIcon 
                                icon={getResourceIcon(resource.resource_type)}
                                style={{
                                  color: getResourceTypeColor(resource.resource_type),
                                  fontSize: '14px'
                                }}
                              />
                              {resource.title}
                            </h5>
                            
                            {resource.description && (
                              <p style={{
                                margin: '0 0 8px 0',
                                fontSize: '14px',
                                color: '#666',
                                lineHeight: '1.4'
                              }}>
                                {resource.description}
                              </p>
                            )}
                            
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '12px',
                              color: '#999'
                            }}>
                              {resource.category && (
                                <span style={{
                                  padding: '2px 8px',
                                  backgroundColor: '#e9ecef',
                                  borderRadius: '12px',
                                  color: '#666'
                                }}>
                                  {resource.category}
                                </span>
                              )}
                              <span>
                                {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginLeft: '16px'
                          }}>
                            {/* Active indicator */}
                            <div 
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: resource.is_active ? '#34a853' : '#ccc',
                                flexShrink: 0
                              }}
                              title={resource.is_active ? 'Active' : 'Inactive'}
                            />

                            {/* Action buttons */}
                            <button
                              onClick={() => window.open(resource.url, '_blank')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#4285f4',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              title="Open resource"
                            >
                              <FontAwesomeIcon icon={faLink} />
                            </button>
                            
                            <button
                              onClick={() => handleToggleActive(resource.id, resource.is_active, resource.title)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: resource.is_active ? '#d32f2f' : '#28a745',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              title={resource.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <FontAwesomeIcon icon={resource.is_active ? faEyeSlash : faEye} />
                            </button>
                            
                            <button
                              onClick={() => handleEditResource(resource)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ffc107',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              title="Edit resource"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteResource(resource.id, resource.title)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#d32f2f',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                              title="Delete resource"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '24px',
              padding: '12px',
              backgroundColor: '#e8f0fe',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1a73e8'
            }}>
              <strong>Next Step:</strong> After adding resources here, you can link them to specific statuses 
              in the Status Management section. Resources linked to statuses will appear on the owner's 
              status tracking timeline.
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

export default EducationalResourcesManager;