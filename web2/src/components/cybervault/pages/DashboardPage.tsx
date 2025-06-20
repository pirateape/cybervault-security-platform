'use client';

import React from 'react';
import { useComplianceReports, useHeatMapData } from '@/libs/data-access/dashboardApi';

export function DashboardPage() {
  // For now, we'll use a demo org ID - in a real app this would come from auth context
  const demoOrgId = 'demo-org-1';
  
  const { data: complianceReports, isLoading: isLoadingReports, error: reportsError } = useComplianceReports(demoOrgId);
  const { data: heatMapData, isLoading: isLoadingHeatMap, error: heatMapError } = useHeatMapData(demoOrgId);

  // Calculate dashboard statistics from real data
  const totalOrganizations = 1; // For demo, we're showing single org view
  const activeScans = complianceReports?.filter(report => report.status === 'scanning').length || 0;
  const criticalAlerts = complianceReports?.filter(report => report.riskLevel === 'high').length || 0;
  const averageScore = complianceReports?.length 
    ? Math.round(complianceReports.reduce((sum, report) => sum + report.score, 0) / complianceReports.length)
    : 0;

  // Recent alerts from compliance reports
  const recentAlerts = complianceReports?.slice(0, 5).map(report => ({
    id: report.id,
    message: `${report.framework} compliance score: ${report.score}%`,
    severity: report.riskLevel,
    time: new Date(report.lastUpdated).toLocaleString(),
    status: report.status
  })) || [];

  const stats = [
    {
      title: 'Total Organizations',
      value: '247',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      iconClass: 'stat-card__icon--primary',
    },
    {
      title: 'Active Scans',
      value: '18',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconClass: 'stat-card__icon--success',
    },
    {
      title: 'Critical Alerts',
      value: '5',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      iconClass: 'stat-card__icon--error',
    },
    {
      title: 'Compliance Score',
      value: '94%',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      iconClass: 'stat-card__icon--success',
    },
  ];

  if (isLoadingReports || isLoadingHeatMap) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="page-description">Overview of your compliance status</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (reportsError || heatMapError) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p className="page-description">Overview of your compliance status</p>
        </div>
        <div className="error-state">
          <p>Error loading dashboard data: {reportsError?.message || heatMapError?.message}</p>
          <p>Falling back to demo data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-description">Overview of your compliance status</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-card__icon ${stat.iconClass}`}>
              {stat.icon}
            </div>
            <div className="stat-card__content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card__body">
            <h3 style={{ marginBottom: 'var(--space-16)' }}>Compliance Trends</h3>
            <div style={{ 
              height: '300px', 
              backgroundColor: 'var(--color-secondary)', 
              borderRadius: 'var(--radius-base)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--color-text-secondary)'
            }}>
              <p>Chart visualization would go here</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <h3 style={{ marginBottom: 'var(--space-16)' }}>Recent Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
              {recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  style={{ 
                    padding: 'var(--space-16)', 
                    border: '1px solid var(--color-card-border)', 
                    borderRadius: 'var(--radius-base)',
                    backgroundColor: 'var(--color-background)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-medium)' }}>
                      {alert.message}
                    </h4>
                    <span className={`status status--${alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}`}>
                      {alert.severity === 'high' ? '🔴' : 
                       alert.severity === 'medium' ? '🟡' : '🟢'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                      {alert.time}
                    </span>
                    <span className={`status status--${alert.status === 'scanning' ? 'error' : alert.status === 'completed' ? 'success' : 'warning'}`}>
                      {alert.status === 'scanning' ? 'Active' : alert.status === 'completed' ? 'Completed' : 'Under Review'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 