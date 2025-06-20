'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  handleKeyboardActivation, 
  navigationA11y, 
  createAriaProps,
  KeyCodes 
} from '../lib/accessibility';

const navItems = [
  { 
    label: 'Dashboard', 
    href: '/', 
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    description: 'View main dashboard and overview'
  },
  { 
    label: 'Organizations', 
    href: '/organizations', 
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    description: 'Manage organizations and users'
  },
  { 
    label: 'Rules', 
    href: '/rules', 
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
    description: 'Configure compliance rules and policies'
  },
  { 
    label: 'Review', 
    href: '/review', 
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    description: 'Review compliance scan results'
  },
  { 
    label: 'Audit Log', 
    href: '/audit-log', 
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    description: 'View system audit logs and activity'
  },
  { 
    label: 'Reports', 
    href: '/reports', 
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    description: 'Generate and view compliance reports'
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  // Handle keyboard navigation within menu
  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    navigationA11y.handleMenuKeyNavigation(
      event,
      focusedIndex,
      navItems.length,
      (index) => {
        setFocusedIndex(index);
        const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (menuItems && menuItems[index]) {
          (menuItems[index] as HTMLElement).focus();
        }
      },
      () => {
        const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (menuItems && focusedIndex >= 0 && menuItems[focusedIndex]) {
          (menuItems[focusedIndex] as HTMLAnchorElement).click();
        }
      }
    );
  };

  // Toggle sidebar with keyboard support
  const handleToggle = () => {
    setCollapsed((c) => !c);
  };

  const handleToggleKeyDown = (event: React.KeyboardEvent) => {
    handleKeyboardActivation(event, handleToggle);
  };

  return (
    <nav 
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`} 
      id="sidebar"
      ref={navRef}
      {...createAriaProps.menu('Main navigation')}
      onKeyDown={handleMenuKeyDown}
    >
      <div className="sidebar__header">
        <div className="logo">
          <Image 
            src="/cybervault_logo.png" 
            alt="CyberVault Logo" 
            width={32} 
            height={32} 
            className="logo__image" 
          />
          <div className="logo__text" aria-hidden={collapsed}>
            <h2>CyberVault</h2>
            <span>Advanced Compliance Automation</span>
          </div>
        </div>
        <button 
          className="sidebar__toggle" 
          id="sidebarToggle" 
          onClick={handleToggle}
          onKeyDown={handleToggleKeyDown}
          {...createAriaProps.button(
            collapsed ? 'Expand sidebar' : 'Collapse sidebar',
            collapsed,
            'sidebar'
          )}
        >
          <span className="sr-only">
            {collapsed ? 'Expand' : 'Collapse'} navigation menu
          </span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>
      
      <div className="sidebar__nav">
        <ul 
          className="nav-menu" 
          ref={menuRef}
          role="menu"
          aria-label="Main navigation menu"
        >
          {navItems.map((item, index) => {
            const isCurrentPage = pathname === item.href;
            return (
              <li className="nav-item" key={item.label} role="none">
                <Link 
                  href={item.href} 
                  className="nav-link"
                  {...createAriaProps.menuItem(isCurrentPage)}
                  aria-describedby={`nav-desc-${index}`}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(-1)}
                >
                  {item.icon}
                  <span className="nav-text">{item.label}</span>
                  <span 
                    id={`nav-desc-${index}`}
                    className="sr-only"
                  >
                    {item.description}
                    {isCurrentPage ? ' (current page)' : ''}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
} 