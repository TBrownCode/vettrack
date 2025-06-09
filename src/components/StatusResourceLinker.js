// src/components/StatusResourceLinker.js
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
      await loadStatusResources(); // Refresh the lists
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
          await loadStatusResources(); // Refresh the lists
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
      await loadStatusResources(); // Refresh the lists
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
      // Reorder the linked resources array
      const newLinkedResources = [...linkedResources];
      const draggedResource = newLinkedResources[draggedIndex];
      
      newLinkedResources.splice(draggedIndex, 1);
      newLinkedResources.splice(dropIndex, 0, draggedResource);
      
      // Update the display immediately
      setLinkedResources(newLinkedResources);
      
      // Save the new order to database
      const orderedIds = newLinkedResources.map(r => r.id);
      await reorderStatusResourceLinks(selectedStatus, orderedIds);
      
      showSuccess('Resource order updated successfully!');
    } catch (error) {
      console.error('Error reordering resources:', error);
      showError('Failed to update resource order');
      // Reload to restore original order
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
          maxWidth: '1000px',
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

            {/* Status Selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                fontSize: '16px'
              }}>
                Select Status to Manage:
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  width: '100%',
                  maxWidth: '400px'
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Linked Resources */}
                <div>
                  <h4 style={{ 
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FontAwesomeIcon icon={faCheck} style={{ color: '#28a745' }} />
                    Linked to "{selectedStatus}" ({linkedResources.length})
                  </h4>
                  
                  {linkedResources.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      color: '#666'
                    }}>
                      <p>No resources linked to this status yet.</p>
                      <p style={{ fontSize: '14px' }}>
                        Link resources from the right panel to help educate pet owners.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '12px',
                        fontStyle: 'italic'
                      }}>
                        Drag to reorder • ⭐ = Featured resources shown first
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {linkedResources.map((resource, index) => (
                          <div
                            key={resource.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px',
                              backgroundColor: dragOverIndex === index ? '#e3f2fd' : 'white',
                              border: '1px solid #e1e5e9',
                              borderRadius: '8px',
                              boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                              cursor: 'grab',
                              transform: draggedIndex === index ? 'rotate(2deg)' : 'none',
                              opacity: draggedIndex === index ? 0.5 : 1,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {/* Drag handle */}
                            <FontAwesomeIcon 
                              icon={faGripVertical} 
                              style={{ color: '#666', marginRight: '12px' }}
                            />

                            {/* Thumbnail */}
                            <div style={{
                              width: '50px',
                              height: '38px',
                              borderRadius: '4px',
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
                                    fontSize: '16px',
                                    color: getResourceTypeColor(resource.resource_type)
                                  }}
                                />
                              )}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <FontAwesomeIcon 
                                  icon={getResourceIcon(resource.resource_type)}
                                  style={{
                                    color: getResourceTypeColor(resource.resource_type),
                                    fontSize: '12px'
                                  }}
                                />
                                {resource.title}
                                {resource.is_featured && (
                                  <FontAwesomeIcon 
                                    icon={faStar} 
                                    style={{ color: '#ffc107', fontSize: '12px' }}
                                    title="Featured resource"
                                  />
                                )}
                              </div>
                              {resource.category && (
                                <div style={{
                                  fontSize: '11px',
                                  color: '#666',
                                  padding: '2px 6px',
                                  backgroundColor: '#e9ecef',
                                  borderRadius: '10px',
                                  display: 'inline-block'
                                }}>
                                  {resource.category}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                              <button
                                onClick={() => window.open(resource.url, '_blank')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#4285f4',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  fontSize: '12px'
                                }}
                                title="Open resource"
                              >
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                              </button>
                              
                              <button
                                onClick={() => handleToggleFeatured(resource.id, resource.is_featured)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: resource.is_featured ? '#ffc107' : '#ccc',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  fontSize: '12px'
                                }}
                                title={resource.is_featured ? 'Remove from featured' : 'Mark as featured'}
                              >
                                <FontAwesomeIcon icon={faStar} />
                              </button>
                              
                              <button
                                onClick={() => handleUnlinkResource(resource.id, resource.title)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#d32f2f',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  fontSize: '12px'
                                }}
                                title="Unlink resource"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Available Resources */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{ 
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FontAwesomeIcon icon={faPlus} style={{ color: '#28a745' }} />
                      Available Resources ({filteredAvailableResources.length})
                    </h4>
                  </div>

                  {/* Search */}
                  <div style={{ 
                    position: 'relative', 
                    marginBottom: '16px' 
                  }}>
                    <FontAwesomeIcon 
                      icon={faSearch} 
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#666',
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search available resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        border: '1px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {filteredAvailableResources.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      color: '#666'
                    }}>
                      {availableResources.length === 0 ? (
                        <>
                          <p>All resources are already linked to this status.</p>
                          <p style={{ fontSize: '14px' }}>
                            Create more resources in the Resource Bank to add them here.
                          </p>
                        </>
                      ) : (
                        <p>No resources match your search.</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredAvailableResources.map((resource) => (
                        <div 
                          key={resource.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            backgroundColor: 'white',
                            border: '1px solid #e1e5e9',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          {/* Thumbnail */}
                          <div style={{
                            width: '50px',
                            height: '38px',
                            borderRadius: '4px',
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
                                  fontSize: '16px',
                                  color: getResourceTypeColor(resource.resource_type)
                                }}
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <FontAwesomeIcon 
                                icon={getResourceIcon(resource.resource_type)}
                                style={{
                                  color: getResourceTypeColor(resource.resource_type),
                                  fontSize: '12px'
                                }}
                              />
                              {resource.title}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {resource.category && (
                                <span style={{
                                  fontSize: '11px',
                                  color: '#666',
                                  padding: '2px 6px',
                                  backgroundColor: '#e9ecef',
                                  borderRadius: '10px'
                                }}>
                                  {resource.category}
                                </span>
                              )}
                              <span style={{
                                fontSize: '11px',
                                color: '#999'
                              }}>
                                {resource.resource_type.charAt(0).toUpperCase() + resource.resource_type.slice(1)}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                            <button
                              onClick={() => window.open(resource.url, '_blank')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#4285f4',
                                cursor: 'pointer',
                                padding: '4px',
                                fontSize: '12px'
                              }}
                              title="Preview resource"
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </button>
                            
                            <button
                              onClick={() => handleLinkResource(resource.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#28a745',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                backgroundColor: '#e8f5e9'
                              }}
                              title="Link to status"
                            >
                              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '4px' }} />
                              Link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#e8f0fe',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1a73e8'
            }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#1a73e8' }}>How it works:</h5>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                <li>Select a status from the dropdown above</li>
                <li>Link educational resources to help owners understand what's happening</li>
                <li>Drag linked resources to reorder them (featured resources show first)</li>
                <li>Resources will appear as clickable buttons on the owner's status timeline</li>
                <li>★ Featured resources are highlighted and shown prominently</li>
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