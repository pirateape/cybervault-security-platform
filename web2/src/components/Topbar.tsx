import React from 'react';

export function Topbar({ pageTitle = 'Dashboard' }: { pageTitle?: string }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="btn--secondary btn--sm mobile-menu-toggle" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="breadcrumb">
          <span id="currentPageTitle">{pageTitle}</span>
        </div>
      </div>
      <div className="topbar__right">
        <div className="search-box">
          <input type="text" placeholder="Search..." className="form-control search-input" />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="notifications">
          <button className="btn--secondary btn--sm notification-btn" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-badge">4</span>
          </button>
        </div>
        <div className="user-profile">
          <div className="user-avatar">SJ</div>
          <div className="user-info">
            <span className="user-name">Sarah Johnson</span>
            <span className="user-role">Security Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
} 