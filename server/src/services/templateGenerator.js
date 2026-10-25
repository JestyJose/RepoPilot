/**
 * Starter template generator for RepoPilot.
 * Generates tailored copy-paste templates based on repository language and project type.
 */

function detectProjectType(metadata = {}, rootItems = [], packageJson = null) {
  const lang = (metadata.language || '').toLowerCase();
  const fileNames = rootItems.map(i => i.name.toLowerCase());

  if (fileNames.includes('package.json') || lang.includes('javascript') || lang.includes('typescript')) {
    const isTS = fileNames.includes('tsconfig.json') || lang.includes('typescript');
    return { type: 'node', language: isTS ? 'TypeScript' : 'JavaScript', isTS };
  }

  if (fileNames.includes('requirements.txt') || fileNames.includes('pyproject.toml') || fileNames.includes('setup.py') || lang === 'python') {
    return { type: 'python', language: 'Python' };
  }

  if (fileNames.includes('go.mod') || lang === 'go') {
    return { type: 'go', language: 'Go' };
  }

  if (fileNames.includes('cargo.toml') || lang === 'rust') {
    return { type: 'rust', language: 'Rust' };
  }

  if (fileNames.includes('pom.xml') || fileNames.includes('build.gradle') || lang === 'java' || lang === 'kotlin') {
    return { type: 'java', language: 'Java' };
  }

  return { type: 'general', language: metadata.language || 'General' };
}

function getCiTemplate(projectType, rootItems = [], packageJson = null) {
  switch (projectType.type) {
    case 'node': {
      const fileNames = (rootItems || []).map(i => (i.name || '').toLowerCase());
      const hasPackageLock = fileNames.includes('package-lock.json');
      const hasYarnLock = fileNames.includes('yarn.lock');
      const hasPnpmLock = fileNames.includes('pnpm-lock.yaml');

      // Sensible, documented Package Manager Precedence:
      // 1. Explicit maintainer declaration: package.json "packageManager" (e.g. "pnpm@9.0.0", "yarn@4.0.0", "npm@10.0.0").
      // 2. Lockfile specificity (when multiple lockfiles exist):
      //    a. pnpm-lock.yaml -> pnpm (pnpm projects require pnpm content-addressable storage; old package-lock.json is often migration artifact).
      //    b. yarn.lock -> yarn.
      //    c. package-lock.json -> npm.
      // 3. Fallback: npm install (no lockfile cache assumptions).
      const pmField = (packageJson?.packageManager || '').toLowerCase();
      let chosenPm = null;

      if (pmField.startsWith('pnpm')) {
        chosenPm = 'pnpm';
      } else if (pmField.startsWith('yarn')) {
        chosenPm = 'yarn';
      } else if (pmField.startsWith('npm')) {
        chosenPm = 'npm';
      } else if (hasPnpmLock) {
        chosenPm = 'pnpm';
      } else if (hasYarnLock) {
        chosenPm = 'yarn';
      } else if (hasPackageLock) {
        chosenPm = 'npm';
      } else {
        chosenPm = 'npm-no-lock';
      }

      let pmName = 'npm';
      let installCmd = 'npm install';
      let cacheConfig = '';
      let preStep = '';

      if (chosenPm === 'pnpm') {
        pmName = 'pnpm';
        installCmd = hasPnpmLock ? 'pnpm install --frozen-lockfile' : 'pnpm install';
        cacheConfig = "\n          cache: 'pnpm'";
        preStep = `      - name: Set up pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9\n\n`;
      } else if (chosenPm === 'yarn') {
        pmName = 'yarn';
        installCmd = hasYarnLock ? 'yarn install --frozen-lockfile' : 'yarn install';
        cacheConfig = "\n          cache: 'yarn'";
      } else if (chosenPm === 'npm') {
        pmName = 'npm';
        installCmd = hasPackageLock ? 'npm ci' : 'npm install';
        cacheConfig = hasPackageLock ? "\n          cache: 'npm'" : '';
      } else {
        pmName = 'npm';
        installCmd = 'npm install';
        cacheConfig = '';
      }

      // Check for test script in package.json
      const testScript = packageJson?.scripts?.test;
      const isDefaultNpmError = typeof testScript === 'string' && testScript.includes('Error: no test specified');
      const hasValidTestScript = Boolean(testScript && !isDefaultNpmError && testScript.trim() !== '');

      let testStep = '';
      if (hasValidTestScript) {
        const testCmd = pmName === 'yarn' ? 'yarn test' : `${pmName} test`;
        testStep = `\n\n      - name: Run automated tests\n        run: ${testCmd}`;
      } else {
        testStep = `\n\n      # Automated tests not detected in package.json. Run tests when configured:\n      # - name: Run automated tests\n      #   run: ${pmName} test`;
      }

      // Check for build script in package.json
      const buildScript = packageJson?.scripts?.build;
      const hasBuildScript = Boolean(buildScript && typeof buildScript === 'string' && buildScript.trim() !== '');

      let buildStep = '';
      if (hasBuildScript) {
        const buildCmd = pmName === 'yarn' ? 'yarn build' : `${pmName} run build`;
        buildStep = `\n\n      - name: Verify production build\n        run: ${buildCmd}`;
      }

      return {
        filePath: '.github/workflows/ci.yml',
        hasValidTestScript,
        hasBuildScript,
        hasPackageLock,
        hasYarnLock,
        hasPnpmLock,
        pmName,
        installCmd,
        template: `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

${preStep}      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20${cacheConfig}

      - name: Install dependencies
        run: ${installCmd}${testStep}${buildStep}
`,
      };
    }

    case 'python':
      return {
        filePath: '.github/workflows/ci.yml',
        template: `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest

      - name: Run automated tests
        run: pytest
`,
      };

    case 'go':
      return {
        filePath: '.github/workflows/ci.yml',
        template: `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Run tests with coverage
        run: go test -v -race -covermode=atomic ./...
`,
      };

    default:
      return {
        filePath: '.github/workflows/ci.yml',
        template: `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Run sanity check
        run: echo "Repository checked out successfully"
`,
      };
  }
}

function getTestTemplate(projectType) {
  switch (projectType.type) {
    case 'node':
      return {
        filePath: 'test/sample.test.js',
        template: `// Sample automated test for Node.js
// Compatible with Vitest, Jest, or Node test runner

describe('Application Core', () => {
  it('should pass basic sanity check', () => {
    expect(1 + 1).toBe(2);
  });

  it('should validate inputs correctly', () => {
    const isValid = (input) => typeof input === 'string' && input.length > 0;
    expect(isValid('RepoPilot')).toBe(true);
    expect(isValid('')).toBe(false);
  });
});
`,
      };

    case 'python':
      return {
        filePath: 'tests/test_main.py',
        template: `"""Sample automated test suite for Pytest / Unittest."""

def test_sanity_check():
    assert 1 + 1 == 2

def test_string_formatting():
    name = "RepoPilot"
    assert f"Hello, {name}" == "Hello, RepoPilot"
`,
      };

    case 'go':
      return {
        filePath: 'main_test.go',
        template: `package main

import "testing"

func TestSanity(t *testing.T) {
    expected := 4
    actual := 2 + 2
    if actual != expected {
        t.Errorf("Expected %d, got %d", expected, actual)
    }
}
`,
      };

    default:
      return {
        filePath: 'test/sample_test.txt',
        template: `# Automated Test Placeholder
Add automated unit or integration tests using your framework of choice.
`,
      };
  }
}

function getLicenseTemplate(ownerName = 'Your Name') {
  const year = new Date().getFullYear();
  return {
    filePath: 'LICENSE',
    template: `MIT License

Copyright (c) ${year} ${ownerName}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  };
}

function getContributingTemplate(repoName = 'Project') {
  return {
    filePath: 'CONTRIBUTING.md',
    template: `# Contributing to ${repoName}

Thank you for your interest in contributing! Here are guidelines to get started.

## How to Contribute
1. **Fork the Repository**: Create your personal copy on GitHub.
2. **Clone Locally**:
   \`\`\`bash
   git clone https://github.com/YOUR_USERNAME/${repoName}.git
   cd ${repoName}
   \`\`\`
3. **Create a Feature Branch**:
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`
4. **Make Your Changes**: Adhere to code formatting and add unit tests for new features.
5. **Verify Tests**: Ensure all automated checks pass locally.
6. **Submit a Pull Request**: Provide a descriptive title and reference any related issues.

## Pull Request Guidelines
- Keep PRs focused on a single responsibility.
- Write meaningful commit messages.
- Update documentation when adding new features or changing APIs.
`,
  };
}

function getCodeOfConductTemplate() {
  return {
    filePath: 'CODE_OF_CONDUCT.md',
    template: `# Contributor Covenant Code of Conduct

## Our Pledge
We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, caste, color, religion, or sexual identity
and orientation.

## Our Standards
Examples of behavior that contributes to a positive environment:
* Demonstrating empathy and kindness toward other people
* Being respectful of differing opinions, viewpoints, and experiences
* Giving and gracefully accepting constructive feedback
* Accepting responsibility and apologizing to those affected by our mistakes

## Enforcement
Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the project maintainers. Maintainers have the right and responsibility
to remove or edit comments, commits, and pull requests that do not align with this Code of Conduct.
`,
  };
}

function getSecurityTemplate() {
  return {
    filePath: 'SECURITY.md',
    template: `# Security Policy

## Supported Versions
Please use the latest version of this project to receive security patches.

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability
If you discover a security vulnerability, please do NOT file a public issue.

Instead, please send an email to the project maintainers with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond promptly to investigate and publish a patch.
`,
  };
}

function getPrTemplate() {
  return {
    filePath: '.github/pull_request_template.md',
    template: `## Description
Briefly explain the changes introduced by this pull request.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Checklist
- [ ] My code follows the project's code style.
- [ ] I have added tests that prove my fix is effective or that my feature works.
- [ ] New and existing automated tests pass locally.
- [ ] I have updated relevant documentation.
`,
  };
}

function getGitignoreTemplate(projectType) {
  if (projectType.type === 'node') {
    return {
      filePath: '.gitignore',
      template: `# Dependencies
node_modules/

# Production build outputs
dist/
build/

# Environment files
.env
.env.*
!.env.example

# Logs
npm-debug.log*
yarn-debug.log*
*.log

# OS & IDE
.DS_Store
.vscode/
`,
    };
  }

  if (projectType.type === 'python') {
    return {
      filePath: '.gitignore',
      template: `# Python bytecode
__pycache__/
*.py[cod]

# Virtual environments
.venv/
env/
venv/

# Environment variables
.env
.env.*
!.env.example

# Testing & coverage
.pytest_cache/
.coverage
htmlcov/

# Distribution
dist/
build/
*.egg-info/
`,
    };
  }

  return {
    filePath: '.gitignore',
    template: `# Environment variables
.env
.env.*
!.env.example

# Build artifacts
dist/
build/
bin/

# OS files
.DS_Store
Thumbs.db
`,
  };
}

function getReadmeTemplate(repoName = 'Project Name', description = '') {
  return {
    filePath: 'README.md',
    template: `# ${repoName}

> ${description || 'A concise 1-2 sentence overview of what your project does and the problem it solves.'}

## Key Features
- **Feature 1**: Clear explanation of core capability.
- **Feature 2**: Another standout aspect of your engineering implementation.
- **Feature 3**: Performance, security, or developer experience benefit.

## Tech Stack
- **Frontend / Core**: Technology 1
- **Backend / Engine**: Technology 2
- **Testing & CI**: Automated testing with GitHub Actions

## Architecture
\`\`\`text
[ Client / Input ] ──▶ [ Processing / Engine ] ──▶ [ Output / UI ]
\`\`\`

## Quickstart & Installation

### Prerequisites
- Node.js v18+ / Python 3.10+ / Go 1.21+

### Installation
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/${repoName}.git
cd ${repoName}
npm install # or pip install -r requirements.txt
\`\`\`

### Running the Project
\`\`\`bash
npm run dev # or python main.py
\`\`\`

## Running Tests
\`\`\`bash
npm test # or pytest
\`\`\`

## Contributing
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming and pull request guidelines.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
`,
  };
}

module.exports = {
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
};
