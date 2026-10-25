/**
 * Advanced Scoring & Recommendation Engine for RepoPilot.
 * Evaluates repository health, documentation depth, automated testing signals,
 * and community standards on a 0-100 scale with rich actionable recommendations.
 */

const {
  detectProjectType,
  getCiTemplate,
  getTestTemplate,
  getLicenseTemplate,
  getContributingTemplate,
  getCodeOfConductTemplate,
  getSecurityTemplate,
  getPrTemplate,
  getGitignoreTemplate,
  getReadmeTemplate,
} = require('./templateGenerator');

// Weighted scoring rules definition
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
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  if (boundedScore >= 90) return { grade: 'A+', label: 'Exemplary - Portfolio Ready', color: '#3fb950' };
  if (boundedScore >= 80) return { grade: 'A', label: 'Strong - Well Documented', color: '#2ea043' };
  if (boundedScore >= 70) return { grade: 'B', label: 'Good - Minor Improvements Needed', color: '#58a6ff' };
  if (boundedScore >= 55) return { grade: 'C', label: 'Fair - Missing Key Standards', color: '#d29922' };
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
 * Detects testing signals across multiple languages and configurations.
 */
function detectTestingSignals(rootItems = [], packageJson = null, projectType = { type: 'general' }) {
  const fileNames = rootItems.map(i => i.name.toLowerCase());

  // 1. Check directory naming across ecosystems
  const testDirectory = rootItems.find(i => 
    i.type === 'dir' && /^(tests?|__tests__|spec|specs|cypress|e2e)$/i.test(i.name)
  );
  if (testDirectory) {
    return {
      detected: true,
      evidence: `Found test directory "${testDirectory.name}/" in repository root.`,
      framework: 'Test Directory',
    };
  }

  // 2. Check root test files across ecosystems
  const testFile = rootItems.find(i =>
    i.type === 'file' && /(\.(test|spec)\.[a-z0-9]+$|^test_.*\.py$|_test\.py$|_test\.go$)/i.test(i.name)
  );
  if (testFile) {
    return {
      detected: true,
      evidence: `Found automated test file "${testFile.name}".`,
      framework: 'Test File',
    };
  }

  // 3. Ecosystem-specific configuration files
  const testConfig = rootItems.find(i =>
    /^(jest\.config|vitest\.config|pytest\.ini|tox\.ini|\.mocharc|cypress\.config|playwright\.config|phpunit\.xml|\.rspec|conftest\.py|noxfile\.py|setup\.cfg|test-requirements\.txt|requirements-dev\.txt|requirements_dev\.txt)/i.test(i.name)
  );
  if (testConfig) {
    return {
      detected: true,
      evidence: `Found test configuration or fixture file "${testConfig.name}".`,
      framework: testConfig.name.split('.')[0],
    };
  }

  // 4. Node.js deep package.json inspection
  if (packageJson) {
    // Check package.json scripts.test
    const testScript = packageJson.scripts?.test;
    const isDefaultNpmError = testScript && testScript.includes('Error: no test specified');
    if (testScript && !isDefaultNpmError && testScript.trim() !== '') {
      return {
        detected: true,
        evidence: `package.json specifies an active test runner: "npm test" -> "${testScript}".`,
        framework: 'npm test script',
      };
    }

    // Check devDependencies / dependencies for test libraries
    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };
    const testPackages = [
      'jest', 'vitest', 'mocha', 'chai', 'ava', 'jasmine', 'cypress',
      'playwright', '@playwright/test', 'supertest', '@testing-library/react',
      '@testing-library/vue', 'tap', 'uvu', 'c8', 'nyc',
    ];
    const foundPkg = testPackages.find(pkg => allDeps[pkg]);
    if (foundPkg) {
      return {
        detected: true,
        evidence: `Detected test framework "${foundPkg}" in package.json dependencies.`,
        framework: foundPkg,
      };
    }
  }

  // 5. Rust Cargo inspection
  if (fileNames.includes('cargo.toml')) {
    const hasSrc = rootItems.some(i => i.name.toLowerCase() === 'src' && i.type === 'dir');
    if (hasSrc || fileNames.includes('tests')) {
      return {
        detected: true,
        evidence: 'Rust Cargo project with standard test layout (cargo test).',
        framework: 'Cargo test',
      };
    }
  }

  // 6. Java/Kotlin Maven or Gradle
  if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle') || fileNames.includes('build.gradle.kts')) {
    const hasSrc = rootItems.some(i => i.name.toLowerCase() === 'src' && i.type === 'dir');
    if (hasSrc) {
      return {
        detected: true,
        evidence: 'Java/Kotlin project with standard build file and source directory structure.',
        framework: 'Maven/Gradle',
      };
    }
  }

  // 7. Go module
  if (fileNames.includes('go.mod')) {
    const hasGoFiles = rootItems.some(i => i.name.endsWith('.go'));
    if (hasGoFiles) {
      return {
        detected: true,
        evidence: 'Go module project with standard go test structure.',
        framework: 'go test',
      };
    }
  }

  return {
    detected: false,
    evidence: `No automated test files, test directories, or test runner configurations detected for ${projectType.language}.`,
    framework: null,
  };
}

/**
 * Evaluates repository data and returns an accurate, transparent audit report.
 */
function evaluateRepository({ metadata = {}, rootItems = [], workflows = [], dotGithubContents = [], packageJson = null }) {
  const checks = [];
  const recommendations = [];

  const allSearchable = [...rootItems, ...dotGithubContents];
  const projectType = detectProjectType(metadata, rootItems, packageJson);
  const repoName = metadata.name || 'Repository';
  const ownerName = metadata.owner?.login || 'Maintainer';

  // =========================================================================
  // 1. Core Documentation Category (35 pts max)
  // =========================================================================

  // Check 1: README Presence (10 pts)
  const readmeItem = findItem(rootItems, /^readme(\.(md|markdown|txt|rst))?$/i);
  if (readmeItem) {
    checks.push({
      ...SCORING_RULES.README_PRESENCE,
      earnedScore: 10,
      status: 'pass',
      passed: true,
      finding: `Found "${readmeItem.name}" in root directory.`,
      scoreExplanation: 'Full points (+10 / 10): Found recognized README file in root directory.',
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.README_PRESENCE,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No README file detected in the root directory.',
      scoreExplanation: '0 / 10 points: Missing foundational README file.',
      deductionReason: 'README file not found in root.',
    });

    const readmeTemplate = getReadmeTemplate(repoName, metadata.description);
    recommendations.push({
      id: 'rec_readme_presence',
      title: 'Add a README.md to your repository root',
      priority: 'high',
      category: 'Documentation',
      estimatedEffort: '15 mins',
      evidence: 'No README.md, README.markdown, or README.rst found in root directory.',
      why: 'A README is the front door of your project. Recruiters, interviewers, and open-source contributors expect immediate context on what the project does, its architecture, and setup instructions.',
      recommendedFix: 'Create a structured README.md in the root directory detailing the project overview, features, tech stack, installation steps, and usage guide.',
      filePath: readmeTemplate.filePath,
      starterTemplate: readmeTemplate.template,
      verificationCondition: 'Add a README.md file in the root directory containing project overview and quickstart instructions.',
    });
  }

  // Check 2: README Depth & Quality (10 pts)
  // Non-overlapping rule: If README is missing, score 0 with clear explanation and do NOT duplicate recommendation.
  if (readmeItem) {
    const size = typeof readmeItem.size === 'number' ? readmeItem.size : null;
    if (size === null) {
      checks.push({
        ...SCORING_RULES.README_DEPTH,
        earnedScore: 0,
        status: 'unable_to_verify',
        passed: false,
        finding: `Found "${readmeItem.name}", but file byte size was not provided by directory metadata.`,
        scoreExplanation: '0 / 10 points: Unable to verify documentation depth automatically.',
        deductionReason: 'File size metadata unavailable.',
      });
    } else if (size >= 400) {
      checks.push({
        ...SCORING_RULES.README_DEPTH,
        earnedScore: 10,
        status: 'pass',
        passed: true,
        finding: `README documentation is substantial (${size} bytes).`,
        scoreExplanation: 'Full points (+10 / 10): README exceeds 400 bytes with comprehensive documentation.',
        deductionReason: null,
      });
    } else if (size >= 150) {
      checks.push({
        ...SCORING_RULES.README_DEPTH,
        earnedScore: 6,
        status: 'needs_improvement',
        passed: false,
        finding: `README is relatively short (${size} bytes) and may lack installation or architecture guidance.`,
        scoreExplanation: 'Partial points (+6 / 10): README is present but brief (-4 pts for brevity).',
        deductionReason: 'README is under 400 bytes and lacks detailed sections.',
      });
      const readmeTemplate = getReadmeTemplate(repoName, metadata.description);
      recommendations.push({
        id: 'rec_readme_depth',
        title: 'Expand your README with setup, architecture, and usage sections',
        priority: 'medium',
        category: 'Documentation',
        estimatedEffort: '15 mins',
        evidence: `Current README is only ${size} bytes, which is below the recommended 400-byte depth for portfolio projects.`,
        why: 'Engineering recruiters look for prerequisites, setup commands, architecture diagrams, and testing guides to gauge your technical communication.',
        recommendedFix: 'Add dedicated sections for Architecture, Tech Stack, Prerequisites, Installation Commands, and API/Usage examples.',
        filePath: 'README.md',
        starterTemplate: readmeTemplate.template,
        verificationCondition: 'Expand README.md to at least 400 bytes with installation commands and usage examples.',
      });
    } else {
      checks.push({
        ...SCORING_RULES.README_DEPTH,
        earnedScore: 2,
        status: 'needs_improvement',
        passed: false,
        finding: `README is very minimal (${size} bytes) and appears to be an unconfigured title placeholder.`,
        scoreExplanation: 'Minimal points (+2 / 10): README appears to be a stub or default title only (-8 pts).',
        deductionReason: 'README is under 150 bytes with virtually no instructions.',
      });
      const readmeTemplate = getReadmeTemplate(repoName, metadata.description);
      recommendations.push({
        id: 'rec_readme_depth',
        title: 'Flesh out your placeholder README',
        priority: 'high',
        category: 'Documentation',
        estimatedEffort: '15 mins',
        evidence: `README has only ${size} bytes of content.`,
        why: 'A placeholder README gives interviewers the impression of an unfinished project.',
        recommendedFix: 'Replace the placeholder with a structured overview, installation steps, and demo links.',
        filePath: 'README.md',
        starterTemplate: readmeTemplate.template,
        verificationCondition: 'Replace single-line placeholder with project overview and local run instructions.',
      });
    }
  } else {
    // README is missing: 0 points, dependent check, no duplicate recommendation
    checks.push({
      ...SCORING_RULES.README_DEPTH,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'Cannot evaluate documentation depth because README.md is missing.',
      scoreExplanation: '0 / 10 points: Dependent on README file creation.',
      deductionReason: 'README must be created before depth can be evaluated.',
    });
  }

  // Check 3: Repository Description (10 pts)
  const description = metadata.description ? metadata.description.trim() : '';
  if (description && description.length >= 10) {
    checks.push({
      ...SCORING_RULES.DESCRIPTION,
      earnedScore: 10,
      status: 'pass',
      passed: true,
      finding: `Repository description is set: "${description}".`,
      scoreExplanation: 'Full points (+10 / 10): Meaningful repository description provided on GitHub.',
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.DESCRIPTION,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: description ? 'Repository description is too brief (< 10 characters).' : 'Repository has no description set on GitHub.',
      scoreExplanation: '0 / 10 points: Missing or insufficient GitHub repository description.',
      deductionReason: 'Description is either empty or under 10 characters.',
    });
    recommendations.push({
      id: 'rec_repo_description',
      title: 'Set a concise GitHub repository description',
      priority: 'medium',
      category: 'Documentation',
      estimatedEffort: '5 mins',
      evidence: description ? `Description is only "${description}" (${description.length} chars).` : 'No description provided in GitHub repository "About" settings.',
      why: 'Recruiters and search engines rely on repository descriptions in preview cards, search results, and portfolio showcases.',
      recommendedFix: 'Open your repository on GitHub, click the gear icon next to "About", and write a clear 1-2 sentence overview of the project and its value.',
      filePath: 'GitHub Repository Settings -> About',
      starterTemplate: `${repoName}: A modern, high-performance application built with ${projectType.language} to solve real-world problems.`,
      verificationCondition: 'Add a description with at least 10 characters in your repository About section.',
    });
  }

  // Check 4: Open-Source License (5 pts)
  const hasSpdxLicense = Boolean(
    metadata.license && (
      (metadata.license.key && metadata.license.key !== 'other') ||
      (metadata.license.spdx_id && metadata.license.spdx_id !== 'NOASSERTION') ||
      metadata.license.name
    )
  );
  const licenseFile = findItem(rootItems, /^(licen[sc]e|copying|unlicense)([-_.][a-z0-9]+)*$/i);
  if (hasSpdxLicense || licenseFile) {
    const licenseName = metadata.license?.name || metadata.license?.spdx_id || (licenseFile ? licenseFile.name : 'Open Source License');
    checks.push({
      ...SCORING_RULES.LICENSE,
      earnedScore: 5,
      status: 'pass',
      passed: true,
      finding: `License detected (${licenseName}).`,
      scoreExplanation: `Full points (+5 / 5): Recognized open-source license (${licenseName}).`,
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.LICENSE,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No open-source license detected in root or GitHub metadata.',
      scoreExplanation: '0 / 5 points: No open-source LICENSE file found.',
      deductionReason: 'Missing open-source license file.',
    });
    const licenseTemplate = getLicenseTemplate(ownerName);
    recommendations.push({
      id: 'rec_license',
      title: 'Add an open-source LICENSE file (e.g., MIT)',
      priority: 'medium',
      category: 'Documentation',
      estimatedEffort: '5 mins',
      evidence: 'No LICENSE, LICENCE, COPYING, or recognized open-source terms detected.',
      why: 'Without a license, default copyright laws apply, meaning other developers and recruiters cannot legally run, fork, or use your code.',
      recommendedFix: 'Add a standard permissive MIT License file in your repository root.',
      filePath: licenseTemplate.filePath,
      starterTemplate: licenseTemplate.template,
      verificationCondition: 'Add a LICENSE file containing recognized open-source terms in your repository root.',
    });
  }

  // =========================================================================
  // 2. Code Health & Testing Category (25 pts max)
  // =========================================================================

  // Check 5: Automated Testing Signals (15 pts)
  const testSignals = detectTestingSignals(rootItems, packageJson, projectType);
  if (testSignals.detected) {
    checks.push({
      ...SCORING_RULES.TESTS,
      earnedScore: 15,
      status: 'pass',
      passed: true,
      finding: testSignals.evidence,
      scoreExplanation: `Full points (+15 / 15): ${testSignals.evidence}`,
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.TESTS,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: testSignals.evidence,
      scoreExplanation: '0 / 15 points: No automated test files, test directories, or test scripts found.',
      deductionReason: `No test suite signals found for ${projectType.language}.`,
    });
    const testTemplate = getTestTemplate(projectType);
    recommendations.push({
      id: 'rec_automated_tests',
      title: `Add automated tests for ${projectType.language}`,
      priority: 'high',
      category: 'Code Health',
      estimatedEffort: '30 mins',
      evidence: `Repository is identified as ${projectType.language}, but lacks automated test files or test runner configuration.`,
      why: 'Writing automated tests proves software engineering rigor, prevents regressions, and distinguishes strong candidates from junior hobbyists in technical interviews.',
      recommendedFix: `Set up a standard test runner for ${projectType.language} and add sample unit tests.`,
      filePath: testTemplate.filePath,
      starterTemplate: testTemplate.template,
      verificationCondition: `Create at least one automated test file in ${testTemplate.filePath} and verify it runs cleanly.`,
    });
  }

  // Check 6: .gitignore (10 pts)
  const gitignoreFile = findItem(rootItems, /^\.gitignore$/i);
  if (gitignoreFile) {
    checks.push({
      ...SCORING_RULES.GITIGNORE,
      earnedScore: 10,
      status: 'pass',
      passed: true,
      finding: '.gitignore file is present in root directory.',
      scoreExplanation: 'Full points (+10 / 10): .gitignore file protects against committing secrets and build artifacts.',
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.GITIGNORE,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No .gitignore file found in the root directory.',
      scoreExplanation: '0 / 10 points: Missing .gitignore file.',
      deductionReason: '.gitignore file is missing.',
    });
    const gitignoreTemplate = getGitignoreTemplate(projectType);
    recommendations.push({
      id: 'rec_gitignore',
      title: `Add a .gitignore file tailored to ${projectType.language}`,
      priority: 'high',
      category: 'Code Health',
      estimatedEffort: '5 mins',
      evidence: 'No .gitignore file found in repository root.',
      why: 'A .gitignore file prevents accidental leaks of secret API keys, local credentials, and bulky build outputs into public Git commit history.',
      recommendedFix: `Create a .gitignore file configured for ${projectType.language} to ignore dependencies, build artifacts, and .env files.`,
      filePath: gitignoreTemplate.filePath,
      starterTemplate: gitignoreTemplate.template,
      verificationCondition: 'Add a .gitignore file in the root ignoring node_modules, build directories, and .env files.',
    });
  }

  // =========================================================================
  // 3. Automation & CI/CD Category (20 pts max)
  // =========================================================================

  // Check 7: CI/CD Workflows (20 pts)
  const validWorkflows = Array.isArray(workflows)
    ? workflows.filter(w => 
        w && 
        w.name && 
        (!w.type || w.type === 'file') && 
        /\.(ya?ml)$/i.test(w.name) &&
        (!w.path || w.path.startsWith('.github/workflows/'))
      )
    : null;
  const hasGithubWorkflows = Boolean(validWorkflows && validWorkflows.length > 0);

  const altCiItem = rootItems.find(i => {
    if (!i || !i.name) return false;
    const name = i.name.toLowerCase();
    if (name === '.circleci') return !i.type || i.type === 'dir';
    if (i.type && i.type !== 'file') return false;
    return (
      /^\.(travis|gitlab-ci|appveyor)\.ya?ml$/i.test(name) ||
      /^(azure-pipelines|bitbucket-pipelines)\.ya?ml$/i.test(name) ||
      /^jenkinsfile$/i.test(name)
    );
  });

  if (hasGithubWorkflows) {
    const workflowNames = validWorkflows.map(w => w.name).join(', ');
    checks.push({
      ...SCORING_RULES.CI_CD,
      earnedScore: 20,
      status: 'pass',
      passed: true,
      finding: `Found ${validWorkflows.length} GitHub Actions workflow(s): ${workflowNames}.`,
      scoreExplanation: `Full points (+20 / 20): Found ${validWorkflows.length} GitHub Actions workflow(s) in .github/workflows/.`,
      deductionReason: null,
    });
  } else if (altCiItem) {
    checks.push({
      ...SCORING_RULES.CI_CD,
      earnedScore: 20,
      status: 'pass',
      passed: true,
      finding: `Found recognized alternative CI/CD configuration: "${altCiItem.name}".`,
      scoreExplanation: `Full points (+20 / 20): Active CI/CD configuration detected via "${altCiItem.name}".`,
      deductionReason: null,
    });
  } else if (workflows === null) {
    checks.push({
      ...SCORING_RULES.CI_CD,
      earnedScore: 0,
      status: 'unable_to_verify',
      passed: false,
      finding: 'Unable to verify .github/workflows directory due to API limitations or permissions.',
      scoreExplanation: '0 / 20 points: CI/CD workflow presence could not be verified.',
      deductionReason: 'Workflow directory could not be inspected.',
    });
  } else {
    checks.push({
      ...SCORING_RULES.CI_CD,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No GitHub Actions workflows or equivalent CI configurations detected.',
      scoreExplanation: '0 / 20 points: No automated CI/CD workflows detected.',
      deductionReason: 'Missing .github/workflows directory or active YAML pipelines.',
    });
    const ciTemplate = getCiTemplate(projectType, rootItems, packageJson);

    let evidence = 'No .github/workflows directory or YAML workflows detected.';
    let recommendedFix = `Create a GitHub Actions workflow in ${ciTemplate.filePath} that runs on push and pull_request events.`;

    if (projectType.type === 'node') {
      const pmLabel = ciTemplate.pmName === 'pnpm'
        ? (ciTemplate.hasPnpmLock ? 'pnpm (with pnpm-lock.yaml)' : 'pnpm (declared in package.json)')
        : ciTemplate.pmName === 'yarn'
        ? (ciTemplate.hasYarnLock ? 'Yarn (with yarn.lock)' : 'Yarn (declared in package.json)')
        : ciTemplate.hasPackageLock
        ? 'npm (with package-lock.json)'
        : 'npm (no lockfile detected)';

      const testEvidence = ciTemplate.hasValidTestScript
        ? `test command in package.json ("npm test" -> "${packageJson?.scripts?.test}")`
        : 'no automated test script configured in package.json';

      const buildEvidence = ciTemplate.hasBuildScript
        ? `build script in package.json ("${packageJson?.scripts?.build}")`
        : 'no build script in package.json';

      evidence = `No .github/workflows directory or active YAML workflows detected. Repository is a ${projectType.language} project using ${pmLabel}. Found ${testEvidence} and ${buildEvidence}.`;

      const stepsDesc = [
        `installs dependencies via "${ciTemplate.installCmd}"`,
        ciTemplate.hasValidTestScript ? `runs tests via "${ciTemplate.pmName} test"` : null,
        ciTemplate.hasBuildScript ? `runs the production build via "${ciTemplate.pmName === 'yarn' ? 'yarn build' : `${ciTemplate.pmName} run build`}"` : null,
      ].filter(Boolean).join(', ');

      recommendedFix = `Create a GitHub Actions workflow at ${ciTemplate.filePath} configured for Node.js 20 that runs on pushes and pull requests to main/master, ${stepsDesc}.`;
    }

    recommendations.push({
      id: 'rec_ci_workflow',
      title: `Set up Continuous Integration (GitHub Actions) for ${projectType.language}`,
      priority: 'high',
      category: 'Automation',
      estimatedEffort: '15 mins',
      evidence,
      why: 'Continuous Integration demonstrates to hiring managers and recruiters that your code builds cleanly, dependencies resolve, and automated tests run automatically on every pull request.',
      recommendedFix,
      filePath: ciTemplate.filePath,
      starterTemplate: ciTemplate.template,
      verificationCondition: `Add a workflow in ${ciTemplate.filePath} that checks out code, installs dependencies, and runs tests.`,
    });
  }

  // =========================================================================
  // 4. Community & Contribution Standards Category (20 pts max)
  // =========================================================================

  // Check 8: CONTRIBUTING.md (8 pts)
  const contributing = findItem(allSearchable, /^contributing(\.(md|markdown|txt))?$/i);
  if (contributing) {
    checks.push({
      ...SCORING_RULES.CONTRIBUTING,
      earnedScore: 8,
      status: 'pass',
      passed: true,
      finding: `Found "${contributing.name}".`,
      scoreExplanation: 'Full points (+8 / 8): Contribution guide present.',
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.CONTRIBUTING,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No CONTRIBUTING.md guide detected in root or .github folder.',
      scoreExplanation: '0 / 8 points: Missing contribution guidelines.',
      deductionReason: 'CONTRIBUTING.md not found.',
    });
    const contributingTemplate = getContributingTemplate(repoName);
    recommendations.push({
      id: 'rec_contributing_guide',
      title: 'Add a CONTRIBUTING.md guide',
      priority: 'medium',
      category: 'Community',
      estimatedEffort: '10 mins',
      evidence: 'No CONTRIBUTING.md detected in root or .github directory.',
      why: 'A contribution guide demonstrates open-source readiness, branch management discipline, and clean PR expectations.',
      recommendedFix: 'Add a CONTRIBUTING.md detailing branch naming conventions, pull request expectations, and local development setup.',
      filePath: contributingTemplate.filePath,
      starterTemplate: contributingTemplate.template,
      verificationCondition: 'Add CONTRIBUTING.md in root or .github directory detailing PR steps.',
    });
  }

  // Check 9: CODE_OF_CONDUCT.md (5 pts)
  const conduct = findItem(allSearchable, /^code_of_conduct(\.(md|markdown|txt))?$/i);
  if (conduct) {
    checks.push({
      ...SCORING_RULES.CODE_OF_CONDUCT,
      earnedScore: 5,
      status: 'pass',
      passed: true,
      finding: `Found "${conduct.name}".`,
      scoreExplanation: 'Full points (+5 / 5): Code of Conduct present.',
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.CODE_OF_CONDUCT,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No CODE_OF_CONDUCT.md detected in root or .github folder.',
      scoreExplanation: '0 / 5 points: Missing Code of Conduct.',
      deductionReason: 'CODE_OF_CONDUCT.md not found.',
    });
    const conductTemplate = getCodeOfConductTemplate();
    recommendations.push({
      id: 'rec_code_of_conduct',
      title: 'Add a CODE_OF_CONDUCT.md file',
      priority: 'low',
      category: 'Community',
      estimatedEffort: '5 mins',
      evidence: 'No CODE_OF_CONDUCT.md detected.',
      why: 'A Code of Conduct fosters inclusive collaboration and demonstrates professional standards for open-source software.',
      recommendedFix: 'Adopt the industry-standard Contributor Covenant (v2.1) and commit it as CODE_OF_CONDUCT.md.',
      filePath: conductTemplate.filePath,
      starterTemplate: conductTemplate.template,
      verificationCondition: 'Add CODE_OF_CONDUCT.md in root or .github directory.',
    });
  }

  // Check 10: Issue & PR Templates (4 pts)
  const templateFound = allSearchable.some(item => 
    /issue_template/i.test(item.name) || 
    /pull_request_template/i.test(item.name)
  );
  if (templateFound) {
    checks.push({
      ...SCORING_RULES.TEMPLATES,
      earnedScore: 4,
      status: 'pass',
      passed: true,
      finding: 'Issue or Pull Request templates detected in repository.',
      scoreExplanation: 'Full points (+4 / 4): Templates found for issue/PR standardization.',
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.TEMPLATES,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No issue or pull request templates found.',
      scoreExplanation: '0 / 4 points: Missing issue or pull request templates.',
      deductionReason: 'No issue or PR templates found in .github or root.',
    });
    const prTemplate = getPrTemplate();
    recommendations.push({
      id: 'rec_issue_pr_templates',
      title: 'Add a Pull Request Template',
      priority: 'low',
      category: 'Community',
      estimatedEffort: '5 mins',
      evidence: 'No .github/pull_request_template.md or issue templates detected.',
      why: 'PR templates streamline code reviews and enforce self-checklists for testing and documentation.',
      recommendedFix: 'Create a `.github/pull_request_template.md` file with a concise checklist.',
      filePath: prTemplate.filePath,
      starterTemplate: prTemplate.template,
      verificationCondition: 'Add .github/pull_request_template.md with review checklist.',
    });
  }

  // Check 11: Security Policy (3 pts)
  const security = findItem(allSearchable, /^security(\.(md|markdown|txt))?$/i);
  if (security) {
    checks.push({
      ...SCORING_RULES.SECURITY,
      earnedScore: 3,
      status: 'pass',
      passed: true,
      finding: `Found "${security.name}".`,
      scoreExplanation: 'Full points (+3 / 3): Security vulnerability disclosure policy present.',
      deductionReason: null,
    });
  } else {
    checks.push({
      ...SCORING_RULES.SECURITY,
      earnedScore: 0,
      status: 'needs_improvement',
      passed: false,
      finding: 'No SECURITY.md policy detected in root or .github folder.',
      scoreExplanation: '0 / 3 points: Missing security policy.',
      deductionReason: 'SECURITY.md not found.',
    });
    const securityTemplate = getSecurityTemplate();
    recommendations.push({
      id: 'rec_security_policy',
      title: 'Add a SECURITY.md vulnerability reporting policy',
      priority: 'low',
      category: 'Community',
      estimatedEffort: '5 mins',
      evidence: 'No SECURITY.md detected in root or .github directory.',
      why: 'A security policy informs security researchers and enterprise users how to privately disclose vulnerabilities.',
      recommendedFix: 'Create a SECURITY.md explaining supported versions and a private reporting contact email.',
      filePath: securityTemplate.filePath,
      starterTemplate: securityTemplate.template,
      verificationCondition: 'Add SECURITY.md in root or .github directory detailing private reporting email.',
    });
  }

  // =========================================================================
  // Aggregate Scores, Categories, and Health Metrics
  // =========================================================================

  const totalScore = Math.max(0, Math.min(100, checks.reduce((sum, c) => sum + c.earnedScore, 0)));
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

  const passedChecksCount = checks.filter(c => c.status === 'pass').length;
  const needsImprovementCount = checks.filter(c => c.status === 'needs_improvement').length;
  const unableToVerifyCount = checks.filter(c => c.status === 'unable_to_verify').length;

  // Deduplicate recommendations by id as an explicit safeguard
  const uniqueRecsMap = new Map();
  for (const r of recommendations) {
    if (!uniqueRecsMap.has(r.id)) {
      uniqueRecsMap.set(r.id, { ...r, action: r.action || r.recommendedFix });
    }
  }
  const uniqueRecommendations = Array.from(uniqueRecsMap.values());

  const highPriorityCount = uniqueRecommendations.filter(r => r.priority === 'high').length;
  const mediumPriorityCount = uniqueRecommendations.filter(r => r.priority === 'medium').length;
  const lowPriorityCount = uniqueRecommendations.filter(r => r.priority === 'low').length;

  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    grade,
    gradeLabel,
    gradeColor,
    projectType,
    metrics: {
      passedChecksCount,
      needsImprovementCount,
      unableToVerifyCount,
      totalChecksCount: checks.length,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      totalRecommendations: uniqueRecommendations.length,
    },
    passedChecksCount, // kept for backward compatibility
    totalChecksCount: checks.length,
    categories,
    checks,
    recommendations: uniqueRecommendations,
  };
}

module.exports = {
  SCORING_RULES,
  evaluateRepository,
  calculateGrade,
  detectTestingSignals,
};
