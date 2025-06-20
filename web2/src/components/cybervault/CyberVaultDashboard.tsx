'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { RulesPage } from './pages/RulesPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ReportsPage } from './pages/ReportsPage';

export type PageType = 'dashboard' | 'organizations' | 'rules' | 'audit-log' | 'reports';

export function CyberVaultDashboard() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'organizations':
        return <OrganizationsPage />;
      case 'rules':
        return <RulesPage />;
      case 'audit-log':
        return <AuditLogPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardPage />;
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard';
      case 'organizations':
        return 'Organizations';
      case 'rules':
        return 'Rules';
      case 'audit-log':
        return 'Audit Log';
      case 'reports':
        return 'Reports';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="cybervault-app">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      
      <main className="cybervault-main">
        <TopBar
          currentPage={currentPage}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="cybervault-page">
          {renderPage()}
        </div>
      </main>
      
      <style jsx>{`
        .cybervault-app {
          display: flex;
          min-height: 100vh;
          background-color: var(--color-background);
        }
        
        .cybervault-main {
          flex: 1;
          margin-left: ${sidebarCollapsed ? '80px' : '280px'};
          transition: margin-left var(--duration-normal) var(--ease-standard);
        }
        
        .cybervault-page {
          padding: var(--space-24);
        }
        
        @media (max-width: 768px) {
          .cybervault-main {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
} 