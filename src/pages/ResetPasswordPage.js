// src/pages/ResetPasswordPage.js - Fixed to handle URL hash parameters
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faPaw } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/LoginForm.css'; // Reuse login form styles

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidLink, setIsValidLink] = useState(false);
  
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  useEffect(() => {
    // Parse tokens from URL hash (not search params)
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log('Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        if (!accessToken || !refreshToken || type !== 'recovery') {
          setError('Invalid reset link. Please request a new password reset.');
          return;
        }

        // Set the session with the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('Error setting session:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
          return;
        }

        console.log('Session set successfully:', data);
        setIsValidLink(true);
        
        // Clear the URL hash for security
        window.history.replaceState(null, null, window.location.pathname);
        
      } catch (error) {
        console.error('Error handling auth callback:', error);
        setError('An error occurred processing the reset link.');
      }
    };

    handleAuthCallback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValidLink) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      
      setSuccess('Password updated successfully! Redirecting to login...');
      
      // Sign out to ensure clean state
      await supabase.auth.signOut();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
      
    } catch (error) {
      console.error('Password update error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FontAwesomeIcon icon={faPaw} className="login-icon" />
          <h1>Set New Password</h1>
          <p>Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your new password"
                minLength="6"
                disabled={!isValidLink}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!isValidLink}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your new password"
                minLength="6"
                disabled={!isValidLink}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={!isValidLink}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading || !isValidLink}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>

          <div className="login-footer">
            <p className="contact-admin">
              Remember your password? <button type="button" className="toggle-form" onClick={() => navigate('/')}>Back to Login</button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;