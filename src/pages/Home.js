import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faQrcode } from '@fortawesome/free-solid-svg-icons';
import PatientCard from '../components/PatientCard';
import { getPatients } from '../services/patientService';
import '../styles/Home.css';

const Home = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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
            />
          ))
        )}
      </div>

      <button 
        className="scan-button" 
        onClick={() => navigate('/scan')}
        aria-label="Scan QR code"
      >
        <FontAwesomeIcon icon={faQrcode} />
      </button>
    </div>
  );
};

export default Home;