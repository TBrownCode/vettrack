import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPrint, faDownload, faSync, faCopy } from '@fortawesome/free-solid-svg-icons';
import '../styles/QRCodeGenerator.css';

const QRCodeGenerator = ({ patient, onClose }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [qrSize, setQrSize] = useState(200);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const qrCodeRef = useRef(null);
  const printFrameRef = useRef(null);
  
  // Generate QR code on component mount
  useEffect(() => {
    generateQRCode();
  }, []);
  
  // Generate QR code with patient ID
  const generateQRCode = async () => {
    if (!patient || !patient.id) {
      setError('Patient information is missing');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Create QR code content - you can customize this
      const qrContent = `VETTRACK:${patient.id}`;
      
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(qrContent, {
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction for veterinary environment
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      setQrUrl(dataUrl);
      setError(null);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle print functionality
  const handlePrint = () => {
    // Create print frame content
    const printContent = `
      <html>
        <head>
          <title>VetTrack Patient QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              max-width: 300px;
              margin: 0 auto;
            }
            .qr-code {
              margin-bottom: 10px;
            }
            .patient-info {
              text-align: center;
              margin-bottom: 15px;
            }
            .patient-name {
              font-weight: bold;
              font-size: 16px;
              margin: 5px 0;
            }
            .patient-id {
              font-size: 14px;
              color: #666;
              margin: 0;
            }
            .clinic-info {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
              text-align: center;
            }
            .status-link {
              font-size: 12px;
              color: #4285f4;
              margin-top: 5px;
              text-align: center;
            }
            @media print {
              @page {
                size: 58mm 40mm; /* Label size - adjust as needed */
                margin: 0;
              }
              body {
                padding: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="patient-info">
              <p class="patient-name">${patient.name}</p>
              <p class="patient-id">ID: ${patient.id}</p>
            </div>
            <div class="qr-code">
              <img src="${qrUrl}" alt="Patient QR Code" width="${qrSize}" height="${qrSize}">
            </div>
            <div class="clinic-info">
              <p>VetTrack Patient Tracking</p>
              <p class="status-link">Status: ${window.location.origin}/status/${patient.id}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Access the print frame and set its content
    if (printFrameRef.current) {
      const frameDoc = printFrameRef.current.contentDocument;
      frameDoc.open();
      frameDoc.write(printContent);
      frameDoc.close();
      
      // Print after content is loaded
      setTimeout(() => {
        printFrameRef.current.contentWindow.focus();
        printFrameRef.current.contentWindow.print();
      }, 500);
    }
  };
  
  // Download QR code as image
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${patient.id}_qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Regenerate QR code (useful if there was an error)
  const handleRegenerate = () => {
    generateQRCode();
  };
  
  return (
    <div className="qr-code-modal">
      <div className="qr-code-header">
        <h3>Patient QR Code</h3>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="qr-code-content">
        {loading ? (
          <div className="qr-loading">
            <div className="spinner"></div>
            <p>Generating QR code...</p>
          </div>
        ) : error ? (
          <div className="qr-error">
            <p>{error}</p>
            <button className="qr-action-button" onClick={handleRegenerate}>
              <FontAwesomeIcon icon={faSync} />
              Try Again
            </button>
          </div>
        ) : (
          <div className="qr-display">
            <div className="qr-code-container" ref={qrCodeRef}>
              <img src={qrUrl} alt="Patient QR Code" />
            </div>
            
            <div className="qr-patient-info">
              <h4>{patient.name}</h4>
              <p className="qr-patient-id">ID: {patient.id}</p>
              <p className="qr-patient-details">
                {patient.species} • {patient.breed}
              </p>
            </div>
            
            <div className="qr-instructions">
              <p>Scan this code to quickly access patient information.</p>
              <p>Print and attach to patient collar or cage.</p>
            </div>
            
            {/* New section for owner status link */}
            <div className="owner-link-section">
              <h4>Share with Owner</h4>
              <p>Provide this link to the pet owner to track their pet's status:</p>
              <div className="status-link">
                {`${window.location.origin}/status/${patient.id}`}
              </div>
              <button 
                className="qr-action-button"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/status/${patient.id}`);
                  alert('Link copied to clipboard!');
                }}
              >
                <FontAwesomeIcon icon={faCopy} />
                Copy Link
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="qr-code-actions">
        <button 
          className="qr-action-button"
          onClick={handlePrint}
          disabled={loading || error}
        >
          <FontAwesomeIcon icon={faPrint} />
          Print QR Code
        </button>
        
        <button 
          className="qr-action-button"
          onClick={handleDownload}
          disabled={loading || error}
        >
          <FontAwesomeIcon icon={faDownload} />
          Download
        </button>
      </div>
      
      {/* Hidden iframe for printing */}
      <iframe 
        ref={printFrameRef}
        style={{ display: 'none' }} 
        title="Print Frame"
      />
    </div>
  );
};

export default QRCodeGenerator;