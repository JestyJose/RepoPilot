/**
 * Utility to sanitize, validate, and extract owner & repository name from user input.
 * Supports:
 * - "owner/repo"
 * - "https://github.com/owner/repo"
 * - "http://github.com/owner/repo/"
 * - "github.com/owner/repo.git"
 */

function parseAndValidateRepo(input) {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      error: 'Repository parameter is required. Example: "expressjs/express" or "https://github.com/expressjs/express".',
    };
  }

  let cleaned = input.trim();

  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // Strip .git suffix if present
  cleaned = cleaned.replace(/\.git$/, '');

  // Extract path from URL if a URL was provided
  const urlPattern = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\s/]+)\/([^\s/]+)$/i;
  const urlMatch = cleaned.match(urlPattern);

  let owner = '';
  let repo = '';

  if (urlMatch) {
    owner = urlMatch[1];
    repo = urlMatch[2];
  } else {
    // Check if format is "owner/repo"
    const parts = cleaned.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) {
      owner = parts[0];
      repo = parts[1];
    } else {
      return {
        valid: false,
        error: 'Invalid repository format. Please provide "owner/repo" or a GitHub repository URL.',
      };
    }
  }

  // GitHub username constraints: alphanumeric and single hyphens, 1-39 chars, cannot start/end with hyphen
  const ownerRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  
  // GitHub repo constraints: alphanumeric, hyphen, underscore, period, 1-100 chars
  const repoRegex = /^[a-zA-Z0-9._-]{1,100}$/;

  if (!ownerRegex.test(owner)) {
    return {
      valid: false,
      error: `Invalid GitHub owner "${owner}". GitHub usernames contain alphanumeric characters and hyphens only.`,
    };
  }

  if (!repoRegex.test(repo)) {
    return {
      valid: false,
      error: `Invalid GitHub repository name "${repo}".`,
    };
  }

  return {
    valid: true,
    owner,
    repo,
    fullName: `${owner}/${repo}`,
  };
}

module.exports = {
  parseAndValidateRepo,
};
