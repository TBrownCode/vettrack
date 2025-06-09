// src/components/StatusResourceLinker.js - Mobile-Optimized Version
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLink, 
  faTimes, 
  faTrash, 
  faPlus,
  faVideo,
  faFilePdf,
  faGlobe,
  faStar,
  faGripVertical,
  faCheck,
  faSearch,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { getAllStatusOptions } from '../services/statusService';
import { 
  getEducationalResources, 
  getResourcesForStatus, 
  linkResourceToStatus, 
  unlinkResourceFromStatus,
  updateResourceLinkFeatured,
  reorderStatusResourceLinks 
} from '../services/educationalService';
import { useToast } from '../hooks/useToast';
import { useConfirmation } from '../hooks/useConfirmation';
import { ToastContainer } from './Toast';
import ConfirmationDialog from './ConfirmationDialog';

const StatusResourceLinker = ({ onClose }) => {
  const [statusOptions, setStatusOptions] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [linkedResources, setLinkedResources] = useState([]);
  const [availableResources, setAvailableResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Toast and confirmation
  const { toasts, showSuccess, showError, hideToast } = useToast();
  const { confirmation, handleConfirm, handleCancel, confirmDelete } = useConfirmation();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedStatus) {
      loadStatusResources();
    }
  }, [selectedStatus]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statusOpts, resources] = await Promise.all([
        getAllStatusOptions(),
        getEducationalResources()
      ]);

      setStatusOptions(statusOpts);
      setAllResources(resources);

      // Select first status by default
      if (statusOpts.length > 0) {
        setSelectedStatus(statusOpts[0].value);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data: ' + error.message);
      showError('Failed to load status and resource data');
    } finally {
      setLoading(false);
    }
  };

  const loadStatusResources = async () => {
    if (!selectedStatus) return;

    try {
      const linked = await getResourcesForStatus(selectedStatus);
      setLinkedResources(linked);

      // Filter out already linked resources from available list
      const linkedIds = linked.map(r => r.id);
      const available = allResources.filter(r => !linkedIds.includes(r.id));
      setAvailableResources(available);
    } catch (error) {
      console.error('Error loading status resources:', error);
      showError('Failed to load status resources');
    }
  };

  const handleLinkResource = async (resourceId) => {
    try {
      await linkResourceToStatus(selectedStatus, resourceId);
      await loadStatusResources();
      showSuccess('Resource linked successfully!');
    } catch (error) {
      console.error('Error linking resource:', error);
      showError(error.message || 'Failed to link resource');
    }
  };

  const handleUnlinkResource = (resourceId, resourceTitle) => {
    confirmDelete(
      'Unlink Resource',
      `Remove "${resourceTitle}" from the "${selectedStatus}" status?`,
      async () => {
        try {
          await unlinkResourceFromStatus(selectedStatus, resourceId);
          await loadStatusResources();
          showSuccess('Resource unlinked successfully!');
        } catch (error) {
          console.error('Error unlinking resource:', error);
          showError('Failed to unlink resource');
        }
      }
    );
  };

  const handleToggleFeatured = async (resourceId, currentFeatured) => {
    try {
      await updateResourceLinkFeatured(selectedStatus, resourceId, !currentFeatured);
      await loadStatusResources();
      const action = currentFeatured ? 'removed from featured' : 'marked as featured';
      showSuccess(`Resource ${action} successfully!`);
    } catch (error) {
      console.error('Error toggling featured status:', error);
      showError('Failed to update featured status');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    try {
      const newLinkedResources = [...linkedResources];
      const draggedResource = newLinkedResources[draggedIndex];
      
      newLinkedResources.splice(draggedIndex, 1);
      newLinkedResources.splice(dropIndex, 0, draggedResource);
      
      setLinkedResources(newLinkedResources);
      
      const orderedIds = newLinkedResources.map(r => r.id);
      await reorderStatusResourceLinks(selectedStatus, orderedIds);
      
      showSuccess('Resource order updated successfully!');
    } catch (error) {
      console.error('Error reordering resources:', error);
      showError('Failed to update resource order');
      loadStatusResources();
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
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

  const filteredAvailableResources = availableResources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMobileResourceCard = (resource, isLinked = false, index = null) => (
    <div
      key={resource.id}
      draggable={isLinked}
      onDragStart={isLinked ? (e) => handleDragStart(e, index) : undefined}
      onDragOver={isLinked ? (e) => handleDragOver(e, index) : undefined}
      onDragLeave={isLinked ? handleDragLeave : undefined}
      onDrop={isLinked ? (e) => handleDrop(e, index) : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        backgroundColor: dragOverIndex === index ? '#e3f2fd' : 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
        cursor: isLinked ? 'grab' : 'default',
        transform: draggedIndex === index ? 'rotate(1deg)' : 'none',
        opacity: draggedIndex === index ? 0.5 : 1,
        transition: isLinked ? 'all 0.2s ease' : 'none',
        minHeight: '80px'
      }}
    >
      {/* Header with thumbnail and title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
        {isLinked && (
          <FontAwesomeIcon 
            icon={faGripVertical} 
            style={{ color: '#666', marginRight: '8px', marginTop: '4px', fontSize: '12px' }}
          />
        )}
        
        {/* Thumbnail */}
        <div style={{
          width: '40px',
          height: '30px',
          borderRadius: '4px',
          overflow: 'hidden',
          marginRight: '8px',
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
                fontSize: '14px',
                color: getResourceTypeColor(resource.resource_type)
              }}
            />
          )}
        </div>

        {/* Title and type */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            wordBreak: 'break-word',
            lineHeight: 1.2
          }}>
            <FontAwesomeIcon 
              icon={getResourceIcon(resource.resource_type)}
              style={{
                color: getResourceTypeColor(resource.resource_type),
                fontSize: '12px',
                flexShrink: 0
              }}
            />
            <span style={{ flex: 1 }}>{resource.title}</span>
            {isLinked && resource.is_featured && (
              <FontAwesomeIcon 
                icon={faStar} 
                style={{ color: '#ffc107', fontSize: '10px', flexShrink: 0 }}
                title="Featured resource"
              />
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            {resource.category && (
              <span style={{
                fontSize: '10px',
                color: '#666',
                padding: '1px 4px',
                backgroundColor: '#e9ecef',
                borderRadius: '8px'
              }}>
                {resource.category}
              </span>
            )}
            <span style={{
              fontSize: '10px',
              color: '#999'
            }}>
              {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 'auto'
      }}>
        <button
          onClick={() => window.open(resource.url, '_blank')}
          style={{
            background: 'none',
            border: '1px solid #4285f4',
            color: '#4285f4',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '10px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title="Open resource"
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '8px' }} />
          Open
        </button>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          {isLinked ? (
            <>
              <button
                onClick={() => handleToggleFeatured(resource.id, resource.is_featured)}
                style={{
                  background: 'none',
                  border: '1px solid',
                  borderColor: resource.is_featured ? '#ffc107' : '#ccc',
                  color: resource.is_featured ? '#ffc107' : '#ccc',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '10px',
                  borderRadius: '4px'
                }}
                title={resource.is_featured ? 'Remove from featured' : 'Mark as featured'}
              >
                <FontAwesomeIcon icon={faStar} />
              </button>
              
              <button
                onClick={() => handleUnlinkResource(resource.id, resource.title)}
                style={{
                  background: 'none',
                  border: '1px solid #d32f2f',
                  color: '#d32f2f',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '10px',
                  borderRadius: '4px'
                }}
                title="Unlink resource"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </>
          ) : (
            <button
              onClick={() => handleLinkResource(resource.id)}
              style={{
                background: '#28a745',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '6px 10px',
                fontSize: '10px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Link to status"
            >
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: '8px' }} />
              Link
            </button>
          )}
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
              <FontAwesomeIcon icon={faLink} />
              Link Resources to Status
            </h3>
            <button 
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                fontSize: '1.25rem', 
                cursor: 'pointer',
                padding: '4px'
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

            {/* Status Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Select Status:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '10px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Choose a status...</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedStatus && (
              <>
                {/* Linked Resources Section */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px'
                  }}>
                    <FontAwesomeIcon icon={faCheck} style={{ color: '#28a745' }} />
                    Linked to "{selectedStatus}" ({linkedResources.length})
                  </h4>
                  
                  {linkedResources.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      <p style={{ margin: '0 0 8px 0' }}>No resources linked yet.</p>
                      <p style={{ margin: 0, fontSize: '12px' }}>
                        Link resources below to help educate pet owners.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '12px',
                        fontStyle: 'italic'
                      }}>
                        Drag to reorder • ⭐ = Featured (shown first)
                      </div>
                      
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '8px'
                      }}>
                        {linkedResources.map((resource, index) => 
                          renderMobileResourceCard(resource, true, index)
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Available Resources Section */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <h4 style={{ 
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px'
                    }}>
                      <FontAwesomeIcon icon={faPlus} style={{ color: '#28a745' }} />
                      Available ({filteredAvailableResources.length})
                    </h4>
                  </div>

                  {/* Search */}
                  <div style={{ 
                    position: 'relative', 
                    marginBottom: '12px' 
                  }}>
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
                        fontSize: '12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {filteredAvailableResources.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      {availableResources.length === 0 ? (
                        <>
                          <p style={{ margin: '0 0 8px 0' }}>All resources are linked.</p>
                          <p style={{ margin: 0, fontSize: '12px' }}>
                            Create more in the Resource Bank.
                          </p>
                        </>
                      ) : (
                        <p style={{ margin: 0 }}>No resources match your search.</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {filteredAvailableResources.map((resource) => (
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
                            minHeight: '80px'
                          }}
                        >
                          {/* Header with thumbnail and title */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                            {/* Thumbnail */}
                            <div style={{
                              width: '40px',
                              height: '30px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              marginRight: '8px',
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
                                    fontSize: '14px',
                                    color: getResourceTypeColor(resource.resource_type)
                                  }}
                                />
                              )}
                            </div>

                            {/* Title and type */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                marginBottom: '2px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                wordBreak: 'break-word',
                                lineHeight: 1.2
                              }}>
                                <FontAwesomeIcon 
                                  icon={getResourceIcon(resource.resource_type)}
                                  style={{
                                    color: getResourceTypeColor(resource.resource_type),
                                    fontSize: '12px',
                                    flexShrink: 0
                                  }}
                                />
                                <span style={{ flex: 1 }}>{resource.title}</span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {resource.category && (
                                  <span style={{
                                    fontSize: '10px',
                                    color: '#666',
                                    padding: '1px 4px',
                                    backgroundColor: '#e9ecef',
                                    borderRadius: '8px'
                                  }}>
                                    {resource.category}
                                  </span>
                                )}
                                <span style={{
                                  fontSize: '10px',
                                  color: '#999'
                                }}>
                                  {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions row */}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginTop: 'auto'
                          }}>
                            <button
                              onClick={() => window.open(resource.url, '_blank')}
                              style={{
                                background: 'none',
                                border: '1px solid #4285f4',
                                color: '#4285f4',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                fontSize: '10px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Open resource"
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '8px' }} />
                              Open
                            </button>
                            
                            <button
                              onClick={() => handleLinkResource(resource.id)}
                              style={{
                                background: '#28a745',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                fontSize: '10px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Link to status"
                            >
                              <FontAwesomeIcon icon={faPlus} style={{ fontSize: '8px' }} />
                              Link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Instructions */}
            <div style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#e8f0fe',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#1a73e8'
            }}>
              <h5 style={{ margin: '0 0 6px 0', color: '#1a73e8', fontSize: '13px' }}>How it works:</h5>
              <ul style={{ margin: 0, paddingLeft: '14px' }}>
                <li>Select a status above</li>
                <li>Link resources to help educate owners</li>
                <li>Drag to reorder (⭐ featured show first)</li>
                <li>Resources appear on owner timeline</li>
              </ul>
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

export default StatusResourceLinker;