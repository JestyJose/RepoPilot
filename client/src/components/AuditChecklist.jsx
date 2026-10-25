import React, { useState } from 'react';

function AuditChecklist({ checks = [] }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pass' | 'needs_improvement' | 'unable_to_verify'

  const passCount = checks.filter(c => c.status === 'pass' || (c.passed && !c.status)).length;
  const needsImprovementCount = checks.filter(c => c.status === 'needs_improvement' || (!c.passed && c.status !== 'unable_to_verify')).length;
  const unableToVerifyCount = checks.filter(c => c.status === 'unable_to_verify').length;

  const filteredChecks = checks.filter(c => {
    const status = c.status || (c.passed ? 'pass' : 'needs_improvement');
    if (activeFilter === 'pass') return status === 'pass';
    if (activeFilter === 'needs_improvement') return status === 'needs_improvement';
    if (activeFilter === 'unable_to_verify') return status === 'unable_to_verify';
    return true;
  });

  return (
    <div className="checklist-section">
      <div className="section-header-row">
        <div>
          <h3 className="section-title">Audit Checklist & Scoring Breakdown</h3>
          <p className="section-subtitle">
            Transparent point breakdown for all 11 evaluated engineering standards and documentation checks.
          </p>
        </div>

        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({checks.length})
          </button>
          <button
            type="button"
            className={`filter-pill check-filter-pass ${activeFilter === 'pass' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pass')}
          >
            Passed ({passCount})
          </button>
          <button
            type="button"
            className={`filter-pill check-filter-improve ${activeFilter === 'needs_improvement' ? 'active' : ''}`}
            onClick={() => setActiveFilter('needs_improvement')}
          >
            Needs Improvement ({needsImprovementCount})
          </button>
          {unableToVerifyCount > 0 && (
            <button
              type="button"
              className={`filter-pill check-filter-unverified ${activeFilter === 'unable_to_verify' ? 'active' : ''}`}
              onClick={() => setActiveFilter('unable_to_verify')}
            >
              Unverified ({unableToVerifyCount})
            </button>
          )}
        </div>
      </div>

      <div className="checklist-items">
        {filteredChecks.map((check) => {
          const status = check.status || (check.passed ? 'pass' : 'needs_improvement');
          const isPass = status === 'pass';
          const isUnverified = status === 'unable_to_verify';

          return (
            <div
              key={check.id}
              className={`check-item ${isPass ? 'check-passed' : isUnverified ? 'check-unverified' : 'check-failed'}`}
            >
              <div className="check-status-col">
                <span className={`status-icon-circle ${isPass ? 'pass' : isUnverified ? 'unverified' : 'fail'}`}>
                  {isPass ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : isUnverified ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  )}
                </span>
              </div>

              <div className="check-main-col">
                <div className="check-title-row">
                  <h4 className="check-name">{check.name}</h4>
                  <div className="check-tags">
                    <span className={`status-badge-chip status-${status}`}>
                      {isPass ? 'Pass' : isUnverified ? 'Unable to Verify' : 'Needs Improvement'}
                    </span>
                    <span className="cat-tag">{check.category}</span>
                    <span className={`importance-tag tag-${check.importance}`}>
                      {check.importance}
                    </span>
                  </div>
                </div>

                <p className="check-finding">{check.finding}</p>

                {check.scoreExplanation && (
                  <p className="check-score-explanation">
                    <span className="expl-label">Scoring rationale:</span> {check.scoreExplanation}
                  </p>
                )}
              </div>

              <div className="check-score-col">
                <span className={`check-score-val ${isPass ? 'score-good' : isUnverified ? 'score-neutral' : 'score-zero'}`}>
                  {check.earnedScore} <span className="score-max">/ {check.maxScore} pts</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AuditChecklist;
