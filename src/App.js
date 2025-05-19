import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import PatientDetail from './pages/PatientDetail';
import PatientStatusTracker from './pages/PatientStatusTracker';

// We no longer need the Scan placeholder component
// const Scan = () => <div>QR Scanner Page</div>;

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>VetTrack</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/status/:id" element={<PatientStatusTracker />} />
            {/* Removed the /scan route since we're showing the scanner directly in Home */}
          </Routes>
        </main>
        <footer className="App-footer">
          <p>VetTrack - Veterinary Patient Tracking System</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
