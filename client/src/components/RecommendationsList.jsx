import React, { useState } from 'react';

function RecommendationsList({ recommendations = [] }) {
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'Documentation' | 'Code Health' | 'Automation' | 'Community'
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [copiedId, setCopiedId] = useState(null);

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
    high: { label: 'High Priority', color: 'var(--accent-red)', bg: 'var(--badge-red-bg)' },
    medium: { label: 'Medium Priority', color: 'var(--accent-amber)', bg: 'var(--badge-amber-bg)' },
    low: { label: 'Low Priority', color: 'var(--accent-blue)', bg: 'var(--badge-blue-bg)' },
  };

  const categories = ['Documentation', 'Code Health', 'Automation', 'Community'];

  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesPriority = priorityFilter === 'all' || rec.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || rec.category === categoryFilter;
    return matchesPriority && matchesCategory;
  });

  const toggleTemplate = (id) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="recommendations-section">
      <div className="section-header-row">
        <div>
          <h3 className="section-title">Actionable Improvement Plan</h3>
          <p className="section-subtitle">
            Tailored step-by-step recommendations with starter templates to bring your repository up to industry hiring standards.
          </p>
        </div>
        <span className="rec-count-badge">
          {filteredRecommendations.length} of {recommendations.length} action item{recommendations.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Filter Controls Bar */}
      <div className="recommendation-filters-bar">
        <div className="filter-group">
          <span className="filter-group-label">Priority:</span>
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${priorityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-pill priority-pill-high ${priorityFilter === 'high' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('high')}
            >
              High ({recommendations.filter(r => r.priority === 'high').length})
            </button>
            <button
              type="button"
              className={`filter-pill priority-pill-medium ${priorityFilter === 'medium' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('medium')}
            >
              Medium ({recommendations.filter(r => r.priority === 'medium').length})
            </button>
            <button
              type="button"
              className={`filter-pill priority-pill-low ${priorityFilter === 'low' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('low')}
            >
              Low ({recommendations.filter(r => r.priority === 'low').length})
            </button>
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-group-label">Category:</span>
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredRecommendations.length === 0 ? (
        <div className="recommendations-none-match">
          <p>No action items match the selected filters.</p>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => { setPriorityFilter('all'); setCategoryFilter('all'); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="recommendations-list">
          {filteredRecommendations.map((rec, index) => {
            const config = priorityLabels[rec.priority] || priorityLabels.medium;
            const cardId = rec.id || `rec-${index}`;
            const isTemplateOpen = Boolean(expandedTemplates[cardId]);
            const isCopied = copiedId === cardId;

            return (
              <div key={cardId} className="recommendation-card">
                <div className="rec-top-row">
                  <div className="rec-badge-group">
                    <span
                      className="priority-badge"
                      style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className="cat-tag">{rec.category}</span>
                    {rec.estimatedEffort && (
                      <span className="effort-badge">
                        ⏱️ {rec.estimatedEffort}
                      </span>
                    )}
                  </div>
                  <h4 className="rec-title">{rec.title}</h4>
                </div>

                {/* Evidence Box */}
                {rec.evidence && (
                  <div className="rec-evidence-box">
                    <span className="rec-label-tag evidence-tag">Repository Evidence:</span>
                    <p className="rec-evidence-text">{rec.evidence}</p>
                  </div>
                )}

                {/* Why this matters */}
                <div className="rec-why-box">
                  <span className="rec-label-tag">Why this matters:</span>
                  <p className="rec-why-text">{rec.why}</p>
                </div>

                {/* Recommended Fix */}
                <div className="rec-action-box">
                  <span className="rec-label-tag action-tag">Recommended Fix:</span>
                  <p className="rec-action-text">{rec.recommendedFix || rec.action}</p>
                  {rec.filePath && (
                    <div className="rec-file-pill">
                      <span className="file-icon">📄</span>
                      <code>{rec.filePath}</code>
                    </div>
                  )}
                </div>

                {/* Verification Condition */}
                {rec.verificationCondition && (
                  <div className="rec-verify-box">
                    <span className="rec-label-tag verify-tag">Verification Condition:</span>
                    <p className="rec-verify-text">{rec.verificationCondition}</p>
                  </div>
                )}

                {/* Copyable Starter Template Action */}
                {rec.starterTemplate && (
                  <div className="rec-template-wrapper">
                    <div className="template-toggle-row">
                      <button
                        type="button"
                        className="btn-toggle-template"
                        onClick={() => toggleTemplate(cardId)}
                      >
                        {isTemplateOpen ? '▲ Hide Starter Template' : '▼ View Starter Template'}
                      </button>

                      <button
                        type="button"
                        className={`btn-copy-template ${isCopied ? 'copied' : ''}`}
                        onClick={() => handleCopy(cardId, rec.starterTemplate)}
                        title="Copy template to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            Copy Template
                          </>
                        )}
                      </button>
                    </div>

                    {isTemplateOpen && (
                      <div className="template-code-block">
                        <div className="template-code-header">
                          <span className="template-target-path">{rec.filePath || 'Template'}</span>
                          <span className="template-badge">Starter Example</span>
                        </div>
                        <pre className="template-pre">
                          <code>{rec.starterTemplate}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecommendationsList;
