'use client';

import React, { useState } from 'react';
import { useAuditLogs, type AuditLogFilter } from '@/libs/data-access/auditLogApi';

export function AuditLogPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');

  // Build filter object for the API call
  const filter: AuditLogFilter = {
    ...(fromDate && { from: new Date(fromDate).toISOString() }),
    ...(toDate && { to: new Date(toDate).toISOString() }),
    ...(selectedUser !== 'all' && { user_id: selectedUser }),
    ...(selectedAction !== 'all' && { event_type: selectedAction }),
    limit: 50
  };

  const { data: auditEntries, isLoading, error, refetch } = useAuditLogs(filter);

  // Get unique users and actions for filter dropdowns
  const uniqueUsers = [...new Set(auditEntries?.map(entry => entry.user_id) || [])];
  const uniqueActions = [...new Set(auditEntries?.map(entry => entry.event_type) || [])];

  const handleExport = () => {
    if (!auditEntries || auditEntries.length === 0) return;
    
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Outcome', 'IP Address'].join(','),
      ...auditEntries.map(entry => [
        entry.timestamp,
        entry.user_id,
        entry.event_type,
        entry.resource || '',
        entry.outcome || '',
        entry.ip_address || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (outcome: string | undefined) => {
    switch (outcome?.toLowerCase()) {
      case 'success': return '✅';
      case 'failure': case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '🔵';
    }
  };

  const getStatusClass = (outcome: string | undefined) => {
    switch (outcome?.toLowerCase()) {
      case 'success': return 'success';
      case 'failure': case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  if (isLoading) {
    return (
      <div className="audit-log-page">
        <div className="page-header">
          <h1>Audit Log</h1>
          <p className="page-description">Track all system activities and changes</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading audit log entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audit-log-page">
        <div className="page-header">
          <h1>Audit Log</h1>
          <p className="page-description">Track all system activities and changes</p>
        </div>
        <div className="error-state">
          <p>Error loading audit log: {error.message}</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-log-page">
      <div className="page-header">
        <h1>Audit Log</h1>
        <p className="page-description">Track all system activities and changes</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="from-date">From Date</label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="to-date">To Date</label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="user-filter">User</label>
            <select
              id="user-filter"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="action-filter">Action</label>
            <select
              id="action-filter"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={() => refetch()} className="btn-secondary">
              🔄 Refresh
            </button>
            <button onClick={handleExport} className="btn-primary">
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {auditEntries?.length || 0} entries
          {filter.from && ` from ${new Date(filter.from).toLocaleDateString()}`}
          {filter.to && ` to ${new Date(filter.to).toLocaleDateString()}`}
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="audit-table-container">
        {auditEntries && auditEntries.length > 0 ? (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className="timestamp">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="user">{entry.user_id}</td>
                  <td className="action">
                    <span className="action-badge">{entry.event_type}</span>
                  </td>
                  <td className="resource">{entry.resource || '-'}</td>
                  <td className="status">
                    <span className={`status-badge ${getStatusClass(entry.outcome)}`}>
                      {getStatusIcon(entry.outcome)} {entry.outcome || 'Unknown'}
                    </span>
                  </td>
                  <td className="ip-address">{entry.ip_address || '-'}</td>
                  <td className="details">
                    {entry.details ? (
                      <details>
                        <summary>View</summary>
                        <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                      </details>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No audit entries found</h3>
            <p>
              {Object.keys(filter).length > 1 
                ? 'Try adjusting your filter criteria to see more results.'
                : 'No audit log entries are available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 