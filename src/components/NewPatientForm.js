// src/components/NewPatientForm.js
import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
// import CleanCameraCapture from './CleanCameraCapture';
import SimpleCameraCapture from './SimpleCameraCapture';
import '../styles/NewPatientForm.css';


const NewPatientForm = ({ onSave, onCancel }) => {
  const [patient, setPatient] = useState({
    name: '',
    species: '',
    breed: '',
    owner: '',
    phone: '',
    status: 'Admitted',
    photoUrl: null
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handlePhotoCapture = (photoData) => {
    setPatient(prev => ({
      ...prev,
      photoUrl: photoData
    }));
    setShowCamera(false);
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPatient(prev => ({
        ...prev,
        photoUrl: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!patient.name.trim()) newErrors.name = 'Pet name is required';
    if (!patient.species.trim()) newErrors.species = 'Species is required';
    if (!patient.owner.trim()) newErrors.owner = 'Owner name is required';
    if (!patient.phone.trim()) newErrors.phone = 'Contact number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Generate a simple ID (in a real app, this would come from the backend)
      const newPatient = {
        ...patient,
        id: 'PT' + Math.floor(1000 + Math.random() * 9000), // Simple 4-digit ID
        lastUpdate: new Date().toLocaleTimeString()
      };
      
      onSave(newPatient);
    }
  };
  
  return (
    <div className="new-patient-container">
      <div className="form-header">
        <h2>Add New Patient</h2>
        <button 
          className="close-button"
          onClick={onCancel}
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="patient-form">
        <div className="photo-section">
          <div 
            className="pet-photo-container"
            onClick={() => setShowCamera(true)}  
          >
            {patient.photoUrl ? (
              <img 
                src={patient.photoUrl} 
                alt="Pet" 
                className="pet-photo" 
              />
            ) : (
              <div className="photo-placeholder">
                <FontAwesomeIcon icon={faCamera} size="2x" />
                <span>Add Photo</span>
              </div>
            )}
          </div>
          
          <div className="photo-options">
            <button 
              type="button" 
              className="photo-button"
              onClick={() => setShowCamera(true)}
            >
              <FontAwesomeIcon icon={faCamera} /> Take Photo
            </button>
            
            <button 
              type="button" 
              className="photo-button"
              onClick={() => fileInputRef.current.click()}
            >
              <FontAwesomeIcon icon={faPlus} /> Upload Photo
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        </div>
        
        <div className="form-row">
          <label htmlFor="name">Pet Name*</label>
          <input
            type="text"
            id="name"
            name="name"
            value={patient.name}
            onChange={handleInputChange}
            className={errors.name ? 'input-error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>
        
        <div className="form-row">
          <label htmlFor="species">Species*</label>
          <select
            id="species"
            name="species"
            value={patient.species}
            onChange={handleInputChange}
            className={errors.species ? 'input-error' : ''}
          >
            <option value="">Select Species</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
            <option value="Bird">Bird</option>
            <option value="Reptile">Reptile</option>
            <option value="Small Mammal">Small Mammal</option>
            <option value="Other">Other</option>
          </select>
          {errors.species && <span className="error-message">{errors.species}</span>}
        </div>
        
        <div className="form-row">
          <label htmlFor="breed">Breed</label>
          <input
            type="text"
            id="breed"
            name="breed"
            value={patient.breed}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-row">
          <label htmlFor="owner">Owner Name*</label>
          <input
            type="text"
            id="owner"
            name="owner"
            value={patient.owner}
            onChange={handleInputChange}
            className={errors.owner ? 'input-error' : ''}
          />
          {errors.owner && <span className="error-message">{errors.owner}</span>}
        </div>
        
        <div className="form-row">
          <label htmlFor="phone">Contact Number*</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={patient.phone}
            onChange={handleInputChange}
            className={errors.phone ? 'input-error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>
        
        <div className="form-row">
          <label htmlFor="status">Initial Status</label>
          <select
            id="status"
            name="status"
            value={patient.status}
            onChange={handleInputChange}
          >
            <option value="Admitted">Admitted</option>
            <option value="Being Examined">Being Examined</option>
            <option value="Awaiting Tests">Awaiting Tests</option>
          </select>
        </div>
        
        <div className="form-buttons">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-button"
          >
            Save Patient
          </button>
        </div>
      </form>
      
      {showCamera && (
        <SimpleCameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default NewPatientForm;