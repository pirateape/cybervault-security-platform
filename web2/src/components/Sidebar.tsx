'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
  { label: 'Dashboard', href: '/', icon: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ) },
  { label: 'Organizations', href: '/organizations', icon: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ) },
  { label: 'Rules', href: '/rules', icon: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
  ) },
  { label: 'Audit Log', href: '/audit-log', icon: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ) },
  { label: 'Reports', href: '/reports', icon: (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ) },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <nav className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`} id="sidebar">
      <div className="sidebar__header">
        <div className="logo">
          <Image src="/cybervault_logo.png" alt="CyberVault Logo" width={32} height={32} className="logo__image" />
          <div className="logo__text">
            <h2>CyberVault</h2>
            <span>Advanced Compliance Automation</span>
          </div>
        </div>
        <button className="sidebar__toggle" id="sidebarToggle" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <div className="sidebar__nav">
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li className="nav-item" key={item.label}>
              <Link href={item.href} className="nav-link">
                {item.icon}
                <span className="nav-text">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
} 