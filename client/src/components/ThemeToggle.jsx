import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, mode, setThemeMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectMode = (newMode) => {
    setThemeMode(newMode);
    setIsOpen(false);
  };

  return (
    <div className="theme-toggle-wrapper" ref={containerRef}>
      {/* Primary 1-Click Toggle Button */}
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={toggleTheme}
        title={`Theme: ${theme === 'dark' ? 'Dark' : 'Light'} (${mode === 'system' ? 'System' : 'Custom'}). Click to switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode.`}
        aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      >
        <div className="theme-icon-container">
          {theme === 'dark' ? (
            <svg
              className="theme-svg moon-svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              className="theme-svg sun-svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </div>
        <span className="theme-current-label">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      </button>

      {/* Menu Dropdown Trigger */}
      <button
        type="button"
        className={`theme-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Choose theme (Light, Dark, or System)"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Theme Settings Popover Menu */}
      {isOpen && (
        <div className="theme-dropdown-menu" role="menu">
          <div className="theme-menu-header">
            <span>Theme Preference</span>
          </div>

          <button
            type="button"
            className={`theme-menu-item ${mode === 'light' ? 'selected' : ''}`}
            onClick={() => handleSelectMode('light')}
            role="menuitem"
          >
            <div className="theme-menu-item-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span>Light Mode</span>
            </div>
            {mode === 'light' && <span className="theme-check-icon">✓</span>}
          </button>

          <button
            type="button"
            className={`theme-menu-item ${mode === 'dark' ? 'selected' : ''}`}
            onClick={() => handleSelectMode('dark')}
            role="menuitem"
          >
            <div className="theme-menu-item-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span>Dark Mode</span>
            </div>
            {mode === 'dark' && <span className="theme-check-icon">✓</span>}
          </button>

          <button
            type="button"
            className={`theme-menu-item ${mode === 'system' ? 'selected' : ''}`}
            onClick={() => handleSelectMode('system')}
            role="menuitem"
          >
            <div className="theme-menu-item-left">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>System ({theme})</span>
            </div>
            {mode === 'system' && <span className="theme-check-icon">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}
