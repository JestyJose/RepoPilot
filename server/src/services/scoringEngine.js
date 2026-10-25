/**
 * Scoring Engine for RepoPilot.
 * Evaluates repository health, documentation, testing, and community standards on a 0-100 scale.
 */

// Weights definition
const SCORING_RULES = {
  README_PRESENCE: { id: 'readme_presence', name: 'README File Existence', maxScore: 10, category: 'Documentation', importance: 'critical' },
  README_DEPTH: { id: 'readme_depth', name: 'README Documentation Depth', maxScore: 10, category: 'Documentation', importance: 'high' },
  DESCRIPTION: { id: 'repo_description', name: 'Repository Description', maxScore: 10, category: 'Documentation', importance: 'medium' },
  LICENSE: { id: 'license', name: 'Open-Source License', maxScore: 5, category: 'Documentation', importance: 'high' },
  
  TESTS: { id: 'automated_tests', name: 'Automated Testing Signals', maxScore: 15, category: 'Code Health', importance: 'critical' },
  GITIGNORE: { id: 'gitignore', name: '.gitignore Configuration', maxScore: 10, category: 'Code Health', importance: 'high' },

  CI_CD: { id: 'ci_workflow', name: 'CI/CD Workflows', maxScore: 20, category: 'Automation', importance: 'critical' },

  CONTRIBUTING: { id: 'contributing_guide', name: 'Contribution Guide (CONTRIBUTING.md)', maxScore: 8, category: 'Community', importance: 'medium' },
  CODE_OF_CONDUCT: { id: 'code_of_conduct', name: 'Code of Conduct (CODE_OF_CONDUCT.md)', maxScore: 5, category: 'Community', importance: 'low' },
  TEMPLATES: { id: 'issue_pr_templates', name: 'Issue & PR Templates', maxScore: 4, category: 'Community', importance: 'low' },
  SECURITY: { id: 'security_policy', name: 'Security Policy (SECURITY.md)', maxScore: 3, category: 'Community', importance: 'low' },
};

/**
 * Calculates grade and label from total score.
 */
function calculateGrade(score) {
  if (score >= 90) return { grade: 'A+', label: 'Exemplary - Portfolio Ready', color: '#3fb950' };
  if (score >= 80) return { grade: 'A', label: 'Strong - Well Documented', color: '#2ea043' };
  if (score >= 70) return { grade: 'B', label: 'Good - Minor Improvements Needed', color: '#58a6ff' };
  if (score >= 55) return { grade: 'C', label: 'Fair - Missing Key Standards', color: '#d29922' };
  return { grade: 'Needs Work', label: 'Needs Significant Attention', color: '#f85149' };
}

/**
 * Helper to find item in root list by regex
 */
function findItem(items, pattern, type = null) {
  return items.find(item => {
    const matchesName = pattern.test(item.name);
    return type ? matchesName && item.type === type : matchesName;
  });
}

/**
 * Evaluates repository data and returns a comprehensive readiness report.
 */
function evaluateRepository({ metadata, rootItems = [], workflows = [], dotGithubContents = [] }) {
  const checks = [];
  const recommendations = [];

  // Combine root + .github items for community search
  const allSearchable = [...rootItems, ...dotGithubContents];

  // 1. README Existence
  const readmeItem = findItem(rootItems, /^readme(\.(md|markdown|txt|rst))?$/i);
  if (readmeItem) {
    checks.push({
      ...SCORING_RULES.README_PRESENCE,
      earnedScore: 10,
      passed: true,
      finding: `Found "${readmeItem.name}" in root directory.`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.README_PRESENCE,
      earnedScore: 0,
      passed: false,
      finding: 'No README file detected in the root directory.',
    });
    recommendations.push({
      priority: 'high',
      checkId: 'readme_presence',
      title: 'Add a README.md to your repository root',
      why: 'A README is the front door of your project. Recruiters and contributors expect immediate context on what the project does and how to run it.',
      action: 'Create a README.md detailing the project overview, features, tech stack, installation steps, and usage guide.',
    });
  }

  // 2. README Depth / Quality Signal
  if (readmeItem) {
    const size = readmeItem.size || 0;
    if (size >= 400) {
      checks.push({
        ...SCORING_RULES.README_DEPTH,
        earnedScore: 10,
        passed: true,
        finding: `README documentation is substantial (${size} bytes).`,
      });
    } else if (size >= 150) {
      checks.push({
        ...SCORING_RULES.README_DEPTH,
        earnedScore: 6,
        passed: false,
        finding: `README is relatively short (${size} bytes) and may lack installation or architecture guidance.`,
      });
      recommendations.push({
        priority: 'medium',
        checkId: 'readme_depth',
        title: 'Expand your README with installation and architecture details',
        why: 'Recruiters and engineers look for setup guides, screenshots, architecture diagrams, and usage examples.',
        action: 'Add Prerequisites, Quickstart commands, Tech Stack, and Environment Variable documentation.',
      });
    } else {
      checks.push({
        ...SCORING_RULES.README_DEPTH,
        earnedScore: 2,
        passed: false,
        finding: `README is very minimal (${size} bytes) and appears to be an unconfigured placeholder.`,
      });
      recommendations.push({
        priority: 'high',
        checkId: 'readme_depth',
        title: 'Flesh out your placeholder README',
        why: 'A minimal placeholder leaves reviewers with no idea how to evaluate your code.',
        action: 'Replace the placeholder with a structured overview, installation steps, and demo links.',
      });
    }
  } else {
    checks.push({
      ...SCORING_RULES.README_DEPTH,
      earnedScore: 0,
      passed: false,
      finding: 'Cannot evaluate documentation depth because README is missing.',
    });
  }

  // 3. Repository Description
  const description = metadata.description ? metadata.description.trim() : '';
  if (description && description.length >= 10) {
    checks.push({
      ...SCORING_RULES.DESCRIPTION,
      earnedScore: 10,
      passed: true,
      finding: `Repository description is set: "${description}".`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.DESCRIPTION,
      earnedScore: 0,
      passed: false,
      finding: description ? 'Repository description is too brief (< 10 characters).' : 'Repository has no description set on GitHub.',
    });
    recommendations.push({
      priority: 'medium',
      checkId: 'repo_description',
      title: 'Set a concise GitHub repository description',
      why: 'Recruiters and search engines rely on repository descriptions in preview cards and portfolio showcases.',
      action: 'Click the gear icon next to "About" on your repository page and write a clear 1-sentence summary.',
    });
  }

  // 4. License
  const hasSpdxLicense = Boolean(metadata.license && metadata.license.key && metadata.license.key !== 'other');
  const licenseFile = findItem(rootItems, /^license(\.(md|txt))?$/i);
  if (hasSpdxLicense || licenseFile) {
    const licenseName = metadata.license ? metadata.license.name : licenseFile.name;
    checks.push({
      ...SCORING_RULES.LICENSE,
      earnedScore: 5,
      passed: true,
      finding: `License detected (${licenseName}).`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.LICENSE,
      earnedScore: 0,
      passed: false,
      finding: 'No open-source license detected.',
    });
    recommendations.push({
      priority: 'medium',
      checkId: 'license',
      title: 'Add an open-source LICENSE file (e.g., MIT, Apache-2.0)',
      why: 'Without a license, default copyright laws apply, meaning other developers cannot legally use or contribute to your project.',
      action: 'Add a LICENSE file in the root. For most portfolio projects, the permissive MIT License is recommended.',
    });
  }

  // 5. Automated Testing Signals
  const testDirectory = findItem(rootItems, /^(tests?|__tests__|spec)$/i, 'dir');
  const testFiles = findItem(rootItems, /\.(test|spec)\.[a-z0-9]+$/i, 'file');
  const testConfigFiles = findItem(rootItems, /^(jest\.config|vitest\.config|pytest\.ini|\.mocharc)/i);
  
  if (testDirectory || testFiles || testConfigFiles) {
    const signalName = testDirectory ? `directory "${testDirectory.name}/"` : testFiles ? `file "${testFiles.name}"` : `config "${testConfigFiles.name}"`;
    checks.push({
      ...SCORING_RULES.TESTS,
      earnedScore: 15,
      passed: true,
      finding: `Automated test suite detected via ${signalName}.`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.TESTS,
      earnedScore: 0,
      passed: false,
      finding: 'No automated tests or test configurations detected in root directory.',
    });
    recommendations.push({
      priority: 'high',
      checkId: 'automated_tests',
      title: 'Add automated tests (unit/integration)',
      why: 'Writing tests distinguishes junior developers from software engineers who build resilient, production-ready software.',
      action: 'Set up a test runner (e.g., Jest, Vitest, PyTest, or Go test) and add a test directory with basic test coverage.',
    });
  }

  // 6. .gitignore
  const gitignoreFile = findItem(rootItems, /^\.gitignore$/i);
  if (gitignoreFile) {
    checks.push({
      ...SCORING_RULES.GITIGNORE,
      earnedScore: 10,
      passed: true,
      finding: '.gitignore file is present.',
    });
  } else {
    checks.push({
      ...SCORING_RULES.GITIGNORE,
      earnedScore: 0,
      passed: false,
      finding: 'No .gitignore file found in the root directory.',
    });
    recommendations.push({
      priority: 'high',
      checkId: 'gitignore',
      title: 'Add a .gitignore file',
      why: 'A .gitignore file prevents accidental leakage of API keys, local credentials, and bulky build artifacts into Git history.',
      action: 'Create a .gitignore tailored to your tech stack (ignoring node_modules, .env, dist, etc.).',
    });
  }

  // 7. CI/CD Workflows
  if (workflows.length > 0) {
    const workflowNames = workflows.map(w => w.name).join(', ');
    checks.push({
      ...SCORING_RULES.CI_CD,
      earnedScore: 20,
      passed: true,
      finding: `Found ${workflows.length} GitHub Actions workflow(s): ${workflowNames}.`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.CI_CD,
      earnedScore: 0,
      passed: false,
      finding: 'No GitHub Actions workflows found in .github/workflows.',
    });
    recommendations.push({
      priority: 'high',
      checkId: 'ci_workflow',
      title: 'Set up Continuous Integration (GitHub Actions)',
      why: 'CI proves that your project builds cleanly and tests pass on every push. It is one of the highest-value signals on an internship portfolio.',
      action: 'Add a `.github/workflows/ci.yml` workflow to automatically build and run tests on pull requests.',
    });
  }

  // 8. CONTRIBUTING.md
  const contributing = findItem(allSearchable, /^contributing(\.(md|markdown|txt))?$/i);
  if (contributing) {
    checks.push({
      ...SCORING_RULES.CONTRIBUTING,
      earnedScore: 8,
      passed: true,
      finding: `Found "${contributing.name}".`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.CONTRIBUTING,
      earnedScore: 0,
      passed: false,
      finding: 'No CONTRIBUTING.md guide detected.',
    });
    recommendations.push({
      priority: 'medium',
      checkId: 'contributing_guide',
      title: 'Add a CONTRIBUTING.md guide',
      why: 'A contribution guide demonstrates open-source readiness and makes onboarding other contributors frictionless.',
      action: 'Add a CONTRIBUTING.md explaining branch naming, pull request expectations, and local dev setup.',
    });
  }

  // 9. CODE_OF_CONDUCT.md
  const conduct = findItem(allSearchable, /^code_of_conduct(\.(md|markdown|txt))?$/i);
  if (conduct) {
    checks.push({
      ...SCORING_RULES.CODE_OF_CONDUCT,
      earnedScore: 5,
      passed: true,
      finding: `Found "${conduct.name}".`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.CODE_OF_CONDUCT,
      earnedScore: 0,
      passed: false,
      finding: 'No CODE_OF_CONDUCT.md detected.',
    });
    recommendations.push({
      priority: 'low',
      checkId: 'code_of_conduct',
      title: 'Add a CODE_OF_CONDUCT.md',
      why: 'A code of conduct establishes community standards and demonstrates professionalism in collaborative environments.',
      action: 'Adopt the standard Contributor Covenant (v2.1) and commit it as CODE_OF_CONDUCT.md.',
    });
  }

  // 10. Issue & PR Templates
  const templateFound = allSearchable.some(item => 
    /issue_template/i.test(item.name) || 
    /pull_request_template/i.test(item.name)
  );
  if (templateFound) {
    checks.push({
      ...SCORING_RULES.TEMPLATES,
      earnedScore: 4,
      passed: true,
      finding: 'Issue or Pull Request templates detected.',
    });
  } else {
    checks.push({
      ...SCORING_RULES.TEMPLATES,
      earnedScore: 0,
      passed: false,
      finding: 'No issue or pull request templates found.',
    });
    recommendations.push({
      priority: 'low',
      checkId: 'issue_pr_templates',
      title: 'Add GitHub Issue and PR Templates',
      why: 'Templates standardize bug reports, feature requests, and code review checklists.',
      action: 'Create `.github/ISSUE_TEMPLATE/` with bug_report.md and `.github/pull_request_template.md`.',
    });
  }

  // 11. Security Policy
  const security = findItem(allSearchable, /^security(\.(md|markdown|txt))?$/i);
  if (security) {
    checks.push({
      ...SCORING_RULES.SECURITY,
      earnedScore: 3,
      passed: true,
      finding: `Found "${security.name}".`,
    });
  } else {
    checks.push({
      ...SCORING_RULES.SECURITY,
      earnedScore: 0,
      passed: false,
      finding: 'No SECURITY.md policy detected.',
    });
    recommendations.push({
      priority: 'low',
      checkId: 'security_policy',
      title: 'Add a SECURITY.md vulnerability policy',
      why: 'A security policy informs users and security researchers how to report security vulnerabilities privately.',
      action: 'Add a SECURITY.md file explaining supported versions and a private contact email for reporting security issues.',
    });
  }

  // Compute total score & category aggregates
  const totalScore = checks.reduce((sum, c) => sum + c.earnedScore, 0);
  const maxPossibleScore = checks.reduce((sum, c) => sum + c.maxScore, 0);

  const categories = {};
  for (const check of checks) {
    if (!categories[check.category]) {
      categories[check.category] = { earned: 0, max: 0, percentage: 0 };
    }
    categories[check.category].earned += check.earnedScore;
    categories[check.category].max += check.maxScore;
  }
  for (const cat of Object.keys(categories)) {
    categories[cat].percentage = Math.round((categories[cat].earned / categories[cat].max) * 100);
  }

  const { grade, label: gradeLabel, color: gradeColor } = calculateGrade(totalScore);

  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    grade,
    gradeLabel,
    gradeColor,
    passedChecksCount: checks.filter(c => c.passed).length,
    totalChecksCount: checks.length,
    categories,
    checks,
    recommendations,
  };
}

module.exports = {
  SCORING_RULES,
  evaluateRepository,
  calculateGrade,
};
