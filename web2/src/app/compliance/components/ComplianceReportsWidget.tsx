'use client';

import React, { useState, useMemo } from 'react';
import { 
  useComplianceSummary,
  type ComplianceSummary
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface ComplianceReportsWidgetProps {
  className?: string;
  showDetailedView?: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'technical' | 'regulatory' | 'operational';
  format: 'pdf' | 'excel' | 'word' | 'powerpoint';
  sections: string[];
  frequency: 'on-demand' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  lastGenerated?: string;
  nextScheduled?: string;
  enabled: boolean;
  customizable: boolean;
}

interface ReportSection {
  id: string;
  name: string;
  description: string;
  category: string;
  required: boolean;
  dataSource: string;
  estimatedSize: string;
}

interface ScheduledReport {
  id: string;
  templateId: string;
  templateName: string;
  schedule: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    timezone: string;
  };
  recipients: string[];
  lastRun?: string;
  nextRun: string;
  status: 'active' | 'paused' | 'failed';
  deliveryMethod: 'email' | 'sharepoint' | 'teams' | 'webhook';
}

export function ComplianceReportsWidget({ 
  className = '', 
  showDetailedView = false 
}: ComplianceReportsWidgetProps) {
  const { data: complianceSummary, isLoading, error, refetch } = useComplianceSummary();
  const [selectedView, setSelectedView] = useState<'templates' | 'generate' | 'scheduled' | 'history'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSections, setCustomSections] = useState<string[]>([]);

  // Report templates
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'executive-summary',
      name: 'Executive Compliance Summary',
      description: 'High-level compliance overview for leadership with key metrics and trends',
      type: 'executive',
      format: 'pdf',
      sections: ['compliance-score', 'key-metrics', 'risk-summary', 'recommendations'],
      frequency: 'monthly',
      recipients: ['ceo@company.com', 'ciso@company.com'],
      lastGenerated: '2024-12-15T10:00:00Z',
      nextScheduled: '2025-01-15T10:00:00Z',
      enabled: true,
      customizable: false,
    },
    {
      id: 'technical-detailed',
      name: 'Technical Compliance Report',
      description: 'Detailed technical analysis with specific findings and remediation steps',
      type: 'technical',
      format: 'excel',
      sections: ['mfa-analysis', 'conditional-access', 'encryption-status', 'inactive-users', 'policy-gaps'],
      frequency: 'weekly',
      recipients: ['security-team@company.com'],
      lastGenerated: '2024-12-18T09:00:00Z',
      nextScheduled: '2024-12-25T09:00:00Z',
      enabled: true,
      customizable: true,
    },
    {
      id: 'regulatory-compliance',
      name: 'Regulatory Compliance Report',
      description: 'Compliance status against regulatory frameworks (SOC 2, ISO 27001, GDPR)',
      type: 'regulatory',
      format: 'pdf',
      sections: ['regulatory-mapping', 'compliance-gaps', 'audit-evidence', 'remediation-plan'],
      frequency: 'quarterly',
      recipients: ['compliance@company.com', 'legal@company.com'],
      lastGenerated: '2024-10-01T08:00:00Z',
      nextScheduled: '2025-01-01T08:00:00Z',
      enabled: true,
      customizable: false,
    },
    {
      id: 'operational-dashboard',
      name: 'Operational Compliance Dashboard',
      description: 'Day-to-day operational compliance metrics for security operations',
      type: 'operational',
      format: 'powerpoint',
      sections: ['daily-metrics', 'alert-summary', 'trending-issues', 'action-items'],
      frequency: 'daily',
      recipients: ['security-operations@company.com'],
      lastGenerated: '2024-12-19T06:00:00Z',
      nextScheduled: '2024-12-21T06:00:00Z',
      enabled: true,
      customizable: true,
    },
  ];

  // Available report sections
  const availableSections: ReportSection[] = [
    {
      id: 'compliance-score',
      name: 'Compliance Score Overview',
      description: 'Overall compliance score with trend analysis',
      category: 'Summary',
      required: false,
      dataSource: 'Compliance Scoring Engine',
      estimatedSize: '1-2 pages',
    },
    {
      id: 'key-metrics',
      name: 'Key Performance Metrics',
      description: 'Critical compliance KPIs and benchmarks',
      category: 'Metrics',
      required: false,
      dataSource: 'Metrics Aggregator',
      estimatedSize: '2-3 pages',
    },
    {
      id: 'mfa-analysis',
      name: 'MFA Compliance Analysis',
      description: 'Detailed MFA adoption and effectiveness analysis',
      category: 'Authentication',
      required: false,
      dataSource: 'MFA Monitoring System',
      estimatedSize: '3-4 pages',
    },
    {
      id: 'conditional-access',
      name: 'Conditional Access Policy Review',
      description: 'Policy effectiveness and gap analysis',
      category: 'Access Control',
      required: false,
      dataSource: 'Policy Analysis Engine',
      estimatedSize: '4-5 pages',
    },
    {
      id: 'encryption-status',
      name: 'Encryption Compliance Status',
      description: 'Data protection and encryption coverage analysis',
      category: 'Data Protection',
      required: false,
      dataSource: 'Encryption Monitoring',
      estimatedSize: '3-4 pages',
    },
    {
      id: 'inactive-users',
      name: 'Inactive User Risk Assessment',
      description: 'Identity hygiene and inactive account analysis',
      category: 'Identity Management',
      required: false,
      dataSource: 'Identity Management System',
      estimatedSize: '2-3 pages',
    },
    {
      id: 'policy-gaps',
      name: 'Policy Gap Analysis',
      description: 'Identified gaps and remediation recommendations',
      category: 'Governance',
      required: false,
      dataSource: 'Policy Engine',
      estimatedSize: '3-5 pages',
    },
    {
      id: 'risk-summary',
      name: 'Risk Summary',
      description: 'Top risks and mitigation strategies',
      category: 'Risk Management',
      required: false,
      dataSource: 'Risk Assessment Engine',
      estimatedSize: '2-3 pages',
    },
    {
      id: 'recommendations',
      name: 'Recommendations',
      description: 'Prioritized action items and next steps',
      category: 'Actions',
      required: false,
      dataSource: 'Recommendation Engine',
      estimatedSize: '1-2 pages',
    },
    {
      id: 'regulatory-mapping',
      name: 'Regulatory Framework Mapping',
      description: 'Compliance status against specific regulations',
      category: 'Regulatory',
      required: false,
      dataSource: 'Regulatory Mapping System',
      estimatedSize: '5-8 pages',
    },
  ];

  // Scheduled reports
  const scheduledReports: ScheduledReport[] = [
    {
      id: 'exec-monthly',
      templateId: 'executive-summary',
      templateName: 'Executive Compliance Summary',
      schedule: {
        frequency: 'monthly',
        dayOfMonth: 15,
        time: '10:00',
        timezone: 'UTC',
      },
      recipients: ['ceo@company.com', 'ciso@company.com'],
      lastRun: '2024-12-15T10:00:00Z',
      nextRun: '2025-01-15T10:00:00Z',
      status: 'active',
      deliveryMethod: 'email',
    },
    {
      id: 'tech-weekly',
      templateId: 'technical-detailed',
      templateName: 'Technical Compliance Report',
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        time: '09:00',
        timezone: 'UTC',
      },
      recipients: ['security-team@company.com'],
      lastRun: '2024-12-18T09:00:00Z',
      nextRun: '2024-12-25T09:00:00Z',
      status: 'active',
      deliveryMethod: 'email',
    },
  ];

  // Calculate report generation status
  const reportMetrics = useMemo(() => {
    const totalTemplates = reportTemplates.length;
    const activeTemplates = reportTemplates.filter(t => t.enabled).length;
    const scheduledCount = scheduledReports.filter(r => r.status === 'active').length;
    const recentReports = reportTemplates.filter(t => 
      t.lastGenerated && new Date(t.lastGenerated) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalTemplates,
      activeTemplates,
      scheduledCount,
      recentReports,
    };
  }, [reportTemplates, scheduledReports]);

  // Handle report generation
  const handleGenerateReport = async (templateId: string, sections?: string[]) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (!template) return;

    try {
      // Map template to export options
      const reportTypeMap: Record<string, string> = {
        'executive-summary': 'executive',
        'technical-detailed': 'technical',
        'regulatory-compliance': 'audit',
        'operational-dashboard': 'comprehensive'
      };

      const formatMap: Record<string, string> = {
        'pdf': 'pdf',
        'excel': 'excel',
        'word': 'pdf', // Fallback to PDF
        'powerpoint': 'pdf' // Fallback to PDF
      };

      const params = new URLSearchParams({
        format: formatMap[template.format] || 'pdf',
        type: reportTypeMap[templateId] || 'comprehensive',
        includeCharts: 'true',
      });

      if (template.recipients.length > 0) {
        params.append('emailRecipients', template.recipients.join(','));
      }

      const response = await fetch(`/api/compliance-export?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      if (template.recipients.length > 0) {
        // Email was sent
        const result = await response.json();
        alert(`Report "${template.name}" sent successfully to ${result.recipients.join(', ')}`);
      } else {
        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
          `compliance-report-${templateId}-${new Date().toISOString().split('T')[0]}.${formatMap[template.format] || 'pdf'}`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        alert(`Report "${template.name}" downloaded successfully: ${filename}`);
      }
    } catch (error: any) {
      console.error('Report generation error:', error);
      alert(`Failed to generate report "${template.name}": ${error.message}`);
    }
  };

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Reports</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load compliance reports'}
          </p>
          <Button onClick={() => refetch()} size="sm" variant="solid" colorScheme="primary">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Reports</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {(['templates', 'generate', 'scheduled', 'history'] as const).map((view) => (
              <Button
                key={view}
                variant={selectedView === view ? 'solid' : 'outline'}
                colorScheme={selectedView === view ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedView(view)}
                className="text-xs capitalize"
              >
                {view}
              </Button>
            ))}
          </div>
          <IconButton
            icon={<span className="text-sm">🔄</span>}
            onClick={() => refetch()}
            ariaLabel="Refresh reports"
            variant="ghost"
            colorScheme="secondary"
            size="sm"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{reportMetrics.totalTemplates}</div>
          <div className="text-xs text-blue-600">Templates</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{reportMetrics.activeTemplates}</div>
          <div className="text-xs text-green-600">Active</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">{reportMetrics.scheduledCount}</div>
          <div className="text-xs text-purple-600">Scheduled</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{reportMetrics.recentReports}</div>
          <div className="text-xs text-orange-600">This Week</div>
        </div>
      </div>

      {/* Templates Tab */}
      {selectedView === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Report Templates</h4>
            <Button size="sm" variant="solid" colorScheme="primary">
              Create Template
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{template.name}</h5>
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        {template.type.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        {template.format.toUpperCase()}
                      </span>
                      {template.enabled && (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        <strong>Frequency:</strong> {template.frequency}
                      </div>
                      <div>
                        <strong>Sections:</strong> {template.sections.length} included
                      </div>
                      <div>
                        <strong>Recipients:</strong> {template.recipients.length} configured
                      </div>
                      {template.lastGenerated && (
                        <div>
                          <strong>Last Generated:</strong> {new Date(template.lastGenerated).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="solid" 
                      colorScheme="primary"
                      onClick={() => handleGenerateReport(template.id)}
                    >
                      Generate Now
                    </Button>
                    {template.customizable && (
                      <Button size="sm" variant="outline" colorScheme="secondary">
                        Customize
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <IconButton
                      icon={<span className="text-sm">⚙️</span>}
                      ariaLabel="Configure template"
                      variant="ghost"
                      colorScheme="secondary"
                      size="sm"
                    />
                    <IconButton
                      icon={<span className="text-sm">📋</span>}
                      ariaLabel="Copy template"
                      variant="ghost"
                      colorScheme="secondary"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {selectedView === 'generate' && (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Generate Custom Report</h4>
            
            {/* Template Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Select Base Template
              </label>
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Choose a template...</option>
                {reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Section Selection */}
            {selectedTemplate && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Customize Sections
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableSections.map((section) => (
                    <label key={section.id} className="flex items-start space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={customSections.includes(section.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomSections([...customSections, section.id]);
                          } else {
                            setCustomSections(customSections.filter(id => id !== section.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{section.name}</div>
                        <div className="text-xs text-gray-600">{section.description}</div>
                        <div className="text-xs text-gray-500">
                          {section.category} • {section.estimatedSize}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Generation Options */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select className="w-full text-sm border border-gray-300 rounded px-3 py-2">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="word">Word</option>
                  <option value="powerpoint">PowerPoint</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Delivery Method
                </label>
                <select className="w-full text-sm border border-gray-300 rounded px-3 py-2">
                  <option value="email">Email</option>
                  <option value="download">Download</option>
                  <option value="sharepoint">SharePoint</option>
                  <option value="teams">Teams</option>
                </select>
              </div>
            </div>

            {/* Recipients */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Recipients (comma-separated emails)
              </label>
              <textarea 
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                rows={2}
                placeholder="user1@company.com, user2@company.com"
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" colorScheme="secondary">
                Save as Template
              </Button>
              <Button 
                variant="solid" 
                colorScheme="primary"
                onClick={() => selectedTemplate && handleGenerateReport(selectedTemplate, customSections)}
                disabled={!selectedTemplate}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Tab */}
      {selectedView === 'scheduled' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Scheduled Reports</h4>
            <Button size="sm" variant="solid" colorScheme="primary">
              Add Schedule
            </Button>
          </div>
          
          <div className="space-y-3">
            {scheduledReports.map((report) => (
              <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{report.templateName}</h5>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        report.status === 'active' ? 'bg-green-100 text-green-800' :
                        report.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        {report.deliveryMethod.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                      <div>
                        <span className="font-medium text-gray-700">Frequency:</span>
                        <span className="ml-1 text-gray-600">{report.schedule.frequency}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Time:</span>
                        <span className="ml-1 text-gray-600">{report.schedule.time} {report.schedule.timezone}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Recipients:</span>
                        <span className="ml-1 text-gray-600">{report.recipients.length} configured</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Next Run:</span>
                        <span className="ml-1 text-gray-600">
                          {new Date(report.nextRun).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {report.lastRun && (
                      <div className="text-xs text-gray-500">
                        <strong>Last Run:</strong> {new Date(report.lastRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" colorScheme="secondary">
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant={report.status === 'active' ? 'outline' : 'solid'}
                      colorScheme={report.status === 'active' ? 'danger' : 'primary'}
                    >
                      {report.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {selectedView === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Report Generation History</h4>
            <div className="flex space-x-2">
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option value="all">All Templates</option>
                {reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <select className="text-xs border border-gray-300 rounded px-2 py-1">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            {reportTemplates
              .filter(t => t.lastGenerated)
              .map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{template.name}</span>
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        SUCCESS
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Generated: {template.lastGenerated && new Date(template.lastGenerated).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" colorScheme="secondary">
                      Download
                    </Button>
                    <Button size="sm" variant="outline" colorScheme="secondary">
                      Resend
                    </Button>
                  </div>
                </div>
              ))}
          </div>
          
          {reportTemplates.filter(t => t.lastGenerated).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl block mb-2">📄</span>
              <p>No reports have been generated yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" colorScheme="secondary">
            Export Settings
          </Button>
          <Button size="sm" variant="solid" colorScheme="primary">
            Quick Report
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ComplianceReportsWidget; 