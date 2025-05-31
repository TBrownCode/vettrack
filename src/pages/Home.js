// In src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faQrcode, faPlus } from '@fortawesome/free-solid-svg-icons';
import PatientCard from '../components/PatientCard';
import NewPatientForm from '../components/NewPatientForm';
import QRCodeScanner from '../components/QRCodeScanner';
import { getPatients, addPatient, deletePatient } from '../services/patientService';
import { useAuth } from '../contexts/AuthContext'; // Add this import
import '../styles/Home.css';

const Home = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); // Add this state
  const navigate = useNavigate();
  
  const { user, signOut } = useAuth(); // Add this

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

  // Add this useEffect for click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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

  // Add this logout handler
  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation will happen automatically via AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out');
    }
  };

  return (
    <div className="home-container">
      {/* Add user menu header */}
      <div className="user-header">
        <div className="user-info">
          <span className="welcome-text">Welcome, {user?.user_metadata?.full_name || user?.email}</span>
          <span className="user-role">{user?.user_metadata?.role || 'Staff'}</span>
        </div>
        <div className="user-menu-container">
          <button 
            className="user-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {(user?.user_metadata?.full_name || user?.email)?.charAt(0).toUpperCase()}
            </div>
          </button>
          
          {showUserMenu && (
            <div className="user-menu-dropdown">
              <div className="user-menu-item user-details">
                <strong>{user?.user_metadata?.full_name || 'Staff Member'}</strong>
                <small>{user?.email}</small>
              </div>
              <hr className="user-menu-divider" />
              <button className="user-menu-item" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

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
        onClick={() => setShowScanner(true)}
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
      
      {/* Add QR code scanner */}
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