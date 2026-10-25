# RepoPilot 🚀

> A developer-focused SaaS platform designed for CSE portfolios and internship applications. RepoPilot analyzes public GitHub repositories to provide a transparent 0–100 repository-readiness score, detects missing documentation and engineering standards, and delivers prioritized, actionable recommendations.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-emerald.svg)](https://supabase.com/)

---

## Key Features

- **Instant Repository Audit**: Analyzes any public GitHub repo by shorthand (`owner/repo`) or full URL.
- **Transparent 0–100 Scoring Model**: Weighted evaluation across Documentation (35%), Code Health & Testing (25%), CI/CD Automation (20%), and Community Standards (20%).
- **Prioritized Improvement Plan**: Explains *why* missing files hurt recruiter evaluations and provides copy-paste ready actions.
- **Filterable Checklist**: Easily toggle between all checks, passed items, and items needing attention.
- **User Authentication**: Supabase Email/Password authentication with persistent local sessions.
- **Saved Reports & History**: Authenticated users can save audit snapshots to a PostgreSQL database protected by Row Level Security (RLS) and reopen or delete them anytime.
- **Zero Cost / 100% Free Tier**: Built entirely on free tools and tiers (GitHub REST API, Supabase, Vercel, and Render/Railway).
- **Guest Friendly**: Anyone can run live audits without logging in.

---

## System Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │                  User Browser (Client)                 │
               │             React 18 + Vite (SPA on Vercel)            │
               └──────────────────┬───────────────────┬─────────────────┘
                                  │                   │
                   Auth & RLS     │                   │ /api/analyze
                   Queries        │                   │ (Vite Proxy or CORS)
                                  ▼                   ▼
               ┌──────────────────────┐   ┌─────────────────────────────┐
               │    Supabase Cloud    │   │     RepoPilot API Server    │
               │  - Auth (auth.users) │   │     Node.js + Express.js    │
               │  - PostgreSQL DB     │   │   (Render / Railway / Host) │
               │  - Row Level Security│   └──────────────┬──────────────┘
               └──────────────────────┘                  │
                                                         │ GitHub REST API v3
                                                         ▼
                                          ┌─────────────────────────────┐
                                          │      GitHub REST API        │
                                          │   (Public Repositories)     │
                                          └─────────────────────────────┘
```

---

## Project Structure

```text
RepoPilot/
├── .env.example               # Root environment variable template
├── .gitignore                 # Strict ignore rules for .env, build, and node_modules
├── package.json               # Monorepo runner (concurrent execution)
├── README.md                  # Complete documentation and setup guide
├── supabase_schema.sql        # PostgreSQL migration file with RLS policies
│
├── client/                    # Frontend Application (React 18 + Vite)
│   ├── .env.example           # Client environment template
│   ├── index.html             # HTML entry point
│   ├── package.json           # Client dependencies
│   ├── vercel.json            # Vercel SPA routing rewrites
│   ├── vite.config.js         # Vite configuration with /api reverse proxy
│   └── src/
│       ├── components/        # Reusable UI components
│       │   ├── AuditChecklist.jsx
│       │   ├── AuthModal.jsx
│       │   ├── CategoryBreakdown.jsx
│       │   ├── ErrorMessage.jsx
│       │   ├── Footer.jsx
│       │   ├── HistoryModal.jsx
│       │   ├── LoadingSkeleton.jsx
│       │   ├── Navbar.jsx
│       │   ├── RecommendationsList.jsx
│       │   ├── RepoHeader.jsx
│       │   ├── RepoSearchForm.jsx
│       │   └── ScoreGauge.jsx
│       ├── context/           # AuthContext (Supabase session manager)
│       ├── services/          # supabaseClient.js
│       ├── App.jsx            # Main dashboard controller
│       ├── index.css          # Design tokens & dark theme
│       └── main.jsx           # DOM bootstrap entry
│
└── server/                    # Backend API (Node.js + Express)
    ├── .env.example           # Server environment template
    ├── package.json           # Server dependencies & test runner
    ├── src/
    │   ├── routes/            # analyzeRoutes.js
    │   ├── services/          # githubService.js, scoringEngine.js
    │   ├── utils/             # repoValidator.js
    │   └── index.js           # Express app, CORS, and /api/health
    └── test/
        └── test-analyze.js    # Automated test suite (11 test cases)
```

---

## Environment Variables Reference

Never commit actual `.env` files to git. Template files (`.env.example`) are provided with safe placeholders.

### Frontend (`client/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | No | Deployed backend URL for production. Leave empty in local dev to use Vite's `/api` proxy. | `https://repopilot-api.onrender.com` |
| `VITE_SUPABASE_URL` | Yes | Supabase Project URL found in *Project Settings -> API*. | `https://your-project.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key (`sb_publishable_...` or anon key). | `sb_publishable_...` |

### Backend (`server/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Port for Express server to listen on. Render sets this automatically. | `5000` |
| `CLIENT_URL` | Yes | Allowed CORS origin(s). Supports comma-separated list or Vercel preview wildcards. | `http://localhost:5173` or `https://repopilot.vercel.app` |
| `NODE_ENV` | No | Node execution environment. | `development` or `production` |
| `GITHUB_TOKEN` | No | Optional GitHub Personal Access Token to raise rate limits from 60 to 5,000 req/hr. | `ghp_...` |

---

## Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later recommended, verified on v22)
- [npm](https://www.npmjs.com/)

### 2. Install Dependencies
Run from the repository root to install all workspaces:
```bash
npm run install:all
```

### 3. Configure Local Environment
```bash
# Windows PowerShell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```
Fill in your Supabase project keys in `client/.env`.

### 4. Execute Supabase Database Migration
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** in the left sidebar.
3. Open [`supabase_schema.sql`](file:///c:/Users/jesty/JJ/RepoPilot/supabase_schema.sql), copy its contents, paste into the editor, and click **Run**.
4. This creates `saved_audits` and activates Row Level Security.

### 5. Start Development Servers
From the repository root:
```bash
npm run dev
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## Running Automated Tests

Run the full verification suite (input validator, scoring engine unit tests, and live API endpoints):

```bash
# From repository root
npm test

# Or directly in the server directory
npm test --prefix server
```

Build verification:
```bash
npm run build:client
```

---

## Deployment Guide (100% Free Tier)

### Step 1: Deploy Backend to Render (or Railway)
1. Push your repository to your GitHub account.
2. Sign in to [Render](https://render.com) and click **New + -> Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-repopilot-frontend.vercel.app` *(update after Step 2)*
   - `GITHUB_TOKEN`: *(Optional, your personal access token)*
6. Click **Deploy Web Service**.
7. Copy your deployed service URL (e.g., `https://repopilot-api.onrender.com`).
8. Test health: `curl https://repopilot-api.onrender.com/api/health` -> `{"status":"ok"}`.

### Step 2: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New... -> Project**.
2. Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `client`
4. Add Environment Variables:
   - `VITE_API_URL`: Your Render backend URL from Step 1 (e.g. `https://repopilot-api.onrender.com`)
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g., `https://repopilot.vercel.app`).
7. Update `CLIENT_URL` in your Render backend settings with your Vercel URL so CORS allows requests.

---

## Transparent Scoring Engine Breakdown

| Category | Check | Weight | Evaluation Criteria |
| :--- | :--- | :---: | :--- |
| **Documentation** (35 pts) | README Existence | 10 pts | File detected in root directory |
| | README Depth & Quality | 10 pts | Substantial content (>400 bytes, installation, usage) |
| | Repository Description | 10 pts | Clear GitHub description (>10 characters) |
| | Open-Source License | 5 pts | OSI license (MIT, Apache-2.0, BSD, GPL, etc.) |
| **Code Health** (25 pts) | Automated Testing Signals | 15 pts | Unit/integration test folders (`test/`, `spec/`) or test configs |
| | `.gitignore` File | 10 pts | Present in root to avoid credential leaks |
| **Automation** (20 pts) | CI/CD Workflows | 20 pts | Active workflows in `.github/workflows/*.yml` |
| **Community** (20 pts) | `CONTRIBUTING.md` | 8 pts | Clear collaboration and onboarding guidelines |
| | `CODE_OF_CONDUCT.md` | 5 pts | Contributor covenant or standard community rules |
| | Issue & PR Templates | 4 pts | Templates in `.github/` for structured bug reports |
| | `SECURITY.md` | 3 pts | Responsible vulnerability disclosure policy |

**Grades**:
- **90–100**: `A+` (*Exemplary - Portfolio Ready*)
- **80–89**: `A` (*Strong - Well Documented*)
- **70–79**: `B` (*Good - Minor Improvements Needed*)
- **55–69**: `C` (*Fair - Missing Key Standards*)
- **0–54**: `Needs Work` (*Needs Significant Attention*)

---

## Security Practices

- **Zero Secret Exposure**: `.gitignore` strictly ignores all `.env*` files. Real keys are never committed.
- **Client Key Scoping**: The frontend only accesses public publishable/anon keys. The Supabase `service_role` key is never exposed.
- **Row Level Security (RLS)**: Enforced directly inside PostgreSQL via `auth.uid() = user_id`, guaranteeing users cannot access each other's data.
- **Input Sanitization**: All repository inputs are sanitized and validated against GitHub's naming conventions to reject malformed input before API dispatch.
