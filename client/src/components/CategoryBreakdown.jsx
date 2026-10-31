import React from 'react';

function CategoryBreakdown({ categories }) {
  if (!categories) return null;

  const categoryIcons = {
    'Documentation': '📄',
    'Code Health': '🧪',
    'Automation': '⚡',
    'Community': '👥',
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 85) return 'var(--accent-green)';
    if (percentage >= 65) return 'var(--accent-blue)';
    if (percentage >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div className="categories-grid">
      {Object.entries(categories).map(([name, data]) => {
        const color = getStatusColor(data.percentage);
        const icon = categoryIcons[name] || '📊';

        return (
          <div key={name} className="category-card">
            <div className="cat-card-header">
              <span className="cat-icon">{icon}</span>
              <span className="cat-percentage" style={{ color }}>
                {data.percentage}%
              </span>
            </div>

            <h4 className="cat-name">{name}</h4>
            <p className="cat-score">
              {data.earned} <span className="cat-max">/ {data.max} pts</span>
            </p>

            <div className="cat-progress-track">
              <div
                className="cat-progress-fill"
                style={{
                  width: `${data.percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CategoryBreakdown;
