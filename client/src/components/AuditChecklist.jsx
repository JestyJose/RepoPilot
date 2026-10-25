import React, { useState } from 'react';

function AuditChecklist({ checks = [] }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'passed' | 'failed'

  const passedCount = checks.filter(c => c.passed).length;
  const failedCount = checks.filter(c => !c.passed).length;

  const filteredChecks = checks.filter(c => {
    if (activeFilter === 'passed') return c.passed;
    if (activeFilter === 'failed') return !c.passed;
    return true;
  });

  return (
    <div className="checklist-section">
      <div className="section-header-row">
        <div>
          <h3 className="section-title">Audit Checklist</h3>
          <p className="section-subtitle">Detailed breakdown of repository checks and engineering signals.</p>
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
            className={`filter-pill ${activeFilter === 'passed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('passed')}
          >
            Passed ({passedCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeFilter === 'failed' ? 'active' : ''}`}
            onClick={() => setActiveFilter('failed')}
          >
            Needs Attention ({failedCount})
          </button>
        </div>
      </div>

      <div className="checklist-items">
        {filteredChecks.map((check) => {
          const isPassed = check.passed;
          return (
            <div
              key={check.id}
              className={`check-item ${isPassed ? 'check-passed' : 'check-failed'}`}
            >
              <div className="check-status-col">
                <span className={`status-icon-circle ${isPassed ? 'pass' : 'fail'}`}>
                  {isPassed ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
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
                    <span className="cat-tag">{check.category}</span>
                    <span className={`importance-tag tag-${check.importance}`}>
                      {check.importance}
                    </span>
                  </div>
                </div>

                <p className="check-finding">{check.finding}</p>
              </div>

              <div className="check-score-col">
                <span className={`check-score-val ${isPassed ? 'score-good' : 'score-zero'}`}>
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
