/**
 * Automated test suite for RepoPilot Phase 2:
 * 1. Repo Validator tests
 * 2. Scoring Engine unit tests with mocked repo profiles
 * 3. Live API endpoint integration tests (Valid, Invalid, Nonexistent)
 */

const assert = require('assert');
const http = require('http');
const express = require('express');
const cors = require('cors');

const { parseAndValidateRepo } = require('../src/utils/repoValidator');
const { evaluateRepository, calculateGrade } = require('../src/services/scoringEngine');
const analyzeRoutes = require('../src/routes/analyzeRoutes');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function startTestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', analyzeRoutes);

  return new Promise((resolve) => {
    // Port 5055 for isolated testing so it won't conflict with any active dev servers
    const server = app.listen(5055, () => {
      resolve(server);
    });
  });
}

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5055${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n=============================================');
  console.log('   RepoPilot Phase 2 - Verification Suite   ');
  console.log('=============================================\n');

  // ----------------------------------------------------
  // Suite 1: Input Validator Tests
  // ----------------------------------------------------
  console.log('Test Suite 1: Repository Input Validator');

  runTest('Validates simple "owner/repo" shorthand', () => {
    const res = parseAndValidateRepo('expressjs/express');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.owner, 'expressjs');
    assert.strictEqual(res.repo, 'express');
  });

  runTest('Validates full HTTPS GitHub URL', () => {
    const res = parseAndValidateRepo('https://github.com/facebook/react');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.owner, 'facebook');
    assert.strictEqual(res.repo, 'react');
  });

  runTest('Strips trailing slashes and .git extensions', () => {
    const res = parseAndValidateRepo('https://github.com/vercel/next.js.git/');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.owner, 'vercel');
    assert.strictEqual(res.repo, 'next.js');
  });

  runTest('Rejects empty or non-string input', () => {
    const res = parseAndValidateRepo('');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /required/i);
  });

  runTest('Rejects malformed input without owner/repo format', () => {
    const res = parseAndValidateRepo('justareponame');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /invalid repository format/i);
  });

  // ----------------------------------------------------
  // Suite 2: Scoring Engine Unit Tests
  // ----------------------------------------------------
  console.log('\nTest Suite 2: Scoring Engine Unit Tests');

  runTest('Awards 100 points and A+ grade for complete repository', () => {
    const mockRepo = {
      metadata: {
        description: 'A robust and modern web framework for Node.js.',
        license: { key: 'mit', name: 'MIT License' },
      },
      rootItems: [
        { name: 'README.md', type: 'file', size: 1200 },
        { name: 'LICENSE', type: 'file' },
        { name: '.gitignore', type: 'file' },
        { name: 'test', type: 'dir' },
        { name: 'CONTRIBUTING.md', type: 'file' },
        { name: 'CODE_OF_CONDUCT.md', type: 'file' },
        { name: 'SECURITY.md', type: 'file' },
        { name: 'pull_request_template.md', type: 'file' },
      ],
      workflows: [{ name: 'ci.yml' }],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(mockRepo);
    assert.strictEqual(audit.score, 100);
    assert.strictEqual(audit.grade, 'A+');
    assert.strictEqual(audit.recommendations.length, 0);
  });

  runTest('Penalizes missing documentation and provides actionable recommendations', () => {
    const poorRepo = {
      metadata: { description: '' }, // Missing description
      rootItems: [], // Missing README, license, tests, .gitignore, etc.
      workflows: [], // Missing CI/CD
      dotGithubContents: [],
    };

    const audit = evaluateRepository(poorRepo);
    assert.strictEqual(audit.score, 0);
    assert.strictEqual(audit.grade, 'Needs Work');
    assert.ok(audit.recommendations.length > 5, 'Should generate multiple prioritized recommendations');

    // Verify recommendations structure
    const firstRec = audit.recommendations[0];
    assert.ok(firstRec.priority);
    assert.ok(firstRec.title);
    assert.ok(firstRec.why);
    assert.ok(firstRec.action);
  });

  runTest('Scores partial points for short/placeholder README', () => {
    const shortReadmeRepo = {
      metadata: { description: 'A test project with brief README' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 180 }, // Short README between 150-399 bytes
      ],
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(shortReadmeRepo);
    const depthCheck = audit.checks.find(c => c.id === 'readme_depth');
    assert.strictEqual(depthCheck.earnedScore, 6);
    assert.strictEqual(depthCheck.status, 'needs_improvement');
    assert.strictEqual(depthCheck.passed, false);
  });

  runTest('Recognizes Node.js testing via package.json scripts and dependencies without test/ directory', () => {
    const nodeRepo = {
      metadata: { language: 'JavaScript', description: 'Node API project' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' },
      ],
      packageJson: {
        name: 'sample-api',
        scripts: { test: 'vitest run' },
        devDependencies: { vitest: '^1.0.0' },
      },
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(nodeRepo);
    const testCheck = audit.checks.find(c => c.id === 'automated_tests');
    assert.strictEqual(testCheck.status, 'pass');
    assert.strictEqual(testCheck.earnedScore, 15);
    assert.match(testCheck.finding, /vitest/i);
  });

  runTest('Recognizes Python testing signals and provides Python-tailored templates', () => {
    const pythonRepo = {
      metadata: { language: 'Python', description: 'Data science toolkit' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 500 },
        { name: 'requirements.txt', type: 'file' },
        { name: 'pytest.ini', type: 'file' },
      ],
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(pythonRepo);
    const testCheck = audit.checks.find(c => c.id === 'automated_tests');
    assert.strictEqual(testCheck.status, 'pass');
    assert.strictEqual(testCheck.earnedScore, 15);

    // Check that CI recommendation is tailored to Python
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);
    assert.match(ciRec.starterTemplate, /actions\/setup-python/i);
    assert.match(ciRec.starterTemplate, /pytest/i);
  });

  runTest('Prevents duplicate recommendations when README is missing', () => {
    const noReadmeRepo = {
      metadata: { description: 'A project with no README' },
      rootItems: [
        { name: 'LICENSE', type: 'file' },
      ],
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(noReadmeRepo);
    // Should have rec_readme_presence, but NOT duplicate rec_readme_depth
    const readmePresenceRec = audit.recommendations.filter(r => r.id === 'rec_readme_presence');
    const readmeDepthRec = audit.recommendations.filter(r => r.id === 'rec_readme_depth');
    assert.strictEqual(readmePresenceRec.length, 1);
    assert.strictEqual(readmeDepthRec.length, 0, 'Should not generate redundant depth recommendation when README is missing');
  });

  runTest('Validates rich recommendation card schema across all generated recommendations', () => {
    const emptyRepo = {
      metadata: { description: '' },
      rootItems: [],
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(emptyRepo);
    assert.ok(audit.recommendations.length > 0);

    for (const rec of audit.recommendations) {
      assert.ok(rec.id, 'Recommendation must have an id');
      assert.ok(rec.title, 'Recommendation must have a title');
      assert.ok(rec.priority, 'Recommendation must have a priority');
      assert.ok(['high', 'medium', 'low'].includes(rec.priority));
      assert.ok(rec.category, 'Recommendation must have a category');
      assert.ok(rec.estimatedEffort, 'Recommendation must have estimatedEffort');
      assert.ok(rec.evidence, 'Recommendation must have evidence');
      assert.ok(rec.why, 'Recommendation must have why');
      assert.ok(rec.recommendedFix, 'Recommendation must have recommendedFix');
      assert.ok(rec.action, 'Recommendation must have action alias');
      assert.ok(rec.filePath, 'Recommendation must have filePath');
      assert.ok(rec.starterTemplate, 'Recommendation must have starterTemplate');
      assert.ok(rec.verificationCondition, 'Recommendation must have verificationCondition');
    }
  });

  runTest('Quality Audit 1: JavaScript project (Express.js profile) recognizes tests, license, and CI', () => {
    const expressProfile = {
      metadata: {
        name: 'express',
        full_name: 'expressjs/express',
        description: 'Fast, unopinionated, minimalist web framework for node.',
        language: 'JavaScript',
        license: { key: 'mit', name: 'MIT License' },
      },
      rootItems: [
        { name: 'Readme.md', type: 'file', size: 5400 },
        { name: 'LICENSE', type: 'file' },
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' },
        { name: 'test', type: 'dir' },
      ],
      packageJson: {
        name: 'express',
        scripts: { test: 'mocha --require test/support/env --reporter spec test/' },
        devDependencies: { mocha: '10.2.0' },
      },
      workflows: [{ name: 'ci.yml' }],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(expressProfile);
    assert.strictEqual(audit.projectType.language, 'JavaScript');
    assert.ok(audit.score >= 80, `Expected score >= 80, got ${audit.score}`);
    
    // Check license recognized
    const licenseCheck = audit.checks.find(c => c.id === 'license');
    assert.strictEqual(licenseCheck.status, 'pass');
    assert.strictEqual(licenseCheck.earnedScore, 5);

    // Check tests recognized
    const testCheck = audit.checks.find(c => c.id === 'automated_tests');
    assert.strictEqual(testCheck.status, 'pass');
    assert.strictEqual(testCheck.earnedScore, 15);

    // Check CI recognized
    const ciCheck = audit.checks.find(c => c.id === 'ci_workflow');
    assert.strictEqual(ciCheck.status, 'pass');
    assert.strictEqual(ciCheck.earnedScore, 20);

    // Check no duplicate recommendations
    const recIds = audit.recommendations.map(r => r.id);
    const uniqueIds = new Set(recIds);
    assert.strictEqual(recIds.length, uniqueIds.size, 'All recommendation IDs must be unique');
  });

  runTest('Quality Audit 2: Python project (Flask profile) recognizes LICENSE.txt, tests, and conftest.py', () => {
    const flaskProfile = {
      metadata: {
        name: 'flask',
        full_name: 'pallets/flask',
        description: 'The Python micro framework for building web applications.',
        language: 'Python',
        license: { key: 'bsd-3-clause', name: 'BSD 3-Clause License' },
      },
      rootItems: [
        { name: 'README.md', type: 'file', size: 2800 },
        { name: 'LICENSE.txt', type: 'file' }, // Extension .txt
        { name: 'pyproject.toml', type: 'file' },
        { name: '.gitignore', type: 'file' },
        { name: 'tests', type: 'dir' },
        { name: 'conftest.py', type: 'file' },
        { name: 'CONTRIBUTING.rst', type: 'file' },
      ],
      packageJson: null,
      workflows: [{ name: 'tests.yaml' }, { name: 'publish.yaml' }],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(flaskProfile);
    assert.strictEqual(audit.projectType.language, 'Python');
    
    // License recognized
    const licenseCheck = audit.checks.find(c => c.id === 'license');
    assert.strictEqual(licenseCheck.status, 'pass');
    assert.strictEqual(licenseCheck.earnedScore, 5);

    // Tests recognized via tests/ directory & conftest.py
    const testCheck = audit.checks.find(c => c.id === 'automated_tests');
    assert.strictEqual(testCheck.status, 'pass');
    assert.strictEqual(testCheck.earnedScore, 15);

    // Workflows recognized via tests.yaml
    const ciCheck = audit.checks.find(c => c.id === 'ci_workflow');
    assert.strictEqual(ciCheck.status, 'pass');
    assert.strictEqual(ciCheck.earnedScore, 20);
  });

  runTest('Quality Audit 3: Open-Source project with dual license and alternative CI recognizes both', () => {
    const ossProfile = {
      metadata: {
        name: 'tokio',
        full_name: 'tokio-rs/tokio',
        description: 'A runtime for writing reliable, asynchronous, and slim applications with the Rust programming language.',
        language: 'Rust',
        license: { key: 'other', name: 'MIT OR Apache-2.0' },
      },
      rootItems: [
        { name: 'README.md', type: 'file', size: 4500 },
        { name: 'LICENSE-MIT', type: 'file' },
        { name: 'LICENSE-APACHE', type: 'file' },
        { name: 'Cargo.toml', type: 'file' },
        { name: 'src', type: 'dir' },
        { name: 'tests', type: 'dir' },
        { name: '.gitignore', type: 'file' },
        { name: '.circleci', type: 'dir' }, // CircleCI alternative CI
        { name: 'CONTRIBUTING.md', type: 'file' },
        { name: 'CODE_OF_CONDUCT.md', type: 'file' },
        { name: 'SECURITY.md', type: 'file' },
      ],
      packageJson: null,
      workflows: [], // No GitHub Actions, but has .circleci
      dotGithubContents: [],
    };

    const audit = evaluateRepository(ossProfile);
    assert.strictEqual(audit.projectType.language, 'Rust');

    // Dual license recognized
    const licenseCheck = audit.checks.find(c => c.id === 'license');
    assert.strictEqual(licenseCheck.status, 'pass');
    assert.strictEqual(licenseCheck.earnedScore, 5);

    // Alternative CI recognized without false missing report
    const ciCheck = audit.checks.find(c => c.id === 'ci_workflow');
    assert.strictEqual(ciCheck.status, 'pass');
    assert.strictEqual(ciCheck.earnedScore, 20);
    assert.match(ciCheck.finding, /circleci/i);
  });

  runTest('Handles unable_to_verify state cleanly for missing size or uninspected workflows', () => {
    const unverifiedProfile = {
      metadata: { description: 'Project with unverified file size' },
      rootItems: [
        { name: 'README.md', type: 'file' }, // Size is missing/undefined
        { name: 'LICENSE', type: 'file' },
        { name: '.gitignore', type: 'file' },
      ],
      packageJson: null,
      workflows: null, // Workflow directory could not be inspected
      dotGithubContents: [],
    };

    const audit = evaluateRepository(unverifiedProfile);
    const depthCheck = audit.checks.find(c => c.id === 'readme_depth');
    assert.strictEqual(depthCheck.status, 'unable_to_verify');
    assert.strictEqual(depthCheck.earnedScore, 0);

    const ciCheck = audit.checks.find(c => c.id === 'ci_workflow');
    assert.strictEqual(ciCheck.status, 'unable_to_verify');
    assert.strictEqual(ciCheck.earnedScore, 0);

    assert.ok(audit.metrics.unableToVerifyCount >= 2);
  });

  runTest('Generates tailored CI workflow with npm ci, npm test, and npm run build for JS project with package-lock.json and scripts', () => {
    const jsProject = {
      metadata: { language: 'JavaScript', description: 'Web application' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'package-lock.json', type: 'file' },
        { name: '.gitignore', type: 'file' },
      ],
      packageJson: {
        name: 'my-app',
        scripts: {
          test: 'jest --ci',
          build: 'vite build',
        },
      },
      workflows: [], // Missing CI
      dotGithubContents: [],
    };

    const audit = evaluateRepository(jsProject);
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec, 'Should recommend CI workflow');

    // Evidence checks
    assert.match(ciRec.evidence, /package-lock\.json/i);
    assert.match(ciRec.evidence, /jest --ci/i);
    assert.match(ciRec.evidence, /vite build/i);

    // Starter template checks
    assert.match(ciRec.starterTemplate, /run: npm ci/);
    assert.match(ciRec.starterTemplate, /cache: 'npm'/);
    assert.match(ciRec.starterTemplate, /run: npm test/);
    assert.match(ciRec.starterTemplate, /run: npm run build/);
    assert.match(ciRec.starterTemplate, /push:/);
    assert.match(ciRec.starterTemplate, /pull_request:/);
  });

  runTest('Uses npm install without cache when package-lock.json is absent', () => {
    const noLockProject = {
      metadata: { language: 'JavaScript', description: 'Node script project' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: '.gitignore', type: 'file' },
      ],
      packageJson: {
        name: 'script-app',
        scripts: { test: 'node test.js' },
      },
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(noLockProject);
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);

    // Should use npm install (not npm ci) because package-lock.json is absent
    assert.match(ciRec.starterTemplate, /run: npm install/);
    assert.doesNotMatch(ciRec.starterTemplate, /run: npm ci/);
  });

  runTest('Omits active failing test and build commands when scripts are absent in package.json', () => {
    const noScriptsProject = {
      metadata: { language: 'JavaScript', description: 'Vanilla library' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'package-lock.json', type: 'file' },
      ],
      packageJson: {
        name: 'simple-lib',
        scripts: {}, // No test or build scripts
      },
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(noScriptsProject);
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);

    // Must not include an active npm test or npm run build command
    assert.doesNotMatch(ciRec.starterTemplate, /\n      - name: Run automated tests/);
    assert.doesNotMatch(ciRec.starterTemplate, /\n      - name: Verify production build/);
    // Mentions commented placeholder for test
    assert.match(ciRec.starterTemplate, /# - name: Run automated tests/);
  });

  runTest('Never recommends a duplicate CI workflow when GitHub Actions workflows already exist', () => {
    const activeCiProject = {
      metadata: { language: 'JavaScript', description: 'Active CI project' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'package-lock.json', type: 'file' },
      ],
      packageJson: {
        name: 'active-ci',
        scripts: { test: 'jest' },
      },
      workflows: [{ name: 'ci.yml' }], // Already has CI workflow
      dotGithubContents: [],
    };

    const audit = evaluateRepository(activeCiProject);
    const ciCheck = audit.checks.find(c => c.id === 'ci_workflow');
    assert.strictEqual(ciCheck.status, 'pass');
    assert.strictEqual(ciCheck.earnedScore, 20);

    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.strictEqual(ciRec, undefined, 'Must not generate a CI recommendation when suitable CI exists');
  });

  runTest('Generates tailored CI workflow for Yarn projects with yarn.lock, yarn test, and yarn build', () => {
    const yarnProject = {
      metadata: { language: 'JavaScript', description: 'Yarn monorepo app' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'yarn.lock', type: 'file' },
      ],
      packageJson: {
        name: 'yarn-app',
        scripts: { test: 'jest', build: 'webpack' },
      },
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(yarnProject);
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);

    // Verify Yarn commands in starter template
    assert.match(ciRec.starterTemplate, /run: yarn install --frozen-lockfile/);
    assert.match(ciRec.starterTemplate, /cache: 'yarn'/);
    assert.match(ciRec.starterTemplate, /run: yarn test/);
    assert.match(ciRec.starterTemplate, /run: yarn build/);
    assert.match(ciRec.evidence, /Yarn \(with yarn\.lock\)/i);
  });

  runTest('Generates tailored CI workflow for pnpm projects with pnpm-lock.yaml, setup-pnpm, and pnpm run build', () => {
    const pnpmProject = {
      metadata: { language: 'JavaScript', description: 'pnpm web app' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'pnpm-lock.yaml', type: 'file' },
      ],
      packageJson: {
        name: 'pnpm-app',
        scripts: { test: 'vitest', build: 'vite build' },
      },
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(pnpmProject);
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);

    // Verify pnpm setup and commands in starter template
    assert.match(ciRec.starterTemplate, /uses: pnpm\/action-setup@v3/);
    assert.match(ciRec.starterTemplate, /cache: 'pnpm'/);
    assert.match(ciRec.starterTemplate, /run: pnpm install --frozen-lockfile/);
    assert.match(ciRec.starterTemplate, /run: pnpm test/);
    assert.match(ciRec.starterTemplate, /run: pnpm run build/);
    assert.match(ciRec.evidence, /pnpm \(with pnpm-lock\.yaml\)/i);
  });

  runTest('Does not mark CI as passing for non-YAML workflow files or directory falses', () => {
    const invalidCiProject = {
      metadata: { language: 'JavaScript', description: 'Invalid CI project' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'azure-pipelines.yml', type: 'dir' }, // Directory with CI filename (unsuitable)
        { name: 'not-a-travis.yml', type: 'file' },   // Unsuitable filename
      ],
      packageJson: {
        name: 'test-app',
        scripts: { test: 'jest' },
      },
      workflows: [{ name: 'README.md' }, { name: '.DS_Store' }], // Non-YAML files in workflows
      dotGithubContents: [],
    };

    const audit = evaluateRepository(invalidCiProject);
    const ciCheck = audit.checks.find(c => c.id === 'ci_workflow');
    assert.strictEqual(ciCheck.status, 'needs_improvement', 'Must not pass CI check for non-YAML workflows or folder mismatches');
    assert.strictEqual(ciCheck.earnedScore, 0);

    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec, 'Must generate CI recommendation when suitable CI is absent');
  });

  runTest('Rejects workflow items with paths outside .github/workflows/', () => {
    const wrongPathProject = {
      metadata: { language: 'JavaScript', description: 'Misplaced workflow project' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
      ],
      packageJson: { name: 'app' },
      workflows: [
        { name: 'ci.yml', path: 'scripts/ci.yml' }, // Not inside .github/workflows/
        { name: 'build.yaml', type: 'dir' },        // Directory with YAML extension
      ],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(wrongPathProject);
    const ciCheck = audit.checks.find(c => c.id === 'ci_workflow');
    assert.strictEqual(ciCheck.status, 'needs_improvement');
    assert.strictEqual(ciCheck.earnedScore, 0);

    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);
  });

  runTest('Resolves multiple lockfiles with documented precedence (pnpm over npm when pnpm-lock.yaml is present)', () => {
    const multiLockProject = {
      metadata: { language: 'JavaScript', description: 'Migrated to pnpm' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'package-lock.json', type: 'file' }, // Leftover from previous npm setup
        { name: 'pnpm-lock.yaml', type: 'file' },    // Active pnpm lockfile
      ],
      packageJson: {
        name: 'pnpm-migrated',
        scripts: { test: 'vitest', build: 'vite build' },
      },
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(multiLockProject);
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);

    // Must choose pnpm, not npm ci
    assert.match(ciRec.starterTemplate, /run: pnpm install --frozen-lockfile/);
    assert.doesNotMatch(ciRec.starterTemplate, /run: npm ci/);
    assert.match(ciRec.starterTemplate, /run: pnpm test/);
    assert.match(ciRec.starterTemplate, /run: pnpm run build/);
  });

  runTest('Respects explicit packageManager field in package.json over lockfiles', () => {
    const explicitPmProject = {
      metadata: { language: 'JavaScript', description: 'Explicit packageManager declaration' },
      rootItems: [
        { name: 'README.md', type: 'file', size: 600 },
        { name: 'package.json', type: 'file' },
        { name: 'package-lock.json', type: 'file' },
        { name: 'pnpm-lock.yaml', type: 'file' },
      ],
      packageJson: {
        name: 'npm-override',
        packageManager: 'npm@10.8.0', // Explicit declaration by maintainer
        scripts: { test: 'jest', build: 'webpack' },
      },
      workflows: [],
      dotGithubContents: [],
    };

    const audit = evaluateRepository(explicitPmProject);
    const ciRec = audit.recommendations.find(r => r.id === 'rec_ci_workflow');
    assert.ok(ciRec);

    // Follows explicit declaration
    assert.match(ciRec.starterTemplate, /run: npm ci/);
    assert.match(ciRec.starterTemplate, /run: npm test/);
    assert.match(ciRec.starterTemplate, /run: npm run build/);
  });

  // ----------------------------------------------------
  // Suite 3: HTTP API Endpoint Integration Tests
  // ----------------------------------------------------
  console.log('\nTest Suite 3: HTTP API Integration Tests (Isolated Port 5055)');

  const server = await startTestServer();

  try {
    await runAsyncTest('GET /api/analyze returns 400 for malformed repo query', async () => {
      const response = await makeRequest('/api/analyze?repo=invalid_no_slash');
      assert.strictEqual(response.statusCode, 400);
      assert.strictEqual(response.body.success, false);
      assert.match(response.body.error, /invalid repository format/i);
    });

    await runAsyncTest('GET /api/analyze returns 404 for nonexistent repository', async () => {
      const response = await makeRequest('/api/analyze?repo=repopilot-testing-nonexistent/repo-does-not-exist-999');
      if (response.statusCode === 429) {
        console.log('    ℹ GitHub rate limit reached; verified rate limit response format.');
        assert.match(response.body.error, /rate limit/i);
        return;
      }
      assert.strictEqual(response.statusCode, 404);
      assert.strictEqual(response.body.success, false);
      assert.match(response.body.error, /not found/i);
    });

    await runAsyncTest('GET /api/analyze returns 200 with structured audit for a real public repo', async () => {
      // Analyze a well-known public repo (expressjs/express)
      const response = await makeRequest('/api/analyze?repo=expressjs/express');
      
      // If unauthenticated rate limit was hit, accept 429 gracefully with verified error message
      if (response.statusCode === 429) {
        console.log('    ℹ GitHub rate limit reached; verified rate limit response format.');
        assert.match(response.body.error, /rate limit/i);
        return;
      }

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body.success, true);
      
      // Verify repository fields
      assert.strictEqual(response.body.repository.name, 'express');
      assert.strictEqual(response.body.repository.fullName, 'expressjs/express');
      assert.ok(response.body.repository.stars > 1000);

      // Verify audit fields
      const { audit } = response.body;
      assert.ok(typeof audit.score === 'number');
      assert.ok(audit.score >= 0 && audit.score <= 100);
      assert.ok(audit.grade);
      assert.ok(audit.gradeLabel);
      assert.ok(Array.isArray(audit.checks));
      assert.ok(audit.checks.length >= 10);
      assert.ok(typeof audit.categories === 'object');
      assert.ok(Array.isArray(audit.recommendations));
    });
  } finally {
    server.close();
  }

  console.log('\n=============================================');
  console.log(`Results: ${passedTests}/${totalTests} tests passed successfully!`);
  console.log('=============================================\n');
}

main().catch(err => {
  console.error('\nTest execution failed:', err);
  process.exit(1);
});
