import React from 'react';

function AuditSummaryBar({ audit = {}, repository = {} }) {
  const metrics = audit.metrics || {};
  const projectType = audit.projectType || { language: repository.language || 'General' };

  // Calculate estimated total fix time
  const effortMap = { '5 mins': 5, '10 mins': 10, '15 mins': 15, '30 mins': 30 };
  const totalMinutes = (audit.recommendations || []).reduce((sum, r) => {
    return sum + (effortMap[r.estimatedEffort] || 15);
  }, 0);

  const formatTotalTime = (mins) => {
    if (mins >= 60) {
      const hours = (mins / 60).toFixed(1);
      return `~${hours} hrs`;
    }
    return `~${mins} mins`;
  };

  return (
    <div className="audit-summary-bar">
      <div className="summary-chip lang-chip" title="Detected project language and runtime">
        <span className="summary-icon">💻</span>
        <span className="summary-label">Ecosystem:</span>
        <span className="summary-value">{projectType.language || 'General'}</span>
      </div>

      <div className="summary-chip high-priority-chip" title="Action items with critical impact on readiness">
        <span className="summary-icon">🚨</span>
        <span className="summary-label">High Priority:</span>
        <span className="summary-value">{metrics.highPriorityCount ?? 0}</span>
      </div>

      <div className="summary-chip effort-chip" title="Estimated time to complete all recommendations">
        <span className="summary-icon">⏱️</span>
        <span className="summary-label">Est. Fix Time:</span>
        <span className="summary-value">{formatTotalTime(totalMinutes)}</span>
      </div>

      <div className="summary-chip pass-chip" title="Checks meeting industry standards">
        <span className="summary-icon">✅</span>
        <span className="summary-label">Passed:</span>
        <span className="summary-value">{metrics.passedChecksCount ?? audit.passedChecksCount ?? 0} / {metrics.totalChecksCount ?? audit.totalChecksCount ?? 11}</span>
      </div>

      {(metrics.needsImprovementCount > 0 || (audit.recommendations && audit.recommendations.length > 0)) && (
        <div className="summary-chip attention-chip" title="Checks requiring improvements">
          <span className="summary-icon">⚠️</span>
          <span className="summary-label">Action Items:</span>
          <span className="summary-value">{metrics.needsImprovementCount ?? audit.recommendations?.length ?? 0}</span>
        </div>
      )}
    </div>
  );
}

export default AuditSummaryBar;
