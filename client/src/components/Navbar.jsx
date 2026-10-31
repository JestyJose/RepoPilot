import React from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

function Navbar({ onReset, onOpenAuth, onOpenHistory, onScrollToBenchmarks }) {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand in AgentVet typography */}
        <div className="nav-brand" onClick={onReset} style={{ cursor: 'pointer' }}>
          <div className="brand-dot"></div>
          <span className="brand-title">RepoPilot<span className="brand-domain">.ai</span></span>
        </div>

        {/* Minimalist AgentVet-style links */}
        <nav className="nav-menu">
          <button type="button" className="nav-link active" onClick={onReset}>
            Auditor
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={onScrollToBenchmarks}
          >
            Benchmarks
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            Directory
          </a>
          {user && (
            <button
              type="button"
              className="nav-link nav-link-highlight"
              onClick={onOpenHistory}
            >
              Saved Audits
            </button>
          )}
        </nav>

        {/* Nav actions: Theme, API badge, Auth button */}
        <div className="nav-actions">
          <div className="api-status-chip" title="Connected to GitHub API & Supabase">
            <span className="status-ping"></span>
            <span>Live API</span>
          </div>

          <ThemeToggle />

          {!loading && (
            user ? (
              <div className="nav-auth-group">
                <button
                  type="button"
                  className="nav-user-pill"
                  onClick={onOpenHistory}
                  title="View your saved audits"
                >
                  <span className="user-dot"></span>
                  <span className="user-name">{user.email?.split('@')[0]}</span>
                </button>

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
