// src/components/EducationalResourcesManager.js - Enhanced with PDF Upload
import React, { useState, useEffect, useRef } from 'react';
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
  faSearch,
  faUpload,
  faSpinner,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '../lib/supabase';
import { uploadPDF, validatePDFFile, formatFileSize } from '../services/pdfUploadService';
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

  // PDF Upload states
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    resource_type: 'youtube',
    category: '',
    thumbnail_url: '',
    upload_method: 'url' // 'url' or 'upload'
  });

  // Toast and confirmation
  const { toasts, showSuccess, showError, hideToast } = useToast();
  const { confirmation, handleConfirm, handleCancel, confirmDelete } = useConfirmation();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError('');

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
      thumbnail_url: '',
      upload_method: 'url'
    });
    setPdfFile(null);
    setPdfUploadProgress(0);
    setError('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      showError(validation.error);
      return;
    }

    setPdfFile(file);
    setError('');
    
    // Auto-fill title if empty
    if (!formData.title) {
      const nameWithoutExtension = file.name.replace('.pdf', '');
      setFormData(prev => ({ 
        ...prev, 
        title: nameWithoutExtension,
        resource_type: 'pdf'
      }));
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      showError('Title is required');
      return;
    }

    // Check if URL or file is provided based on method
    if (formData.upload_method === 'url' && !formData.url.trim()) {
      setError('URL is required');
      showError('URL is required');
      return;
    }

    if (formData.upload_method === 'upload' && !pdfFile) {
      setError('Please select a PDF file to upload');
      showError('Please select a PDF file to upload');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .limit(1)
        .single();

      if (!clinic) {
        throw new Error('No clinic found');
      }

      let finalUrl = formData.url;
      let thumbnailUrl = formData.thumbnail_url;

      // Handle PDF upload
      if (formData.upload_method === 'upload' && pdfFile) {
        setUploadingPDF(true);
        setPdfUploadProgress(0);
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setPdfUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
          finalUrl = await uploadPDF(pdfFile, formData.category);
          setPdfUploadProgress(100);
          clearInterval(progressInterval);
        } catch (uploadError) {
          clearInterval(progressInterval);
          throw uploadError;
        } finally {
          setUploadingPDF(false);
        }
      }

      // Auto-generate thumbnail for YouTube videos
      if (formData.resource_type === 'youtube' && finalUrl.includes('youtube')) {
        const videoId = extractYouTubeVideoId(finalUrl);
        if (videoId) {
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }

      const resourceData = {
        clinic_id: clinic.id,
        title: formData.title,
        description: formData.description,
        url: finalUrl,
        resource_type: formData.resource_type,
        category: formData.category || 'General',
        thumbnail_url: thumbnailUrl,
        is_active: true,
        order_index: resources.length + 1,
        created_by: 'Current User'
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
      setUploadingPDF(false);
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
      thumbnail_url: resource.thumbnail_url || '',
      upload_method: 'url' // Always default to URL for editing
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

      let thumbnailUrl = formData.thumbnail_url;
      if (formData.resource_type === 'youtube' && formData.url.includes('youtube')) {
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
    resetForm();
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

  const renderMobileResourceCard = (resource) => (
    <div 
      key={resource.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        backgroundColor: 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        opacity: resource.is_active ? 1 : 0.6
      }}
    >
      {/* Header with thumbnail and title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
        {/* Thumbnail */}
        <div style={{
          width: '50px',
          height: '38px',
          borderRadius: '6px',
          overflow: 'hidden',
          marginRight: '12px',
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
                fontSize: '18px',
                color: getResourceTypeColor(resource.resource_type)
              }}
            />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h5 style={{
            margin: '0 0 4px 0',
            fontSize: '14px',
            fontWeight: '600',
            wordBreak: 'break-word',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            lineHeight: 1.2
          }}>
            <FontAwesomeIcon 
              icon={getResourceIcon(resource.resource_type)}
              style={{
                color: getResourceTypeColor(resource.resource_type),
                fontSize: '12px'
              }}
            />
            {resource.title}
          </h5>
          
          {resource.description && (
            <p style={{
              margin: '0 0 6px 0',
              fontSize: '12px',
              color: '#666',
              lineHeight: '1.3'
            }}>
              {resource.description}
            </p>
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10px',
            color: '#999',
            flexWrap: 'wrap'
          }}>
            {resource.category && (
              <span style={{
                padding: '2px 6px',
                backgroundColor: '#e9ecef',
                borderRadius: '10px',
                color: '#666'
              }}>
                {resource.category}
              </span>
            )}
            <span>
              {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
            </span>
            {resource.url.includes('supabase') && (
              <span style={{ color: '#28a745' }}>Uploaded</span>
            )}
          </div>
        </div>

        {/* Active indicator */}
        <div 
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: resource.is_active ? '#34a853' : '#ccc',
            flexShrink: 0,
            marginLeft: '8px',
            marginTop: '4px'
          }}
          title={resource.is_active ? 'Active' : 'Inactive'}
        />
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <button
          onClick={() => window.open(resource.url, '_blank')}
          style={{
            background: 'none',
            border: '1px solid #4285f4',
            color: '#4285f4',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Open resource"
        >
          <FontAwesomeIcon icon={faLink} style={{ fontSize: '8px' }} />
          Open
        </button>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => handleToggleActive(resource.id, resource.is_active, resource.title)}
            style={{
              background: 'none',
              border: '1px solid',
              borderColor: resource.is_active ? '#d32f2f' : '#28a745',
              color: resource.is_active ? '#d32f2f' : '#28a745',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            title={resource.is_active ? 'Deactivate' : 'Activate'}
          >
            <FontAwesomeIcon icon={resource.is_active ? faEyeSlash : faEye} />
          </button>
          
          <button
            onClick={() => handleEditResource(resource)}
            style={{
              background: 'none',
              border: '1px solid #ffc107',
              color: '#ffc107',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            title="Edit resource"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          
          <button
            onClick={() => handleDeleteResource(resource.id, resource.title)}
            style={{
              background: 'none',
              border: '1px solid #d32f2f',
              color: '#d32f2f',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            title="Delete resource"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </div>
    </div>
  );

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
        padding: '10px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '100vw',
          maxHeight: '95vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#4285f4',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            flexShrink: 0
          }}>
            <h3 style={{ 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '1rem'
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

          <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
            {error && (
              <div style={{
                backgroundColor: '#fee',
                color: '#d63031',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #fab1a0',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Controls */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666',
                      fontSize: '12px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      border: '1px solid #e1e5e9',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding: '8px 10px',
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
                  padding: '10px 16px',
                  backgroundColor: '#4285f4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: editingResource ? '#fff3cd' : '#f8f9fa',
                borderRadius: '8px',
                border: editingResource ? '1px solid #ffeaa7' : '1px solid #e9ecef'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: editingResource ? '#856404' : '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}>
                  <FontAwesomeIcon icon={editingResource ? faEdit : faPlus} />
                  {editingResource ? `Editing: ${editingResource.title}` : 'Add New Resource'}
                </h4>
                
                <form onSubmit={editingResource ? handleSaveEdit : handleAddResource}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}>
                        Title*
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Post-Surgery Care for Dogs"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}>
                        Type*
                      </label>
                      <select
                        value={formData.resource_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, resource_type: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '8px',
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

                    {/* Upload method selection for PDF */}
                    {formData.resource_type === 'pdf' && !editingResource && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}>
                          PDF Source
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                            <input
                              type="radio"
                              name="upload_method"
                              value="url"
                              checked={formData.upload_method === 'url'}
                              onChange={(e) => setFormData(prev => ({ ...prev, upload_method: e.target.value }))}
                            />
                            Link to PDF
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                            <input
                              type="radio"
                              name="upload_method"
                              value="upload"
                              checked={formData.upload_method === 'upload'}
                              onChange={(e) => setFormData(prev => ({ ...prev, upload_method: e.target.value }))}
                            />
                            Upload PDF
                          </label>
                        </div>
                      </div>
                    )}

                    {/* URL Input or File Upload */}
                    {formData.upload_method === 'url' || editingResource ? (
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}>
                          URL*
                        </label>
                        <input
                          type="url"
                          value={formData.url}
                          onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="https://www.youtube.com/watch?v=... or https://example.com/guide.pdf"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}>
                          Upload PDF File*
                        </label>
                        <div style={{
                          border: '2px dashed #e1e5e9',
                          borderRadius: '6px',
                          padding: '16px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: pdfFile ? '#f0f8ff' : '#fafafa'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                          />
                          {pdfFile ? (
                            <div style={{ color: '#28a745' }}>
                              <FontAwesomeIcon icon={faCheckCircle} style={{ marginBottom: '8px', fontSize: '24px' }} />
                              <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>{pdfFile.name}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                {formatFileSize(pdfFile.size)} • Click to change
                              </p>
                            </div>
                          ) : (
                            <div style={{ color: '#666' }}>
                              <FontAwesomeIcon icon={faUpload} style={{ marginBottom: '8px', fontSize: '24px' }} />
                              <p style={{ margin: '0 0 4px 0' }}>Click to select PDF file</p>
                              <p style={{ margin: 0, fontSize: '12px' }}>Maximum 10MB</p>
                            </div>
                          )}
                        </div>
                        
                        {uploadingPDF && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{
                              width: '100%',
                              height: '4px',
                              backgroundColor: '#e1e5e9',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${pdfUploadProgress}%`,
                                height: '100%',
                                backgroundColor: '#4285f4',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                              Uploading... {pdfUploadProgress}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}>
                          Category
                        </label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="e.g., Surgery"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}>
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description..."
                        rows="2"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="submit" 
                        disabled={loading || uploadingPDF}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: editingResource ? '#28a745' : '#4285f4',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: (loading || uploadingPDF) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          opacity: (loading || uploadingPDF) ? 0.6 : 1,
                          fontSize: '14px'
                        }}
                      >
                        {uploadingPDF ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={editingResource ? faSave : faPlus} />
                            {loading ? 'Saving...' : (editingResource ? 'Save' : 'Add')}
                          </>
                        )}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingResource(null);
                          resetForm();
                        }}
                        disabled={uploadingPDF}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: uploadingPDF ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: uploadingPDF ? 0.6 : 1
                        }}
                      >
                        Cancel
                      </button>
                    </div>
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
                marginBottom: '12px'
              }}>
                <h4 style={{ margin: 0, fontSize: '14px' }}>
                  Resources ({filteredResources.length})
                </h4>
                <div style={{
                  fontSize: '10px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34a853' }}></div>
                    Active
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ccc' }}></div>
                    Inactive
                  </span>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' }}>
                  Loading resources...
                </div>
              ) : filteredResources.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '30px 20px',
                  color: '#666',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  {searchTerm || filterType !== 'all' ? (
                    <p style={{ margin: 0 }}>No resources match your criteria.</p>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 8px 0' }}>No educational resources yet.</p>
                      <p style={{ margin: 0, fontSize: '12px' }}>Add YouTube videos, PDFs, and websites!</p>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '12px'
                }}>
                  {filteredResources.map(renderMobileResourceCard)}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#e8f0fe',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#1a73e8'
            }}>
              <strong>Tip:</strong> Upload PDFs directly to store them securely, or link to existing online resources.
              After adding resources, link them to specific statuses in the Link Resources section.
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