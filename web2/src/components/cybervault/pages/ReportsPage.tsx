'use client';

import React, { useState } from 'react';
import { useTenantReports, type Report } from '@/libs/data-access/reportApi';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
}

interface ExtendedReport extends Report {
  framework?: string;
  type?: string;
  status: 'completed' | 'generating' | 'failed';
  created_at: string;
  template_id?: string;
}

export function ReportsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // For now, we'll use a demo org ID - in a real app this would come from auth context
  const demoOrgId = 'demo-org-1';

  const { data: reports, isLoading: isLoadingReports, error: reportsError, refetch } = useTenantReports(demoOrgId);

  // Mock report templates - in a real app this would come from an API
  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'NIST Cybersecurity Framework',
      description: 'Comprehensive assessment based on NIST CSF',
      framework: 'NIST CSF'
    },
    {
      id: '2',
      name: 'ISO 27001 Compliance',
      description: 'Information security management assessment',
      framework: 'ISO 27001'
    },
    {
      id: '3',
      name: 'CIS Controls Assessment',
      description: 'Critical security controls evaluation',
      framework: 'CIS Controls'
    },
    {
      id: '4',
      name: 'SOC 2 Type II',
      description: 'Service organization control assessment',
      framework: 'SOC 2'
    },
    {
      id: '5',
      name: 'GDPR Compliance Check',
      description: 'General Data Protection Regulation assessment',
      framework: 'GDPR'
    },
    {
      id: '6',
      name: 'Executive Summary',
      description: 'High-level compliance overview for leadership',
      framework: 'Multi-Framework'
    }
  ];

  // Convert reports to extended format with mock additional data
  const recentReports: ExtendedReport[] = reports?.map((report, index) => ({
    ...report,
    framework: ['NIST CSF', 'ISO 27001', 'GDPR', 'SOC 2'][index % 4],
    type: ['Compliance', 'Security', 'Privacy', 'Audit'][index % 4],
    status: (['completed', 'completed', 'generating', 'failed'] as const)[index % 4],
    created_at: report.createdAt,
    template_id: reportTemplates[index % reportTemplates.length]?.id
  })) || [];

  // Filter templates by framework
  const filteredTemplates = reportTemplates.filter((template: ReportTemplate) => 
    selectedFramework === 'all' || template.framework === selectedFramework
  );

  // Get unique frameworks for filter
  const uniqueFrameworks = [...new Set(reportTemplates.map((template: ReportTemplate) => template.framework))];

  const handleGenerateReport = async (templateId: string) => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      // In a real app, this would call an API to generate the report
      console.log('Generated report for template:', templateId);
      // Refresh the reports list after generation
      refetch();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'generating': return '⏳';
      case 'failed': return '❌';
      default: return '🔵';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'generating': return 'warning';
      case 'failed': return 'error';
      default: return 'info';
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework.toLowerCase()) {
      case 'nist csf': case 'nist': return '🛡️';
      case 'iso 27001': case 'iso': return '📋';
      case 'sox': return '💼';
      case 'gdpr': return '🔒';
      case 'hipaa': return '🏥';
      case 'pci dss': case 'pci': return '💳';
      case 'cis controls': return '🔧';
      case 'soc 2': return '📊';
      case 'multi-framework': return '📈';
      default: return '📊';
    }
  };

  if (isLoadingReports) {
    return (
      <div className="reports-page">
        <div className="page-header">
          <h1>Reports</h1>
          <p className="page-description">Generate and manage compliance reports</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  if (reportsError) {
    return (
      <div className="reports-page">
        <div className="page-header">
          <h1>Reports</h1>
          <p className="page-description">Generate and manage compliance reports</p>
        </div>
        <div className="error-state">
          <p>Error loading reports: {reportsError.message}</p>
          <button onClick={() => refetch()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p className="page-description">Generate and manage compliance reports</p>
      </div>

      {/* Report Templates Section */}
      <div className="templates-section">
        <div className="section-header">
          <h2>Report Templates</h2>
          <div className="framework-filter">
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Frameworks</option>
              {uniqueFrameworks.map((framework: string) => (
                <option key={framework} value={framework}>{framework}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="templates-grid">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template: ReportTemplate) => (
              <div 
                key={template.id} 
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-icon">
                  {getFrameworkIcon(template.framework)}
                </div>
                <div className="template-content">
                  <h3 className="template-name">{template.name}</h3>
                  <p className="template-description">{template.description}</p>
                  <div className="template-framework">
                    <span className="framework-badge">{template.framework}</span>
                  </div>
                </div>
                <div className="template-actions">
                  <button 
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateReport(template.id);
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No templates found</h3>
              <p>
                {selectedFramework !== 'all' 
                  ? `No templates available for ${selectedFramework}.`
                  : 'No report templates are available.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Reports Section */}
      <div className="recent-reports-section">
        <div className="section-header">
          <h2>Recent Reports</h2>
          <button onClick={() => refetch()} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>

        <div className="reports-table-container">
          {recentReports && recentReports.length > 0 ? (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Framework</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report: ExtendedReport) => (
                  <tr key={report.id}>
                    <td className="report-name">
                      <div className="report-info">
                        <span className="report-icon">
                          {getFrameworkIcon(report.framework || '')}
                        </span>
                        {report.name}
                      </div>
                    </td>
                    <td className="framework">
                      <span className="framework-badge">
                        {report.framework || 'General'}
                      </span>
                    </td>
                    <td className="type">{report.type || 'Compliance'}</td>
                    <td className="status">
                      <span className={`status-badge ${getStatusClass(report.status)}`}>
                        {getStatusIcon(report.status)} {report.status}
                      </span>
                    </td>
                    <td className="created">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="actions">
                      <div className="action-buttons">
                        {report.status === 'completed' && (
                          <>
                            <button className="btn-secondary btn-sm">📥 Download</button>
                            <button className="btn-secondary btn-sm">👁️ View</button>
                          </>
                        )}
                        {report.status === 'failed' && (
                          <button 
                            className="btn-primary btn-sm"
                            onClick={() => handleGenerateReport(report.template_id || '')}
                          >
                            🔄 Retry
                          </button>
                        )}
                        <button className="btn-secondary btn-sm">🗑️ Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No reports generated yet</h3>
              <p>Generate your first report using one of the templates above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 