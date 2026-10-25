import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './services/supabaseClient';
import Navbar from './components/Navbar';
import RepoSearchForm from './components/RepoSearchForm';
import RepoHeader from './components/RepoHeader';
import ScoreGauge from './components/ScoreGauge';
import CategoryBreakdown from './components/CategoryBreakdown';
import AuditChecklist from './components/AuditChecklist';
import RecommendationsList from './components/RecommendationsList';
import ErrorMessage from './components/ErrorMessage';
import LoadingSkeleton from './components/LoadingSkeleton';
import AuthModal from './components/AuthModal';
import HistoryModal from './components/HistoryModal';
import Footer from './components/Footer';

function MainDashboard() {
  const [repoInput, setRepoInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [auditResult, setAuditResult] = useState(null);
  const [errorInfo, setErrorInfo] = useState({ message: '', statusCode: null });

  // Save states
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const { user } = useAuth();

  const handleAnalyze = async (inputToAnalyze) => {
    const target = inputToAnalyze || repoInput;
    if (!target || !target.trim()) return;

    setStatus('loading');
    setErrorInfo({ message: '', statusCode: null });
    setIsSaved(false);

    try {
      // In development, Vite proxies /api to http://localhost:5000.
      // In production, VITE_API_URL can be set to the deployed backend URL (e.g. https://api.yourdomain.com).
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
      const encodedRepo = encodeURIComponent(target.trim());
      const response = await fetch(`${apiBase}/api/analyze?repo=${encodedRepo}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw {
          message: data.error || `Server responded with HTTP ${response.status}`,
          status: response.status || 500,
        };
      }

      setAuditResult(data);
      setStatus('success');
    } catch (err) {
      setAuditResult(null);
      setStatus('error');
      setErrorInfo({
        message: err.message || 'Unable to connect to the backend server. Please verify the server is running.',
        statusCode: err.status || 500,
      });
    }
  };

  const handleSaveReport = async () => {
    if (!user || !supabase || !auditResult) return;

    setIsSaving(true);
    try {
      // Insert into PostgreSQL saved_audits table, protected by Supabase RLS
      const { error } = await supabase.from('saved_audits').insert({
        user_id: user.id,
        repository_full_name: auditResult.repository.fullName,
        repository_url: auditResult.repository.htmlUrl,
        readiness_score: auditResult.audit.score,
        grade: auditResult.audit.grade,
        audit_result: auditResult,
      });

      if (error) throw error;
      setIsSaved(true);
    } catch (err) {
      alert(`Could not save report: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopenSavedReport = (savedAuditResult) => {
    if (!savedAuditResult) return;
    setAuditResult(savedAuditResult);
    setRepoInput(savedAuditResult.repository?.fullName || '');
    setStatus('success');
    setIsSaved(true);
  };

  const handleReset = () => {
    setAuditResult(null);
    setStatus('idle');
    setErrorInfo({ message: '', statusCode: null });
    setRepoInput('');
    setIsSaved(false);
  };

  const openAuthWithMessage = (msg) => {
    setAuthMessage(msg);
    setIsAuthOpen(true);
  };

  return (
    <div className="app-layout">
      <Navbar
        onReset={handleReset}
        onOpenAuth={() => openAuthWithMessage('')}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main className="main-content">
        <div className="container">
          {/* Hero Section */}
          <section className="hero-section">
            <span className="hero-badge">CSE Portfolio & Internship Tool</span>
            <h1 className="hero-title">
              Audit Public GitHub Repos for <span className="gradient-text">Job Readiness</span>
            </h1>
            <p className="hero-subtitle">
              Get an instant 0–100 repository score, find missing documentation gaps, and save audit reports to your portfolio account.
            </p>

            <RepoSearchForm
              repoInput={repoInput}
              setRepoInput={setRepoInput}
              onAnalyze={handleAnalyze}
              isLoading={status === 'loading'}
            />
          </section>

          {/* Dynamic Content States */}
          {status === 'loading' && <LoadingSkeleton />}

          {status === 'error' && (
            <ErrorMessage
              error={errorInfo.message}
              statusCode={errorInfo.statusCode}
              onReset={() => setStatus('idle')}
            />
          )}

          {status === 'success' && auditResult && (
            <section className="dashboard-results">
              {/* Repository Header with Save Report Button */}
              <RepoHeader
                repository={auditResult.repository}
                onRefresh={() => handleAnalyze(repoInput)}
                isLoading={status === 'loading'}
                onSaveReport={handleSaveReport}
                isSaved={isSaved}
                isSaving={isSaving}
                user={user}
                onOpenAuth={openAuthWithMessage}
              />

              {/* Score & Category Overview */}
              <div className="score-overview-grid">
                <ScoreGauge audit={auditResult.audit} />
                <CategoryBreakdown categories={auditResult.audit.categories} />
              </div>

              {/* Actionable Improvement Recommendations */}
              <RecommendationsList recommendations={auditResult.audit.recommendations} />

              {/* Full Audit Checklist */}
              <AuditChecklist checks={auditResult.audit.checks} />
            </section>
          )}

          {/* Empty / Welcome Feature Grid (Visible when idle) */}
          {status === 'idle' && (
            <section className="features-section">
              <h3 className="features-title">What RepoPilot Audits</h3>
              <p className="features-subtitle">
                Recruiters and hiring managers spend less than 60 seconds reviewing portfolio repositories. We evaluate the core signals that build credibility.
              </p>

              <div className="features-grid">
                <div className="feature-card">
                  <span className="feature-icon">📄</span>
                  <h4>Documentation Depth</h4>
                  <p>Evaluates README existence, setup guides, repository description, and open-source licenses.</p>
                  <span className="feature-weight">Weight: 35%</span>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">🧪</span>
                  <h4>Code Health & Testing</h4>
                  <p>Detects automated test suites (Jest, Vitest, PyTest) and .gitignore hygiene to avoid committed credentials.</p>
                  <span className="feature-weight">Weight: 25%</span>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">⚡</span>
                  <h4>CI/CD Automation</h4>
                  <p>Checks for active GitHub Actions pipelines proving that your code builds and passes tests on every commit.</p>
                  <span className="feature-weight">Weight: 20%</span>
                </div>

                <div className="feature-card">
                  <span className="feature-icon">👥</span>
                  <h4>Community Standards</h4>
                  <p>Checks for CONTRIBUTING guides, CODE_OF_CONDUCT, Security policy, and Issue/PR templates.</p>
                  <span className="feature-weight">Weight: 20%</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMessage={authMessage}
      />

      {/* Saved Audits History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectReport={handleReopenSavedReport}
      />

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}

export default App;
