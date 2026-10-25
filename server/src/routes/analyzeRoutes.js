const express = require('express');
const router = express.Router();
const { parseAndValidateRepo } = require('../utils/repoValidator');
const { getCompleteRepoData } = require('../services/githubService');
const { evaluateRepository } = require('../services/scoringEngine');

/**
 * GET /api/analyze?repo=OWNER/REPO
 * Analyzes a public GitHub repository and returns readiness audit with recommendations.
 */
router.get('/analyze', async (req, res) => {
  const repoInput = req.query.repo;

  // 1. Input Validation
  const validation = parseAndValidateRepo(repoInput);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const { owner, repo } = validation;

  try {
    // 2. Fetch Repository Data from GitHub REST API
    const repoData = await getCompleteRepoData(owner, repo);

    // 3. Score and Evaluate Readiness
    const auditReport = evaluateRepository(repoData);

    // 4. Return Structured JSON
    return res.status(200).json({
      success: true,
      repository: {
        id: repoData.metadata.id,
        name: repoData.metadata.name,
        fullName: repoData.metadata.full_name,
        owner: {
          login: repoData.metadata.owner?.login,
          avatarUrl: repoData.metadata.owner?.avatar_url,
          htmlUrl: repoData.metadata.owner?.html_url,
        },
        description: repoData.metadata.description,
        htmlUrl: repoData.metadata.html_url,
        homepage: repoData.metadata.homepage,
        defaultBranch: repoData.metadata.default_branch,
        language: repoData.metadata.language,
        stars: repoData.metadata.stargazers_count,
        forks: repoData.metadata.forks_count,
        openIssues: repoData.metadata.open_issues_count,
        topics: repoData.metadata.topics || [],
        isArchived: repoData.metadata.archived,
        isFork: repoData.metadata.fork,
        createdAt: repoData.metadata.created_at,
        updatedAt: repoData.metadata.updated_at,
        pushedAt: repoData.metadata.pushed_at,
      },
      audit: {
        score: auditReport.score,
        maxScore: auditReport.maxScore,
        grade: auditReport.grade,
        gradeLabel: auditReport.gradeLabel,
        gradeColor: auditReport.gradeColor,
        projectType: auditReport.projectType,
        metrics: auditReport.metrics,
        passedChecksCount: auditReport.passedChecksCount,
        totalChecksCount: auditReport.totalChecksCount,
        categories: auditReport.categories,
        checks: auditReport.checks,
        recommendations: auditReport.recommendations,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    const statusCode = err.status || 500;
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'An unexpected error occurred while analyzing the repository.',
      statusCode,
    });
  }
});

module.exports = router;
