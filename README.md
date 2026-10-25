# 🚀 RepoPilot — GitHub Repository Readiness Auditor

**Analyze your GitHub repository. Discover gaps. Improve your project readiness.**

🔗 **Live Demo:** https://repo-pilot-zeta.vercel.app  
📂 **Source Code:** https://github.com/JestyJose/RepoPilot

RepoPilot is a web application that analyzes public GitHub repositories, generates a readiness score out of 100, identifies missing project essentials, and recommends improvements to help developers build more professional, portfolio-ready repositories.

## ✨ Features

- **Repository Readiness Score:** Get an overall score out of 100.
- **Documentation Analysis:** Check for a README, project description, and license.
- **Development Best Practices:** Check for tests, `.gitignore`, and GitHub Actions workflows.
- **Contribution Readiness:** Identify missing contributing guidelines, code of conduct, and security policy.
- **Repository Templates:** Check for issue and pull request templates.
- **Actionable Recommendations:** Get suggestions for improving your repository.
- **User Authentication:** Sign in to your account using Supabase.
- **Saved Audit Reports:** Save, reopen, and delete previous audit reports.

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| API | GitHub REST API |
| Database & Authentication | Supabase, PostgreSQL |
| Deployment | Vercel, Render |

## 🚀 Try It Out

1. Open the [RepoPilot Live Demo](https://repo-pilot-zeta.vercel.app).
2. Enter a public GitHub repository in `owner/repository` format.
3. Click **Analyze Repository**.
4. Review the readiness score, checklist, and recommendations.
5. Sign in to save and revisit your audit reports.

Try these example repositories:

- [expressjs/express](https://github.com/expressjs/express)
- [facebook/react](https://github.com/facebook/react)
- [vercel/next.js](https://github.com/vercel/next.js)

## 💻 Run Locally

### Prerequisites

- Node.js and npm
- Git
- A GitHub account
- A Supabase project for authentication and saved reports

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

Create `client/.env` with your Supabase project credentials and local API URL:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Create `server/.env`:

```env
NODE_ENV=development
CLIENT_URL=http://localhost:5173
GITHUB_TOKEN=your_github_token
```

Use your own credentials. Never commit real `.env` files, access tokens, or secret keys to GitHub.

### 4. Start the application

From the project root, run:

```bash
npm run dev
```

Open the local frontend URL printed by Vite, typically http://localhost:5173.

## 📁 Project Structure

```text
RepoPilot/
├── client/              # React + Vite frontend
├── server/              # Express backend and API routes
├── supabase_schema.sql  # Database schema and security policies
├── package.json         # Root scripts
├── package-lock.json
├── .env.example         # Environment variable template
├── .gitignore
└── README.md
```

## 🔐 Security Notes

- Keep real environment files out of version control.
- Use a GitHub token on the backend to increase API rate limits.
- Keep Supabase service-role keys and other private credentials on the server only.
- Use Row Level Security (RLS) to protect user-specific saved audit reports.

## 🎯 Project Goal

RepoPilot aims to help students, developers, and open-source contributors identify missing repository essentials and make their projects easier to understand, maintain, and present in a portfolio.

## 👩‍💻 Author

**Jesty Jose**

- GitHub: https://github.com/JestyJose

---

⭐ If you find RepoPilot useful, consider giving the repository a star!
