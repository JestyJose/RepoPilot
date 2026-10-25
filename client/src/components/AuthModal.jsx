import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function AuthModal({ isOpen, onClose, defaultTab = 'signin', initialMessage = '' }) {
  const [tab, setTab] = useState(defaultTab); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { signIn, signUp, isConfigured } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        const data = await signUp(email, password);
        if (data?.session) {
          // If Supabase auto-confirms without email verification
          onClose();
        } else {
          setSuccessMsg('Account created successfully! You can now sign in.');
          setTab('signin');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          ×
        </button>

        <div className="modal-header">
          <div className="modal-icon">🔐</div>
          <h3 className="modal-title">
            {tab === 'signin' ? 'Sign In to RepoPilot' : 'Create Your Account'}
          </h3>
          <p className="modal-subtitle">
            {initialMessage || 'Save repository readiness reports, track portfolio improvements over time, and access your audit history.'}
          </p>
        </div>

        {!isConfigured ? (
          <div className="unconfigured-box">
            <span className="unconfigured-badge">Setup Required</span>
            <h4>Supabase Keys Not Configured</h4>
            <p>
              To enable user authentication and database saves, copy <code>client/.env.example</code> to <code>client/.env</code> and provide your Supabase Project URL and Anon Key.
            </p>
            <div className="code-snippet-box">
              <code>VITE_SUPABASE_URL=https://your-id.supabase.co</code>
              <code>VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...</code>
            </div>
            <p className="unconfigured-note">
              Public repository audits continue to work without signing in.
            </p>
          </div>
        ) : (
          <>
            <div className="modal-tabs">
              <button
                type="button"
                className={`tab-btn ${tab === 'signin' ? 'active' : ''}`}
                onClick={() => { setTab('signin'); setErrorMsg(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => { setTab('signup'); setErrorMsg(''); }}
              >
                Create Account
              </button>
            </div>

            {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
            {successMsg && <div className="auth-alert success">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  required
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    {tab === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </span>
                ) : (
                  tab === 'signin' ? 'Sign In' : 'Create Free Account'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
