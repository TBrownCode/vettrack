// src/components/LoginForm.js - Updated with Forgot Password functionality
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faPaw, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import '../styles/LoginForm.css';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { signIn, resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await resetPassword(resetEmail);
      if (error) throw error;
      
      setSuccess('Password reset email sent! Check your inbox for instructions.');
      setResetEmail('');
    } catch (error) {
      setError(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const goBackToLogin = () => {
    setShowForgotPassword(false);
    setError('');
    setSuccess('');
    setResetEmail('');
  };

  if (showForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <FontAwesomeIcon icon={faPaw} className="login-icon" />
            <h1>Reset Password</h1>
            <p>Enter your email to receive reset instructions</p>
          </div>

          <form onSubmit={handleForgotPassword} className="login-form">
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <label htmlFor="resetEmail">Email Address</label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>

            <div className="login-footer">
              <button
                type="button"
                className="back-to-login"
                onClick={goBackToLogin}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FontAwesomeIcon icon={faPaw} className="login-icon" />
          <h1>InPawgress</h1>
          <p>Veterinary Patient Tracking System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Please wait...' : 'Sign In'}
          </button>

          <div className="login-footer">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot your password?
            </button>
            <p className="contact-admin">
              Need an account? Contact your administrator.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;