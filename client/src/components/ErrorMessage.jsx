import React from 'react';

function ErrorMessage({ error, statusCode, onReset }) {
  let title = 'Analysis Error';
  let icon = '⚠️';
  let guidance = null;

  if (statusCode === 404) {
    title = 'Repository Not Found';
    icon = '🔍';
    guidance = 'Please verify that the owner and repository names are spelled correctly and that the repository is set to public on GitHub.';
  } else if (statusCode === 400) {
    title = 'Invalid Repository Format';
    icon = '✏️';
    guidance = 'Please provide the repository in the format "owner/repository" (e.g. "expressjs/express") or paste a complete GitHub repository URL.';
  } else if (statusCode === 429) {
    title = 'GitHub API Rate Limit Reached';
    icon = '⏳';
    guidance = 'Unauthenticated GitHub requests are limited to 60 per hour per IP. You can add a free personal access token to `server/.env` as GITHUB_TOKEN to raise this limit to 5,000 requests per hour.';
  }

  return (
    <div className="error-card">
      <div className="error-icon">{icon}</div>
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <p className="error-message">{error}</p>
        {guidance && <p className="error-guidance">{guidance}</p>}

        <button type="button" className="error-retry-btn" onClick={onReset}>
          Try Another Repository
        </button>
      </div>
    </div>
  );
}

export default ErrorMessage;
