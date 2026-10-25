import React from 'react';

function ScoreGauge({ audit }) {
  if (!audit) return null;

  const { score, maxScore = 100, grade, gradeLabel, gradeColor, passedChecksCount, totalChecksCount } = audit;

  // Calculate SVG circular stroke offset
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / maxScore) * circumference;

  return (
    <div className="score-gauge-card">
      <div className="score-visual">
        <svg className="score-ring" width="136" height="136" viewBox="0 0 136 136">
          <circle
            className="ring-bg"
            cx="68"
            cy="68"
            r={radius}
            strokeWidth="10"
          />
          <circle
            className="ring-progress"
            cx="68"
            cy="68"
            r={radius}
            strokeWidth="10"
            stroke={gradeColor || '#58a6ff'}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="score-center-text">
          <span className="score-number">{score}</span>
          <span className="score-max">/ {maxScore}</span>
        </div>
      </div>

      <div className="score-details">
        <div className="grade-badge" style={{ borderColor: gradeColor, color: gradeColor, backgroundColor: `${gradeColor}18` }}>
          Grade {grade}
        </div>
        <h3 className="grade-title">{gradeLabel}</h3>
        <p className="score-summary-text">
          Passed <strong>{passedChecksCount}</strong> of <strong>{totalChecksCount}</strong> evaluated engineering standards.
        </p>

        <div className="score-metric-bar">
          <div
            className="metric-fill"
            style={{ width: `${(passedChecksCount / totalChecksCount) * 100}%`, backgroundColor: gradeColor }}
          />
        </div>
      </div>
    </div>
  );
}

export default ScoreGauge;
