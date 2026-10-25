import React from 'react';

function LoadingSkeleton() {
  return (
    <div className="skeleton-wrapper" aria-label="Analyzing repository, please wait...">
      <div className="skeleton-card skeleton-header-pulse">
        <div className="skeleton-circle" />
        <div className="skeleton-text-group">
          <div className="skeleton-bar skeleton-title-bar" />
          <div className="skeleton-bar skeleton-sub-bar" />
        </div>
      </div>

      <div className="skeleton-grid">
        <div className="skeleton-card skeleton-gauge-pulse">
          <div className="skeleton-circle-large" />
          <div className="skeleton-bar skeleton-mid-bar" />
        </div>

        <div className="skeleton-card skeleton-cat-pulse">
          <div className="skeleton-bar skeleton-title-bar" />
          <div className="skeleton-bar skeleton-sub-bar" />
          <div className="skeleton-bar skeleton-sub-bar" />
        </div>
      </div>

      <div className="skeleton-card skeleton-list-pulse">
        <div className="skeleton-bar skeleton-title-bar" />
        <div className="skeleton-bar" />
        <div className="skeleton-bar" />
        <div className="skeleton-bar" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;
