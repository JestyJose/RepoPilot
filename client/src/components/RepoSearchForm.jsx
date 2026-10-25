import React from 'react';

function RepoSearchForm({ repoInput, setRepoInput, onAnalyze, isLoading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && repoInput.trim()) {
      onAnalyze(repoInput.trim());
    }
  };

  const handleSampleClick = (sample) => {
    setRepoInput(sample);
    onAnalyze(sample);
  };

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-wrapper">
          <span className="input-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="Enter public repository, e.g. expressjs/express or full URL"
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />
          {repoInput && !isLoading && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setRepoInput('')}
              title="Clear input"
            >
              ×
            </button>
          )}
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={isLoading || !repoInput.trim()}
        >
          {isLoading ? (
            <span className="btn-loading">
              <span className="spinner"></span>
              Analyzing...
            </span>
          ) : (
            'Analyze Repository'
          )}
        </button>
      </form>

      <div className="sample-repos">
        <span className="sample-label">Try popular examples:</span>
        <button
          type="button"
          className="sample-badge"
          onClick={() => handleSampleClick('expressjs/express')}
          disabled={isLoading}
        >
          expressjs/express
        </button>
        <button
          type="button"
          className="sample-badge"
          onClick={() => handleSampleClick('facebook/react')}
          disabled={isLoading}
        >
          facebook/react
        </button>
        <button
          type="button"
          className="sample-badge"
          onClick={() => handleSampleClick('vercel/next.js')}
          disabled={isLoading}
        >
          vercel/next.js
        </button>
      </div>
    </div>
  );
}

export default RepoSearchForm;
