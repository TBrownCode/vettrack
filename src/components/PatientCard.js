import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PatientCard.css';

const PatientCard = ({ patient }) => {
  const navigate = useNavigate();
  
  // Get appropriate status styles
  const getStatusStyle = (status) => {
    if (status.includes('Surgery')) return 'status-surgery';
    if (status.includes('Recovery')) return 'status-recovery';
    if (status === 'Admitted') return 'status-admitted';
    if (status.includes('Discharge')) return 'status-discharge';
    return 'status-default';
  };
  
  return (
    <div 
      className="patient-card"
      onClick={() => navigate(`/patient/${patient.id}`)}
    >
      <div className="patient-avatar">
        <img src={patient.photoUrl || '/images/placeholder-pet.png'} alt={patient.name} />
      </div>
      <div className="patient-info">
        <h3 className="patient-name">{patient.name}</h3>
        <p className="patient-breed">{patient.species} • {patient.breed}</p>
        <p className="patient-owner">Owner: {patient.owner}</p>
        <div className={`patient-status ${getStatusStyle(patient.status)}`}>
          {patient.status}
        </div>
      </div>
      <div className="patient-time">
        {patient.lastUpdate}
      </div>
    </div>
  );
};

export default PatientCard;