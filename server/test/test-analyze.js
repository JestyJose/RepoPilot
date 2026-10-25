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
    assert.strictEqual(depthCheck.passed, false);
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
