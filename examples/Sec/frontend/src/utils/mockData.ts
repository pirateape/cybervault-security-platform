import type {
  ComplianceDataPoint,
  HeatMapSector,
} from '../components/HeatMapVisualization';
import type {
  ComplianceScore,
  ComplianceMetrics,
} from '../components/ComplianceScoreWidget';
import type {
  ComplianceReport,
  ReportTemplate,
} from '../components/ReportingDashboard';

// Mock data for HeatMapVisualization
export const mockHeatMapData: ComplianceDataPoint[] = [
  // Azure Entra ID data points
  {
    service: 'Azure Entra ID',
    category: 'Authentication',
    riskLevel: 'high',
    count: 15,
    x: 1,
    y: 1,
  },
  {
    service: 'Azure Entra ID',
    category: 'Authorization',
    riskLevel: 'medium',
    count: 8,
    x: 2,
    y: 1,
  },
  {
    service: 'Azure Entra ID',
    category: 'Conditional Access',
    riskLevel: 'low',
    count: 3,
    x: 3,
    y: 1,
  },
  {
    service: 'Azure Entra ID',
    category: 'Identity Protection',
    riskLevel: 'critical',
    count: 22,
    x: 4,
    y: 1,
  },
  {
    service: 'Azure Entra ID',
    category: 'Privileged Access',
    riskLevel: 'high',
    count: 12,
    x: 5,
    y: 1,
  },

  // Microsoft 365 data points
  {
    service: 'Microsoft 365',
    category: 'Exchange Online',
    riskLevel: 'medium',
    count: 6,
    x: 1,
    y: 2,
  },
  {
    service: 'Microsoft 365',
    category: 'SharePoint',
    riskLevel: 'low',
    count: 4,
    x: 2,
    y: 2,
  },
  {
    service: 'Microsoft 365',
    category: 'Teams',
    riskLevel: 'high',
    count: 18,
    x: 3,
    y: 2,
  },
  {
    service: 'Microsoft 365',
    category: 'OneDrive',
    riskLevel: 'medium',
    count: 9,
    x: 4,
    y: 2,
  },
  {
    service: 'Microsoft 365',
    category: 'Security Center',
    riskLevel: 'critical',
    count: 25,
    x: 5,
    y: 2,
  },

  // Power Platform data points
  {
    service: 'Power Platform',
    category: 'Power Apps',
    riskLevel: 'low',
    count: 2,
    x: 1,
    y: 3,
  },
  {
    service: 'Power Platform',
    category: 'Power Automate',
    riskLevel: 'high',
    count: 14,
    x: 2,
    y: 3,
  },
  {
    service: 'Power Platform',
    category: 'Power BI',
    riskLevel: 'medium',
    count: 7,
    x: 3,
    y: 3,
  },
  {
    service: 'Power Platform',
    category: 'Dataverse',
    riskLevel: 'low',
    count: 5,
    x: 4,
    y: 3,
  },
  {
    service: 'Power Platform',
    category: 'Connectors',
    riskLevel: 'high',
    count: 16,
    x: 5,
    y: 3,
  },

  // Additional services
  {
    service: 'Azure Resources',
    category: 'Storage',
    riskLevel: 'medium',
    count: 11,
    x: 1,
    y: 4,
  },
  {
    service: 'Azure Resources',
    category: 'Networking',
    riskLevel: 'critical',
    count: 19,
    x: 2,
    y: 4,
  },
  {
    service: 'Azure Resources',
    category: 'Compute',
    riskLevel: 'low',
    count: 6,
    x: 3,
    y: 4,
  },
  {
    service: 'Azure Resources',
    category: 'Databases',
    riskLevel: 'high',
    count: 13,
    x: 4,
    y: 4,
  },
  {
    service: 'Azure Resources',
    category: 'Security',
    riskLevel: 'medium',
    count: 8,
    x: 5,
    y: 4,
  },
];

// Mock data for ComplianceScoreWidget
export const mockComplianceScore: ComplianceScore = {
  overall: 78,
  nist: 82,
  iso27001: 75,
  gdpr: 88,
  trend: 'up',
  trendValue: 5.2,
  lastUpdated: new Date().toISOString(),
};

export const mockComplianceMetrics: ComplianceMetrics = {
  totalChecks: 156,
  passedChecks: 122,
  failedChecks: 34,
  criticalIssues: 8,
  highRiskIssues: 15,
  mediumRiskIssues: 23,
  lowRiskIssues: 18,
};

// Mock data for ReportingDashboard
export const mockComplianceReports: ComplianceReport[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'NIST SP 800-53 Compliance Assessment',
    framework: 'NIST',
    status: 'compliant',
    score: 85,
    lastUpdated: '2025-01-15T10:30:00Z',
    riskLevel: 'low',
    findings: 12,
    remediated: 10,
    organizationalUnit: 'IT Security',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'ISO 27001 Information Security Management',
    framework: 'ISO27001',
    status: 'partial',
    score: 72,
    lastUpdated: '2025-01-14T15:45:00Z',
    riskLevel: 'medium',
    findings: 18,
    remediated: 13,
    organizationalUnit: 'Compliance',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'GDPR Data Protection Compliance',
    framework: 'GDPR',
    status: 'compliant',
    score: 92,
    lastUpdated: '2025-01-13T09:15:00Z',
    riskLevel: 'low',
    findings: 6,
    remediated: 6,
    organizationalUnit: 'Legal',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: 'SOX Financial Controls Assessment',
    framework: 'SOX',
    status: 'non-compliant',
    score: 58,
    lastUpdated: '2025-01-12T14:20:00Z',
    riskLevel: 'high',
    findings: 25,
    remediated: 8,
    organizationalUnit: 'Finance',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: 'HIPAA Healthcare Data Security',
    framework: 'HIPAA',
    status: 'partial',
    score: 67,
    lastUpdated: '2025-01-11T11:00:00Z',
    riskLevel: 'medium',
    findings: 20,
    remediated: 12,
    organizationalUnit: 'Healthcare IT',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: 'Azure Entra ID Security Configuration',
    framework: 'NIST',
    status: 'compliant',
    score: 89,
    lastUpdated: '2025-01-10T16:30:00Z',
    riskLevel: 'low',
    findings: 8,
    remediated: 7,
    organizationalUnit: 'IT Security',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    title: 'Microsoft 365 Compliance Review',
    framework: 'ISO27001',
    status: 'partial',
    score: 74,
    lastUpdated: '2025-01-09T13:45:00Z',
    riskLevel: 'medium',
    findings: 16,
    remediated: 11,
    organizationalUnit: 'IT Operations',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    title: 'Power Platform Governance Assessment',
    framework: 'NIST',
    status: 'non-compliant',
    score: 45,
    lastUpdated: '2025-01-08T08:20:00Z',
    riskLevel: 'critical',
    findings: 32,
    remediated: 5,
    organizationalUnit: 'Business Applications',
  },
];

export const mockReportTemplates: ReportTemplate[] = [
  {
    id: 'template-001',
    name: 'Executive Summary Report',
    description: 'High-level compliance overview for executive leadership',
    framework: ['NIST', 'ISO27001', 'GDPR'],
    sections: [
      'Executive Summary',
      'Compliance Scores',
      'Risk Assessment',
      'Recommendations',
    ],
    format: 'PDF',
  },
  {
    id: 'template-002',
    name: 'Technical Compliance Report',
    description: 'Detailed technical findings for IT teams',
    framework: ['NIST', 'ISO27001'],
    sections: [
      'Technical Findings',
      'Remediation Steps',
      'Configuration Details',
      'Appendices',
    ],
    format: 'Excel',
  },
  {
    id: 'template-003',
    name: 'GDPR Data Protection Report',
    description: 'Specialized report for GDPR compliance requirements',
    framework: ['GDPR'],
    sections: [
      'Data Processing Activities',
      'Privacy Controls',
      'Breach Assessment',
      'DPO Recommendations',
    ],
    format: 'PDF',
  },
  {
    id: 'template-004',
    name: 'Audit Trail Export',
    description: 'Comprehensive audit trail for compliance auditors',
    framework: ['NIST', 'ISO27001', 'SOX', 'HIPAA'],
    sections: [
      'Audit Events',
      'User Activities',
      'System Changes',
      'Access Logs',
    ],
    format: 'CSV',
  },
  {
    id: 'template-005',
    name: 'Risk Assessment Dashboard',
    description: 'Visual risk assessment for security teams',
    framework: ['NIST', 'ISO27001'],
    sections: [
      'Risk Heat Map',
      'Vulnerability Trends',
      'Mitigation Status',
      'Action Items',
    ],
    format: 'Excel',
  },
];

// Mock data generator functions for dynamic content
export const generateMockHeatMapData = (
  gridColumns: number = 5,
  gridRows: number = 4
): ComplianceDataPoint[] => {
  const services = [
    'Azure Entra ID',
    'Microsoft 365',
    'Power Platform',
    'Azure Resources',
  ];
  const categories = [
    'Authentication',
    'Authorization',
    'Data Protection',
    'Network Security',
    'Access Control',
  ];
  const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = [
    'low',
    'medium',
    'high',
    'critical',
  ];

  const data: ComplianceDataPoint[] = [];

  for (let x = 1; x <= gridColumns; x++) {
    for (let y = 1; y <= gridRows; y++) {
      data.push({
        service: services[Math.floor(Math.random() * services.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        count: Math.floor(Math.random() * 30) + 1,
        x,
        y,
      });
    }
  }

  return data;
};

export const generateMockComplianceScore = (): ComplianceScore => {
  const baseScore = Math.floor(Math.random() * 40) + 60; // 60-100 range
  return {
    overall: baseScore,
    nist: baseScore + Math.floor(Math.random() * 10) - 5,
    iso27001: baseScore + Math.floor(Math.random() * 10) - 5,
    gdpr: baseScore + Math.floor(Math.random() * 10) - 5,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendValue: Math.random() * 10,
    lastUpdated: new Date().toISOString(),
  };
};

export const generateMockComplianceMetrics = (): ComplianceMetrics => {
  const totalChecks = Math.floor(Math.random() * 100) + 100;
  const passedChecks = Math.floor(totalChecks * (0.6 + Math.random() * 0.3));
  const failedChecks = totalChecks - passedChecks;

  return {
    totalChecks,
    passedChecks,
    failedChecks,
    criticalIssues: Math.floor(Math.random() * 15),
    highRiskIssues: Math.floor(Math.random() * 25),
    mediumRiskIssues: Math.floor(Math.random() * 35),
    lowRiskIssues: Math.floor(Math.random() * 20),
  };
};

// Combined mock data object for easy import
export const mockDashboardData = {
  heatMapData: mockHeatMapData,
  complianceScore: mockComplianceScore,
  complianceMetrics: mockComplianceMetrics,
  reports: mockComplianceReports,
  templates: mockReportTemplates,
};

export default mockDashboardData;
