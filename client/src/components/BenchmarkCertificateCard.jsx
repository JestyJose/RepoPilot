import React from 'react';

/**
 * BenchmarkCertificateCard
 * Replicates the signature centerpiece card from the AgentVet design.
 * Can display either a featured preview (idle state) or the active audited repository data.
 */
function BenchmarkCertificateCard({ audit, repository, isLive = false, onSampleSelect }) {
  // Fallback / Featured preview data when in idle state
  const defaultCategories = {
    Documentation: { percentage: 94, earned: 33, max: 35 },
    'Code Health': { percentage: 88, earned: 22, max: 25 },
    Automation: { percentage: 95, earned: 19, max: 20 },
    Community: { percentage: 85, earned: 17, max: 20 },
  };

  const rawScore = audit?.score ?? 91;
  const normalizedScore = (rawScore / 10).toFixed(1);
  const certId = isLive
    ? `RP-${Math.abs(hashCode(repository?.fullName || 'repopilot')) % 9000 + 1000}`
    : 'AV-2049';

  const categories = audit?.categories || defaultCategories;

  const getCertificationBadge = (score) => {
    if (score >= 85) return 'Certified Plus';
    if (score >= 70) return 'Certified Standard';
    if (score >= 50) return 'Conditional Pass';
    return 'Action Required';
  };

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  return (
    <div className={`benchmark-cert-card ${isLive ? 'is-live' : 'is-preview'}`}>
      <div className="cert-header">
        <div className="cert-tag">
          <span className="cert-status-dot"></span>
          <span>Benchmark certificate</span>
        </div>
        <div className="cert-id-badge">
          <span>{certId}</span>
        </div>
      </div>

      <div className="cert-main">
        <div className="cert-score-group">
          <div className="cert-score-number">{normalizedScore}</div>
          <div className="cert-badge-wrap">
            <span className="cert-badge">{getCertificationBadge(rawScore)}</span>
            {isLive && repository && (
              <span className="cert-repo-tag">{repository.fullName}</span>
            )}
          </div>
        </div>

        <p className="cert-description">
          Objective certificate based on scored benchmark dimensions.
        </p>
      </div>

      <div className="cert-dimensions-grid">
        {Object.entries(categories).map(([name, data], idx) => {
          const colors = [
            'linear-gradient(90deg, #38bdf8, #818cf8)',
            'linear-gradient(90deg, #00f0ff, #38bdf8)',
            'linear-gradient(90deg, #a855f7, #6366f1)',
            'linear-gradient(90deg, #10b981, #06b6d4)',
          ];
          const color = colors[idx % colors.length];

          return (
            <div key={name} className="cert-dimension-item">
              <div className="dimension-meta">
                <span className="dimension-name">{name}</span>
                <span className="dimension-pct">{data.percentage}%</span>
              </div>
              <div className="dimension-bar-track">
                <div
                  className="dimension-bar-fill"
                  style={{
                    width: `${data.percentage}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!isLive && (
        <div className="cert-footer-caption">
          <span>✨ Featured Benchmark Preview: <strong>vercel/next.js</strong></span>
          {onSampleSelect && (
            <button
              type="button"
              className="cert-quick-audit-btn"
              onClick={() => onSampleSelect('vercel/next.js')}
            >
              Audit this repo &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BenchmarkCertificateCard;
