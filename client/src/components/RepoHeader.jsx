import React from 'react';

function RepoHeader({
  repository,
  onRefresh,
  isLoading,
  onSaveReport,
  isSaved,
  isSaving,
  user,
  onOpenAuth,
}) {
  if (!repository) return null;

  const handleSaveClick = () => {
    if (!user) {
      onOpenAuth('Sign in or create a free account to save this report to your portfolio history.');
      return;
    }
    if (!isSaved && !isSaving) {
      onSaveReport();
    }
  };

  return (
    <div className="repo-header-card">
      <div className="repo-header-main">
        <div className="repo-avatar-wrap">
          {repository.owner?.avatarUrl ? (
            <img
              src={repository.owner.avatarUrl}
              alt={repository.owner.login || 'Owner'}
              className="repo-avatar"
            />
          ) : (
            <div className="repo-avatar-fallback">GH</div>
          )}
        </div>

        <div className="repo-title-block">
          <div className="repo-name-row">
            <h2 className="repo-name">{repository.fullName}</h2>
            {repository.isFork && <span className="fork-badge">Fork</span>}
            {repository.isArchived && <span className="archive-badge">Archived</span>}
          </div>
          <p className="repo-desc">
            {repository.description || 'No description provided on GitHub.'}
          </p>
        </div>

        <div className="repo-actions">
          {/* Save Report Action */}
          <button
            type="button"
            className={`btn-save-report ${isSaved ? 'saved' : ''}`}
            onClick={handleSaveClick}
            disabled={isSaving || isSaved}
            title={user ? (isSaved ? 'Report saved to your account' : 'Save report to history') : 'Sign in to save this report'}
          >
            {isSaving ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : isSaved ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved to History
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Report
              </>
            )}
          </button>

          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-github-view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            GitHub
          </a>

          <button
            onClick={onRefresh}
            className="btn-refresh"
            disabled={isLoading}
            title="Re-run analysis"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'spin-icon' : ''}>
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Re-audit
          </button>
        </div>
      </div>

      <div className="repo-stats-bar">
        <div className="stat-pill">
          <span className="stat-icon">⭐</span>
          <span className="stat-val">{repository.stars?.toLocaleString() || 0}</span>
          <span className="stat-lbl">stars</span>
        </div>
        <div className="stat-pill">
          <span className="stat-icon">🍴</span>
          <span className="stat-val">{repository.forks?.toLocaleString() || 0}</span>
          <span className="stat-lbl">forks</span>
        </div>
        <div className="stat-pill">
          <span className="stat-icon">❗</span>
          <span className="stat-val">{repository.openIssues?.toLocaleString() || 0}</span>
          <span className="stat-lbl">open issues</span>
        </div>
        {repository.language && (
          <div className="stat-pill">
            <span className="stat-icon">💻</span>
            <span className="stat-val">{repository.language}</span>
          </div>
        )}
        <div className="stat-pill">
          <span className="stat-icon">🌿</span>
          <span className="stat-val">{repository.defaultBranch || 'main'}</span>
        </div>
      </div>
    </div>
  );
}

export default RepoHeader;
