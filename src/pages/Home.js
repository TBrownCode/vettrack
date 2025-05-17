// In src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faQrcode, faPlus } from '@fortawesome/free-solid-svg-icons';
import PatientCard from '../components/PatientCard';
import NewPatientForm from '../components/NewPatientForm';
import QRCodeScanner from '../components/QRCodeScanner'; // Add this import
import { getPatients, addPatient, deletePatient } from '../services/patientService';
import '../styles/Home.css';

const Home = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false); // Add this state
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch patients
    const loadPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleAddPatient = async (newPatient) => {
    try {
      setLoading(true);
      const savedPatient = await addPatient(newPatient);
      
      // Add the new patient to the state
      setPatients(prevPatients => [savedPatient, ...prevPatients]);
      
      // Close the form
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding patient:', error);
      alert('Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  // Add this delete handler function
  const handleDeletePatient = async (id) => {
    try {
      setLoading(true);
      await deletePatient(id);
      
      // Remove the patient from state
      setPatients(prevPatients => prevPatients.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Failed to delete patient');
    } finally {
      setLoading(false);
    }
  };

  // Add this handler for QR scanning
  const handleScanSuccess = (patientId) => {
    // Navigate to patient details
    navigate(`/patient/${patientId}`);
    setShowScanner(false);
  };

  return (
    <div className="home-container">
      <div className="search-container">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search patients..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="patients-list">
        {loading ? (
          <div className="loading">Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="no-results">No patients found</div>
        ) : (
          filteredPatients.map(patient => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onClick={() => navigate(`/patient/${patient.id}`)} 
              onDelete={handleDeletePatient}
            />
          ))
        )}
      </div>

      {/* Scan QR button - updated to open scanner directly */}
      <button 
        className="scan-button" 
        onClick={() => setShowScanner(true)} // Changed from navigate('/scan')
        aria-label="Scan QR code"
      >
        <FontAwesomeIcon icon={faQrcode} />
      </button>
      
      {/* Add patient button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#34a853', /* Green color */
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          border: 'none',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          zIndex: 5,
          cursor: 'pointer'
        }}
        onClick={() => setShowAddForm(true)}
        aria-label="Add new patient"
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
      
      {/* Add new patient form */}
      {showAddForm && (
        <NewPatientForm 
          onSave={handleAddPatient}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      
      {/* Add QR code scanner - NEW */}
      {showScanner && (
        <QRCodeScanner 
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Home;