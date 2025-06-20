'use client';

import React, { useState } from 'react';

export function RulesPage() {
  const [activeTab, setActiveTab] = useState('all');

  const rules = [
    {
      id: 1,
      title: 'Multi-Factor Authentication Required',
      description: 'Enforce MFA for all user accounts accessing sensitive systems',
      category: 'Authentication',
      severity: 'High',
      status: 'Active',
      framework: 'NIST',
    },
    {
      id: 2,
      title: 'Data Encryption at Rest',
      description: 'All sensitive data must be encrypted when stored in databases',
      category: 'Data Protection',
      severity: 'Critical',
      status: 'Active',
      framework: 'ISO 27001',
    },
    {
      id: 3,
      title: 'Regular Security Assessments',
      description: 'Conduct quarterly security assessments and vulnerability scans',
      category: 'Assessment',
      severity: 'Medium',
      status: 'Draft',
      framework: 'SOC 2',
    },
    {
      id: 4,
      title: 'Access Control Review',
      description: 'Monthly review of user access permissions and privileges',
      category: 'Access Control',
      severity: 'High',
      status: 'Active',
      framework: 'PCI DSS',
    },
    {
      id: 5,
      title: 'Incident Response Plan',
      description: 'Maintain and test incident response procedures annually',
      category: 'Incident Management',
      severity: 'High',
      status: 'Inactive',
      framework: 'NIST',
    },
  ];

  const tabs = [
    { id: 'all', label: 'All Rules', count: rules.length },
    { id: 'active', label: 'Active', count: rules.filter(r => r.status === 'Active').length },
    { id: 'draft', label: 'Draft', count: rules.filter(r => r.status === 'Draft').length },
    { id: 'inactive', label: 'Inactive', count: rules.filter(r => r.status === 'Inactive').length },
  ];

  const filteredRules = activeTab === 'all' 
    ? rules 
    : rules.filter(rule => rule.status.toLowerCase() === activeTab);

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'status--error';
      case 'high':
        return 'status--warning';
      case 'medium':
        return 'status--info';
      default:
        return 'status--info';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status--success';
      case 'draft':
        return 'status--warning';
      case 'inactive':
        return 'status--error';
      default:
        return 'status--info';
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Rules</h1>
        <p className="page-subtitle">Manage compliance rules and policies</p>
      </div>

      <div style={{ marginBottom: 'var(--space-32)' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-24)'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--space-12) var(--space-20)',
                border: 'none',
                background: 'none',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-standard)',
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 'var(--space-16)' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search rules..."
              style={{ width: '300px' }}
            />
            <select className="form-control" style={{ width: '150px' }}>
              <option value="">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="data-protection">Data Protection</option>
              <option value="access-control">Access Control</option>
              <option value="assessment">Assessment</option>
              <option value="incident-management">Incident Management</option>
            </select>
          </div>
          <button className="btn btn--primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Rule
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: 'var(--space-24)' 
      }}>
        {filteredRules.map((rule) => (
          <div key={rule.id} className="card">
            <div className="card__body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-12)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', flex: 1 }}>
                  {rule.title}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
                  <span className={`status ${getSeverityClass(rule.severity)}`}>
                    {rule.severity}
                  </span>
                  <span className={`status ${getStatusClass(rule.status)}`}>
                    {rule.status}
                  </span>
                </div>
              </div>

              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-text-secondary)', 
                marginBottom: 'var(--space-16)',
                lineHeight: 'var(--line-height-normal)'
              }}>
                {rule.description}
              </p>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--space-16)'
              }}>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Category: 
                  </span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    {rule.category}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    Framework: 
                  </span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    {rule.framework}
                  </span>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 'var(--space-8)',
                paddingTop: 'var(--space-16)',
                borderTop: '1px solid var(--color-card-border-inner)'
              }}>
                <button className="btn btn--sm btn--outline">
                  Edit
                </button>
                <button className="btn btn--sm btn--secondary">
                  Duplicate
                </button>
                <button className="btn btn--sm btn--outline">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRules.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: 'var(--space-32)',
          color: 'var(--color-text-secondary)'
        }}>
          <p>No rules found for the selected filter.</p>
        </div>
      )}
    </div>
  );
} 