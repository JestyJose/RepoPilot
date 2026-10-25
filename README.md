# 🚀 RepoPilot — GitHub Repository Readiness Auditor

**Analyze your GitHub repository. Discover gaps. Improve your project readiness.**

🔗 **Live Demo:** [https://repo-pilot-zeta.vercel.app](https://repo-pilot-zeta.vercel.app)  
📂 **Source Code:** [https://github.com/JestyJose/RepoPilot](https://github.com/JestyJose/RepoPilot)

RepoPilot is a web application that analyzes public GitHub repositories, generates a readiness score out of 100, identifies missing project essentials, and recommends improvements with copyable starter templates to help developers build more professional, portfolio-ready repositories.

---

## ✨ Features

- **Instant Repository Audit**: Analyzes any public GitHub repo by shorthand (`owner/repo`) or full URL.
- **Transparent 0–100 Scoring Model**: Explicit, testable rules across Documentation (35%), Code Health & Testing (25%), CI/CD Automation (20%), and Community Standards (20%). Non-overlapping scoring avoids double-penalizing dependent checks.
- **3-State Verification**: Every check reports one of three clear states: `pass`, `needs_improvement`, or `unable_to_verify`, complete with point explanations.
- **Language & Ecosystem Aware**: Tailors testing signals and CI/CD detection to the repository's runtime (Node.js, Python, Go, Rust, Java). Inspects `package.json` test scripts and test runners even when no `test/` folder is present.
- **Upgraded Recommendation Cards**: Each card details Title, Priority (High/Medium/Low), Category, Estimated Effort, Repository Evidence, Why It Matters, Recommended Fix, Target File Path, Verification Condition, and an expandable Starter Template with a one-click "Copy Template" action.
- **Priority & Category Filters**: Easily filter recommendations by priority (High, Medium, Low) and category (Documentation, Code Health, Automation, Community Standards).
- **Compact Audit Summary Bar**: Highlights ecosystem language, high-priority issues count, estimated total remediation time, and passed checks at a glance.
- **User Authentication**: Supabase Email/Password authentication with persistent local sessions.
- **Saved Reports & History**: Authenticated users can save audit snapshots to a PostgreSQL database protected by Row Level Security (RLS) and reopen or delete them anytime.
- **Zero Cost / 100% Free Tier**: Built entirely on free tools and tiers (GitHub REST API, Supabase, Vercel, and Render/Railway).
- **Guest Friendly**: Anyone can run live audits without logging in.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite 5, Vanilla CSS (Modern Dark Mode) |
| Backend | Node.js, Express.js |
| API | GitHub REST API v3 |
| Database & Authentication | Supabase (PostgreSQL with Row Level Security) |
| Deployment | Vercel (Frontend), Render / Railway (Backend) |

---

## 🚀 Try It Out

1. Open the [RepoPilot Live Demo](https://repo-pilot-zeta.vercel.app).
2. Enter a public GitHub repository in `owner/repository` format or paste the GitHub URL.
3. Click **Analyze Repository**.
4. Review the readiness score, checklist, and actionable recommendations with starter templates.
5. Sign in to save and revisit your audit reports anytime.

Try these example repositories:
- [expressjs/express](https://github.com/expressjs/express)
- [facebook/react](https://github.com/facebook/react)
- [vercel/next.js](https://github.com/vercel/next.js)

---

## 📁 Project Structure

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
│       │   ├── AuditChecklist.jsx       # 3-state checklist with filter pills
│       │   ├── AuditSummaryBar.jsx      # Compact metrics and fix-time summary
│       │   ├── AuthModal.jsx            # Supabase sign-in/up dialog
│       │   ├── CategoryBreakdown.jsx    # Category score progress bars
│       │   ├── ErrorMessage.jsx         # Friendly error display
│       │   ├── Footer.jsx
│       │   ├── HistoryModal.jsx         # Saved audits manager
│       │   ├── LoadingSkeleton.jsx      # Shimmer loading cards
│       │   ├── Navbar.jsx               # Navigation & user auth status
│       │   ├── RecommendationsList.jsx  # Filterable cards with starter templates
│       │   ├── RepoHeader.jsx           # Repository details & metadata
│       │   ├── RepoSearchForm.jsx       # Search input with quick examples
│       │   └── ScoreGauge.jsx           # Circular readiness score indicator
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
    │   ├── services/          # githubService.js, scoringEngine.js, templateGenerator.js
    │   ├── utils/             # repoValidator.js
    │   └── index.js           # Express app, CORS, and /api/health
    └── test/
        └── test-analyze.js    # Automated test suite (15 test cases)
```

---

## 💻 Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later) and npm
- Git
- A GitHub account (optional Personal Access Token to raise rate limits)
- A [Supabase](https://supabase.com) project for authentication and saved reports

### 1. Clone the repository

```bash
git clone https://github.com/JestyJose/RepoPilot.git
cd RepoPilot
```

### 2. Install dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 3. Configure environment variables

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
# GITHUB_TOKEN=your_github_personal_access_token_here
```

*Never commit real `.env` files, access tokens, or secret keys to GitHub.*

### 4. Supabase Database Setup

Run the SQL migration script in your Supabase SQL Editor:
1. Open [`supabase_schema.sql`](supabase_schema.sql).
2. Copy and run the SQL query in the Supabase Dashboard SQL Editor to set up `saved_audits` and Row Level Security.

### 5. Start the application

From the repository root:
```bash
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🧪 Running Automated Tests

Run the full verification suite (input validator, scoring engine unit tests, and live API endpoints):

```bash
# From repository root
npm test

# Build client bundle for production
npm run build:client
```

---

## 🎯 Scoring Engine Breakdown

| Category | Weight | Checks Included |
| :--- | :---: | :--- |
| **Documentation** | 35 pts | README presence (10 pts), README quality & depth (10 pts), GitHub repository description (10 pts), OSI open-source license (5 pts). |
| **Code Health** | 25 pts | Automated testing signals across Node/Python/Go/Rust/Java (15 pts), root `.gitignore` file (10 pts). |
| **Automation** | 20 pts | Active CI/CD workflows in `.github/workflows/` (20 pts). |
| **Community** | 20 pts | `CONTRIBUTING.md` (8 pts), `CODE_OF_CONDUCT.md` (5 pts), Issue & PR templates (4 pts), `SECURITY.md` (3 pts). |

**Grade Tiers**:
- **90–100**: `A+` (Exemplary - Portfolio Ready)
- **80–89**: `A` (Strong - Well Documented)
- **70–79**: `B` (Good - Minor Improvements Needed)
- **55–69**: `C` (Fair - Missing Key Standards)
- **0–54**: `Needs Work` (Needs Significant Attention)

---

## 🔐 Security Notes

- Keep real environment files out of version control (`.gitignore` protects all `.env*` files).
- The client only uses Supabase publishable/anon keys; the `service_role` key is never exposed.
- User-specific saved audits are guarded by PostgreSQL Row Level Security (RLS) policies keyed on `auth.uid() = user_id`.
- Input validation sanitizes all repository parameters before dispatching queries to GitHub's REST API.

---

## 🎯 Project Goal

RepoPilot helps students, developers, and open-source contributors audit repository readiness, adopt modern software engineering standards, and present polished, recruiter-ready projects for CSE portfolios and internship applications.

---

## 👩‍💻 Author

**Jesty Jose**
- GitHub: [https://github.com/JestyJose](https://github.com/JestyJose)

⭐ If you find RepoPilot useful, consider giving the repository a star!
