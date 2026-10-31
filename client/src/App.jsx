import React, { useState, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './services/supabaseClient';
import Navbar from './components/Navbar';
import RepoSearchForm from './components/RepoSearchForm';
import BenchmarkCertificateCard from './components/BenchmarkCertificateCard';
import RepoHeader from './components/RepoHeader';
import ScoreGauge from './components/ScoreGauge';
import CategoryBreakdown from './components/CategoryBreakdown';
import AuditChecklist from './components/AuditChecklist';
import RecommendationsList from './components/RecommendationsList';
import ErrorMessage from './components/ErrorMessage';
import LoadingSkeleton from './components/LoadingSkeleton';
import AuthModal from './components/AuthModal';
import HistoryModal from './components/HistoryModal';
import AuditSummaryBar from './components/AuditSummaryBar';
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

  const benchmarksRef = useRef(null);
  const { user } = useAuth();

  const handleAnalyze = async (inputToAnalyze) => {
    const target = inputToAnalyze || repoInput;
    if (!target || !target.trim()) return;

    setStatus('loading');
    setErrorInfo({ message: '', statusCode: null });
    setIsSaved(false);

    try {
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
      // Smoothly scroll down towards results
      window.scrollTo({ top: 350, behavior: 'smooth' });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBenchmarks = () => {
    if (benchmarksRef.current) {
      benchmarksRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAuthWithMessage = (msg) => {
    setAuthMessage(msg);
    setIsAuthOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Background ambient lighting effects matching AgentVet */}
      <div className="ambient-glow ambient-glow-left" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-right" aria-hidden="true" />

      <Navbar
        onReset={handleReset}
        onOpenAuth={() => openAuthWithMessage('')}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onScrollToBenchmarks={scrollToBenchmarks}
      />

      <main className="main-content">
        <div className="container">
          {/* Hero Section matching AgentVet typography and hierarchy */}
          <section className="hero-section">
            <div className="hero-eyebrow">
              <span className="eyebrow-text">INDEPENDENT RATINGS FOR REPOSITORIES</span>
            </div>

            <h1 className="hero-title">
              Audit <span className="gradient-highlight">repos</span> you can actually trust.
            </h1>

            <p className="hero-subtitle">
              Discover, compare, and audit repositories vetted by real benchmark standards. RepoPilot combines static code analysis with objective readiness certificates.
            </p>

            <RepoSearchForm
              repoInput={repoInput}
              setRepoInput={setRepoInput}
              onAnalyze={handleAnalyze}
              isLoading={status === 'loading'}
            />

            {/* Showcase the AgentVet Benchmark Certificate Card directly in Hero when idle */}
            {status === 'idle' && (
              <div className="hero-cert-container">
                <BenchmarkCertificateCard
                  isLive={false}
                  onSampleSelect={handleAnalyze}
                />
              </div>
            )}
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

              {/* AgentVet Benchmark Certificate Card with LIVE audited data */}
              <BenchmarkCertificateCard
                audit={auditResult.audit}
                repository={auditResult.repository}
                isLive={true}
              />

              {/* Compact Audit Summary Bar */}
              <AuditSummaryBar
                audit={auditResult.audit}
                repository={auditResult.repository}
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

          {/* Benchmark Dimensions / Feature Grid (Visible when idle) */}
          {status === 'idle' && (
            <section ref={benchmarksRef} className="features-section">
              <div className="features-header">
                <span className="section-eyebrow">OBJECTIVE SCORING DIMENSIONS</span>
                <h2 className="features-title">What RepoPilot Audits</h2>
                <p className="features-subtitle">
                  Recruiters and engineering leads spend under 60 seconds reviewing GitHub profiles. We evaluate the signals that separate production code from proof-of-concepts.
                </p>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="card-top">
                    <span className="feature-icon">📄</span>
                    <span className="feature-weight">Weight 35%</span>
                  </div>
                  <h4>Documentation Depth</h4>
                  <p>Evaluates README existence, structured setup instructions, license clarity, and repo descriptions.</p>
                  <div className="feature-indicator documentation"></div>
                </div>

                <div className="feature-card">
                  <div className="card-top">
                    <span className="feature-icon">🧪</span>
                    <span className="feature-weight">Weight 25%</span>
                  </div>
                  <h4>Code Health & Testing</h4>
                  <p>Detects automated test suites (Jest, Vitest, PyTest) and .gitignore hygiene to prevent committed credentials.</p>
                  <div className="feature-indicator health"></div>
                </div>

                <div className="feature-card">
                  <div className="card-top">
                    <span className="feature-icon">⚡</span>
                    <span className="feature-weight">Weight 20%</span>
                  </div>
                  <h4>CI/CD Automation</h4>
                  <p>Detects active GitHub Actions workflows verifying continuous build passes and automated test runs.</p>
                  <div className="feature-indicator automation"></div>
                </div>

                <div className="feature-card">
                  <div className="card-top">
                    <span className="feature-icon">👥</span>
                    <span className="feature-weight">Weight 20%</span>
                  </div>
                  <h4>Community Standards</h4>
                  <p>Checks for CONTRIBUTING guidelines, CODE_OF_CONDUCT, Security advisories, and PR issue templates.</p>
                  <div className="feature-indicator community"></div>
                </div>
              </div>

              {/* Metrics trust banner */}
              <div className="trust-metrics-strip">
                <div className="trust-metric">
                  <span className="metric-val">100%</span>
                  <span className="metric-lbl">Deterministic Rules</span>
                </div>
                <div className="trust-metric">
                  <span className="metric-val">12+</span>
                  <span className="metric-lbl">Engineering Checks</span>
                </div>
                <div className="trust-metric">
                  <span className="metric-val">4</span>
                  <span className="metric-lbl">Scored Dimensions</span>
                </div>
                <div className="trust-metric">
                  <span className="metric-val">0</span>
                  <span className="metric-lbl">Vanity Metric Bias</span>
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
    <ThemeProvider>
      <AuthProvider>
        <MainDashboard />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
