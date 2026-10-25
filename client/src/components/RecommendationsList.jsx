import React from 'react';

function RecommendationsList({ recommendations = [] }) {
  if (recommendations.length === 0) {
    return (
      <div className="recommendations-empty-card">
        <div className="perfect-score-icon">🎉</div>
        <h3>Outstanding Repository Readiness!</h3>
        <p>No critical gaps detected. This repository adheres to industry documentation, testing, CI/CD, and community standards.</p>
      </div>
    );
  }

  const priorityLabels = {
    high: { label: 'High Priority', color: '#f85149', bg: 'rgba(248, 81, 73, 0.15)' },
    medium: { label: 'Medium Priority', color: '#d29922', bg: 'rgba(210, 153, 34, 0.15)' },
    low: { label: 'Low Priority', color: '#58a6ff', bg: 'rgba(88, 166, 255, 0.15)' },
  };

  return (
    <div className="recommendations-section">
      <div className="section-header-row">
        <div>
          <h3 className="section-title">Actionable Improvement Plan</h3>
          <p className="section-subtitle">
            Follow these prioritized recommendations to elevate your repository readiness for hiring managers.
          </p>
        </div>
        <span className="rec-count-badge">
          {recommendations.length} action item{recommendations.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="recommendations-list">
        {recommendations.map((rec, index) => {
          const config = priorityLabels[rec.priority] || priorityLabels.medium;

          return (
            <div key={rec.checkId || index} className="recommendation-card">
              <div className="rec-top-row">
                <span
                  className="priority-badge"
                  style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color }}
                >
                  {config.label}
                </span>
                <h4 className="rec-title">{rec.title}</h4>
              </div>

              <div className="rec-why-box">
                <span className="rec-label-tag">Why this matters:</span>
                <p className="rec-why-text">{rec.why}</p>
              </div>

              <div className="rec-action-box">
                <span className="rec-label-tag action-tag">Recommended Action:</span>
                <p className="rec-action-text">{rec.action}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecommendationsList;
