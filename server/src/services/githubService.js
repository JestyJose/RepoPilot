/**
 * Service to interact with the GitHub REST API v3.
 * Supports optional GITHUB_TOKEN in environment to increase rate limit from 60 to 5000 req/hr.
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Returns standard GitHub request headers.
 */
function getHeaders() {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'RepoPilot-Auditor-CSE-Portfolio',
  };

  const token = process.env.GITHUB_TOKEN;
  if (token && token.trim() !== '') {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  return headers;
}

/**
 * Performs a fetch request to GitHub with timeout and standard error wrapping.
 */
async function fetchFromGitHub(endpoint, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${GITHUB_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
      signal: controller.signal,
    });

    // Check rate limits
    const remaining = response.headers.get('x-ratelimit-remaining');
    const resetTime = response.headers.get('x-ratelimit-reset');

    if (response.status === 404) {
      const error = new Error('Repository not found. Ensure the repository exists, is spelled correctly, and is public.');
      error.status = 404;
      throw error;
    }

    if (response.status === 403 && remaining === '0') {
      const resetDate = resetTime ? new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString() : 'shortly';
      const error = new Error(`GitHub API rate limit exceeded. Limit resets at ${resetDate}. Consider adding a free GITHUB_TOKEN to server/.env to increase rate limits.`);
      error.status = 429;
      throw error;
    }

    if (response.status === 401) {
      const error = new Error('GitHub API authentication failed. Please verify your GITHUB_TOKEN configuration.');
      error.status = 401;
      throw error;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `GitHub API returned HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Request to GitHub API timed out after 10 seconds. Please try again.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches basic repository metadata.
 */
async function getRepoMetadata(owner, repo) {
  return await fetchFromGitHub(`/repos/${owner}/${repo}`);
}

/**
 * Fetches root contents of the repository.
 */
async function getRepoContents(owner, repo, path = '') {
  try {
    return await fetchFromGitHub(`/repos/${owner}/${repo}/contents/${path}`);
  } catch (err) {
    // If a subfolder like .github/workflows is not found (404), return empty array
    if (err.status === 404 && path !== '') {
      return [];
    }
    throw err;
  }
}

/**
 * Checks for GitHub Actions workflows in .github/workflows.
 */
async function getWorkflows(owner, repo) {
  try {
    const contents = await getRepoContents(owner, repo, '.github/workflows');
    if (Array.isArray(contents)) {
      return contents.filter(item => 
        (item.type === 'file' || !item.type) && 
        (item.name.endsWith('.yml') || item.name.endsWith('.yaml')) &&
        (!item.path || item.path.startsWith('.github/workflows/'))
      );
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Checks for community files in .github (e.g. templates).
 */
async function getGithubFolderContents(owner, repo) {
  try {
    const contents = await getRepoContents(owner, repo, '.github');
    return Array.isArray(contents) ? contents : [];
  } catch {
    return [];
  }
}

/**
 * Fetches and decodes text content of a single repository file (e.g. package.json, config).
 */
async function getFileContent(owner, repo, path) {
  try {
    const data = await fetchFromGitHub(`/repos/${owner}/${repo}/contents/${path}`);
    if (data && data.content && data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Aggregates all repository data needed for audit.
 */
async function getCompleteRepoData(owner, repo) {
  // Fetch metadata and root contents in parallel
  const [metadata, rootContents] = await Promise.all([
    getRepoMetadata(owner, repo),
    getRepoContents(owner, repo, ''),
  ]);

  const rootItems = Array.isArray(rootContents) ? rootContents : [];

  // Check if .github directory exists to fetch workflows and templates
  const hasDotGithub = rootItems.some(item => item.name.toLowerCase() === '.github' && item.type === 'dir');

  // Check if package.json exists to inspect scripts and test dependencies
  const hasPackageJson = rootItems.some(item => item.name.toLowerCase() === 'package.json' && item.type === 'file');

  const asyncTasks = [
    hasDotGithub ? getWorkflows(owner, repo) : Promise.resolve([]),
    hasDotGithub ? getGithubFolderContents(owner, repo) : Promise.resolve([]),
    hasPackageJson ? getFileContent(owner, repo, 'package.json') : Promise.resolve(null),
  ];

  const [workflows, dotGithubContents, rawPackageJson] = await Promise.all(asyncTasks);

  let packageJson = null;
  if (rawPackageJson) {
    try {
      packageJson = JSON.parse(rawPackageJson);
    } catch {
      packageJson = null;
    }
  }

  return {
    metadata,
    rootItems,
    workflows: Array.isArray(workflows) ? workflows : [],
    dotGithubContents: Array.isArray(dotGithubContents) ? dotGithubContents : [],
    packageJson,
  };
}

module.exports = {
  getRepoMetadata,
  getRepoContents,
  getWorkflows,
  getFileContent,
  getCompleteRepoData,
};

