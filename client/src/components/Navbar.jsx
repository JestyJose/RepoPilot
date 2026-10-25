import React from 'react';
import { useAuth } from '../context/AuthContext';

function Navbar({ onReset, onOpenAuth, onOpenHistory }) {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={onReset} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="brand-title">RepoPilot</span>
          <span className="brand-tag">Auditor</span>
        </div>

        <div className="nav-links">
          <span className="api-badge">
            <span className="api-dot"></span> API Connected
          </span>

          {!loading && (
            user ? (
              <div className="nav-auth-group">
                <button
                  type="button"
                  className="nav-btn-history"
                  onClick={onOpenHistory}
                  title="View your saved repository audits"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8v4l3 3"/>
                    <circle cx="12" cy="12" r="9"/>
                  </svg>
                  Saved Audits
                </button>

                <div className="user-pill" title={user.email}>
                  <span className="user-avatar-dot"></span>
                  <span className="user-email-text">{user.email?.split('@')[0]}</span>
                </div>

                <button
                  type="button"
                  className="nav-btn-signout"
                  onClick={signOut}
                  title="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="nav-btn-signin"
                onClick={onOpenAuth}
              >
                Sign In
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
