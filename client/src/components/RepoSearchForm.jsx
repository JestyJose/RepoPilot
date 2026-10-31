import React from 'react';

function RepoSearchForm({ repoInput, setRepoInput, onAnalyze, isLoading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isLoading && repoInput.trim()) {
      onAnalyze(repoInput.trim());
    }
  };

  const sampleRepositories = [
    { label: 'expressjs/express', category: 'Backend' },
    { label: 'facebook/react', category: 'Frontend' },
    { label: 'vercel/next.js', category: 'Fullstack' },
    { label: 'tailwindlabs/tailwindcss', category: 'CSS / Tooling' },
    { label: 'torvalds/linux', category: 'Systems' },
  ];

  const handleSampleClick = (repo) => {
    setRepoInput(repo);
    onAnalyze(repo);
  };

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="agentvet-search-bar">
        <span className="search-icon-wrap" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>

        <input
          type="text"
          className="search-input"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          placeholder="Search repositories, e.g. facebook/react or paste GitHub URL..."
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />

        {repoInput && !isLoading && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => setRepoInput('')}
            title="Clear search input"
          >
            &times;
          </button>
        )}

        <button
          type="submit"
          className="agentvet-search-btn"
          disabled={isLoading || !repoInput.trim()}
        >
          {isLoading ? (
            <span className="btn-loading">
              <span className="spinner"></span>
              Auditing...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* Pill tags underneath search bar matching AgentVet */}
      <div className="sample-chips-row">
        {sampleRepositories.map((item) => (
          <button
            key={item.label}
            type="button"
            className="agentvet-pill-chip"
            onClick={() => handleSampleClick(item.label)}
            disabled={isLoading}
            title={`Run benchmark audit on ${item.label}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RepoSearchForm;
