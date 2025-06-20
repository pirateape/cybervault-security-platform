'use client';

import React, { useState } from 'react';
import { useOrganizations } from '@/libs/data-access/organizationApi';
import { useComplianceReports } from '@/libs/data-access/dashboardApi';

export function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // For now, we'll use a demo user ID - in a real app this would come from auth context
  const demoUserId = 'demo-user-1';
  
  const { data: organizations, isLoading: isLoadingOrgs, error: orgsError } = useOrganizations(demoUserId);
  
  // Get compliance data for each organization
  const orgIds = organizations?.map(org => org.id) || [];
  const complianceQueries = orgIds.map(orgId => useComplianceReports(orgId));

  // Filter organizations based on search and status
  const filteredOrganizations = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.slug.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    // For demo purposes, we'll assign status based on org name
    const orgStatus = org.name.includes('Corp') ? 'active' : 
                     org.name.includes('Ltd') ? 'scanning' : 'warning';
    
    return matchesSearch && orgStatus === statusFilter;
  }) || [];

  // Create enhanced organization data with compliance info
  const enhancedOrganizations = filteredOrganizations.map((org, index) => {
    const complianceData = complianceQueries[organizations?.findIndex(o => o.id === org.id) || 0]?.data;
    const averageScore = complianceData?.length 
      ? Math.round(complianceData.reduce((sum, report) => sum + report.score, 0) / complianceData.length)
      : Math.floor(Math.random() * 30) + 70; // Fallback random score for demo
    
    const criticalIssues = complianceData?.filter(report => report.riskLevel === 'high').length || 
                          Math.floor(Math.random() * 5);
    
    const totalAssets = complianceData?.reduce((sum, report) => sum + (report.findings || 0), 0) || 
                       Math.floor(Math.random() * 50) + 10;

    // Determine status based on compliance score
    let status = 'active';
    if (averageScore < 70) status = 'warning';
    else if (criticalIssues > 3) status = 'scanning';

    return {
      ...org,
      complianceScore: averageScore,
      criticalIssues,
      totalAssets,
      status,
      lastScan: complianceData?.[0]?.lastUpdated || new Date().toISOString()
    };
  });

  if (isLoadingOrgs) {
    return (
      <div className="organizations-page">
        <div className="page-header">
          <h1>Organizations</h1>
          <p className="page-description">Manage and monitor your organizations</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (orgsError) {
    return (
      <div className="organizations-page">
        <div className="page-header">
          <h1>Organizations</h1>
          <p className="page-description">Manage and monitor your organizations</p>
        </div>
        <div className="error-state">
          <p>Error loading organizations: {orgsError.message}</p>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status--success';
      case 'scanning':
        return 'status--info';
      case 'warning':
        return 'status--warning';
      default:
        return 'status--info';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--color-success)';
    if (score >= 75) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div className="organizations-page">
      <div className="page-header">
        <h1>Organizations</h1>
        <p className="page-description">Manage and monitor your organizations</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({organizations?.length || 0})
          </button>
          <button 
            className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-tab ${statusFilter === 'scanning' ? 'active' : ''}`}
            onClick={() => setStatusFilter('scanning')}
          >
            Scanning
          </button>
          <button 
            className={`filter-tab ${statusFilter === 'warning' ? 'active' : ''}`}
            onClick={() => setStatusFilter('warning')}
          >
            Warning
          </button>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="organizations-grid">
        {enhancedOrganizations.length > 0 ? (
          enhancedOrganizations.map((org) => (
            <div key={org.id} className="org-card">
              <div className="org-card-header">
                <div className="org-info">
                  <h3 className="org-name">{org.name}</h3>
                  <p className="org-slug">@{org.slug}</p>
                </div>
                <div className={`status-badge ${org.status}`}>
                  {org.status === 'active' && '✅'}
                  {org.status === 'scanning' && '🔍'}
                  {org.status === 'warning' && '⚠️'}
                  {org.status}
                </div>
              </div>

              <div className="org-metrics">
                <div className="metric">
                  <div className="metric-value">{org.complianceScore}%</div>
                  <div className="metric-label">Compliance Score</div>
                </div>
                <div className="metric">
                  <div className="metric-value">{org.criticalIssues}</div>
                  <div className="metric-label">Critical Issues</div>
                </div>
                <div className="metric">
                  <div className="metric-value">{org.totalAssets}</div>
                  <div className="metric-label">Total Assets</div>
                </div>
              </div>

              <div className="org-footer">
                <div className="last-scan">
                  Last scan: {new Date(org.lastScan).toLocaleDateString()}
                </div>
                <div className="org-actions">
                  <button className="btn-secondary">View Details</button>
                  <button className="btn-primary">Start Scan</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No organizations found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first organization.'}
            </p>
            <button className="btn-primary">Add Organization</button>
          </div>
        )}
      </div>
    </div>
  );
} 