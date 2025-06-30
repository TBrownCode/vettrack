// src/App.js - Updated with Reset Password route
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import PatientDetail from './pages/PatientDetail';
import PatientStatusTracker from './pages/PatientStatusTracker';
import ResetPasswordPage from './pages/ResetPasswordPage'; // Add this import
import HeaderDropdownMenu from './components/HeaderDropdownMenu';
import ClinicSelector from './components/ClinicSelector';
import StatusManagement from './components/StatusManagement';
import EducationalResourcesManager from './components/EducationalResourcesManager';
import StatusResourceLinker from './components/StatusResourceLinker';
import SoftDeletedPatients from './components/SoftDeletedPatients';

function App() {
  const [showStatusManagement, setShowStatusManagement] = useState(false);
  const [showEducationalManager, setShowEducationalManager] = useState(false);
  const [showResourceLinker, setShowResourceLinker] = useState(false);
  const [showSoftDeletedPatients, setShowSoftDeletedPatients] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Clinic Selector - Shows in development, can be enabled for production */}
          <ClinicSelector showInProduction={false} />
          
          <Routes>
            {/* Public route for owner status tracking */}
            <Route path="/status/:id" element={<PatientStatusTracker />} />
            
            {/* Public route for password reset */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Protected routes for staff */}
            <Route path="/" element={
              <ProtectedRoute>
                <header className="App-header">
                  <Link to="/" className="header-logo-link">
                    <h1>InPawgress</h1>
                  </Link>
                  
                  <HeaderDropdownMenu
                    onStatusManagement={() => setShowStatusManagement(true)}
                    onEducationalManager={() => setShowEducationalManager(true)}
                    onResourceLinker={() => setShowResourceLinker(true)}
                    onSoftDeletedPatients={() => setShowSoftDeletedPatients(true)}
                  />
                </header>
                <main>
                  <Home />
                </main>
                <footer className="App-footer">
                  <p>InPawgress - Veterinary Patient Tracking System</p>
                </footer>
              </ProtectedRoute>
            } />
            
            <Route path="/patient/:id" element={
              <ProtectedRoute>
                <header className="App-header">
                  <Link to="/" className="header-logo-link">
                    <h1>InPawgress</h1>
                  </Link>
                  
                  <HeaderDropdownMenu
                    onStatusManagement={() => setShowStatusManagement(true)}
                    onEducationalManager={() => setShowEducationalManager(true)}
                    onResourceLinker={() => setShowResourceLinker(true)}
                    onSoftDeletedPatients={() => setShowSoftDeletedPatients(true)}
                  />
                </header>
                <main>
                  <PatientDetail />
                </main>
                <footer className="App-footer">
                  <p>InPawgress - Veterinary Patient Tracking System</p>
                </footer>
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Management Modals */}
          {showStatusManagement && (
            <StatusManagement onClose={() => setShowStatusManagement(false)} />
          )}
          
          {showEducationalManager && (
            <EducationalResourcesManager onClose={() => setShowEducationalManager(false)} />
          )}
          
          {showResourceLinker && (
            <StatusResourceLinker onClose={() => setShowResourceLinker(false)} />
          )}
          
          {showSoftDeletedPatients && (
            <SoftDeletedPatients onClose={() => setShowSoftDeletedPatients(false)} />
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;