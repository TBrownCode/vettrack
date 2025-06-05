// src/App.js - Updated with clickable logo navigation
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import PatientDetail from './pages/PatientDetail';
import PatientStatusTracker from './pages/PatientStatusTracker';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public route for owner status tracking */}
            <Route path="/status/:id" element={<PatientStatusTracker />} />
            
            {/* Protected routes for staff */}
            <Route path="/" element={
              <ProtectedRoute>
                <header className="App-header">
                  <Link to="/" className="header-logo-link">
                    <h1>VetTrack</h1>
                  </Link>
                </header>
                <main>
                  <Home />
                </main>
                <footer className="App-footer">
                  <p>VetTrack - Veterinary Patient Tracking System</p>
                </footer>
              </ProtectedRoute>
            } />
            
            <Route path="/patient/:id" element={
              <ProtectedRoute>
                <header className="App-header">
                  <Link to="/" className="header-logo-link">
                    <h1>VetTrack</h1>
                  </Link>
                </header>
                <main>
                  <PatientDetail />
                </main>
                <footer className="App-footer">
                  <p>VetTrack - Veterinary Patient Tracking System</p>
                </footer>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;