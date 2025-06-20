'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  useComplianceSummary,
  type ComplianceSummary
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface ComplianceAlertsWidgetProps {
  className?: string;
  showDetailedView?: boolean;
  onAlertSelect?: (alert: ComplianceAlert) => void;
}

interface ComplianceAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  source: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  threshold?: {
    metric: string;
    current: number;
    threshold: number;
    operator: 'gt' | 'lt' | 'eq';
  };
  affectedResources: number;
  estimatedImpact: string;
  recommendedActions: string[];
  escalationLevel: number;
  assignedTo?: string;
  dueDate?: string;
  relatedAlerts?: string[];
}

interface AlertThreshold {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  category: string;
  description: string;
}

interface EscalationRule {
  id: string;
  name: string;
  conditions: {
    severity: string[];
    category: string[];
    duration: number; // minutes
  };
  actions: {
    type: 'email' | 'teams' | 'webhook' | 'ticket';
    target: string;
    template: string;
  }[];
  escalationChain: string[];
}

export function ComplianceAlertsWidget({ 
  className = '', 
  showDetailedView = false,
  onAlertSelect 
}: ComplianceAlertsWidgetProps) {
  const { data: complianceSummary, isLoading, error, refetch } = useComplianceSummary();
  const [selectedView, setSelectedView] = useState<'alerts' | 'thresholds' | 'escalation'>('alerts');
  const [alertFilter, setAlertFilter] = useState<'all' | 'active' | 'critical' | 'unassigned'>('all');
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);

  // Generate mock alerts based on compliance data
  const generatedAlerts: ComplianceAlert[] = useMemo(() => {
    if (!complianceSummary) return [];

    const mockAlerts: ComplianceAlert[] = [];

    // MFA Compliance Alerts
    if (complianceSummary.mfaCompliance?.percentage < 80) {
      mockAlerts.push({
        id: 'mfa-low-compliance',
        title: 'Low MFA Adoption Rate',
        description: `MFA compliance has dropped to ${complianceSummary.mfaCompliance.percentage}%, below the 80% threshold.`,
        severity: complianceSummary.mfaCompliance.percentage < 60 ? 'critical' : 'high',
        category: 'Authentication',
        source: 'MFA Monitoring',
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        status: 'active',
        threshold: {
          metric: 'MFA Adoption Rate',
          current: complianceSummary.mfaCompliance.percentage,
          threshold: 80,
          operator: 'lt',
        },
        affectedResources: Math.floor((100 - complianceSummary.mfaCompliance.percentage) * 10),
        estimatedImpact: 'High - Increased security risk from unprotected accounts',
        recommendedActions: [
          'Review and update MFA enrollment policies',
          'Conduct user training on MFA setup',
          'Consider conditional access enforcement',
          'Identify and target specific user groups'
        ],
        escalationLevel: 1,
        dueDate: new Date(Date.now() + 24 * 3600000).toISOString(),
      });
    }

    // Inactive Users Alert
    if (complianceSummary.inactiveUsers?.riskScore > 70) {
      mockAlerts.push({
        id: 'high-inactive-risk',
        title: 'High Risk from Inactive Users',
        description: `Inactive user risk score is ${complianceSummary.inactiveUsers.riskScore}%, indicating significant security exposure.`,
        severity: complianceSummary.inactiveUsers.riskScore > 85 ? 'critical' : 'high',
        category: 'Identity Hygiene',
        source: 'User Management',
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        status: 'active',
        threshold: {
          metric: 'Inactive User Risk Score',
          current: complianceSummary.inactiveUsers.riskScore,
          threshold: 70,
          operator: 'gt',
        },
        affectedResources: complianceSummary.inactiveUsers.count || 0,
        estimatedImpact: 'Medium - Potential for account compromise and lateral movement',
        recommendedActions: [
          'Review and disable high-risk inactive accounts',
          'Implement automated account lifecycle policies',
          'Conduct access review for inactive users',
          'Update account retention policies'
        ],
        escalationLevel: 0,
        assignedTo: 'Identity Team',
        dueDate: new Date(Date.now() + 72 * 3600000).toISOString(),
      });
    }

    // Encryption Compliance Alert
    if (complianceSummary.encryption?.overallCompliance < 90) {
      mockAlerts.push({
        id: 'encryption-gap',
        title: 'Encryption Coverage Gap',
        description: `Encryption compliance is at ${complianceSummary.encryption.overallCompliance}%, below regulatory requirements.`,
        severity: complianceSummary.encryption.overallCompliance < 75 ? 'critical' : 'medium',
        category: 'Data Protection',
        source: 'Encryption Monitoring',
        timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        status: 'acknowledged',
        threshold: {
          metric: 'Encryption Coverage',
          current: complianceSummary.encryption.overallCompliance,
          threshold: 90,
          operator: 'lt',
        },
        affectedResources: Math.floor((100 - complianceSummary.encryption.overallCompliance) * 5),
        estimatedImpact: 'High - Regulatory compliance risk and data exposure',
        recommendedActions: [
          'Enable encryption for unprotected storage accounts',
          'Update encryption policies for new resources',
          'Review and remediate weak encryption algorithms',
          'Implement key rotation procedures'
        ],
        escalationLevel: 1,
        assignedTo: 'Security Team',
        dueDate: new Date(Date.now() + 48 * 3600000).toISOString(),
      });
    }

    // Conditional Access Policy Alert
    if (complianceSummary.conditionalAccess?.effectivenessScore < 85) {
      mockAlerts.push({
        id: 'ca-policy-gaps',
        title: 'Conditional Access Policy Gaps',
        description: 'Critical gaps identified in conditional access policy coverage.',
        severity: 'medium',
        category: 'Access Control',
        source: 'Policy Analysis',
        timestamp: new Date(Date.now() - Math.random() * 5400000).toISOString(),
        status: 'active',
        threshold: {
          metric: 'CA Policy Effectiveness',
          current: complianceSummary.conditionalAccess?.effectivenessScore || 0,
          threshold: 85,
          operator: 'lt',
        },
        affectedResources: 15,
        estimatedImpact: 'Medium - Insufficient access controls may allow unauthorized access',
        recommendedActions: [
          'Review existing conditional access policies',
          'Implement missing policy templates',
          'Test policy effectiveness in report-only mode',
          'Update policy assignments and conditions'
        ],
        escalationLevel: 0,
        dueDate: new Date(Date.now() + 120 * 3600000).toISOString(),
      });
    }

    // System Health Alert
    mockAlerts.push({
      id: 'system-health-warning',
      title: 'Compliance Monitoring System Health',
      description: 'Some compliance monitoring services are experiencing degraded performance.',
      severity: 'info',
      category: 'System Health',
      source: 'System Monitor',
      timestamp: new Date(Date.now() - Math.random() * 900000).toISOString(),
      status: 'active',
      affectedResources: 3,
      estimatedImpact: 'Low - Delayed compliance data updates',
      recommendedActions: [
        'Check service status dashboard',
        'Review system resource utilization',
        'Restart affected monitoring services',
        'Contact support if issues persist'
      ],
      escalationLevel: 0,
    });

    return mockAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [complianceSummary]);

  // Update alerts state
  useEffect(() => {
    setAlerts(generatedAlerts);
  }, [generatedAlerts]);

  // Alert thresholds configuration
  const alertThresholds: AlertThreshold[] = [
    {
      id: 'mfa-adoption',
      name: 'MFA Adoption Rate',
      metric: 'mfa_compliance_percentage',
      operator: 'lt',
      value: 80,
      severity: 'high',
      enabled: true,
      category: 'Authentication',
      description: 'Alert when MFA adoption falls below threshold',
    },
    {
      id: 'inactive-users-risk',
      name: 'Inactive Users Risk Score',
      metric: 'inactive_users_risk_score',
      operator: 'gt',
      value: 70,
      severity: 'high',
      enabled: true,
      category: 'Identity Hygiene',
      description: 'Alert when inactive user risk score exceeds threshold',
    },
    {
      id: 'encryption-coverage',
      name: 'Encryption Coverage',
      metric: 'encryption_compliance_percentage',
      operator: 'lt',
      value: 90,
      severity: 'medium',
      enabled: true,
      category: 'Data Protection',
      description: 'Alert when encryption coverage falls below regulatory requirements',
    },
    {
      id: 'ca-effectiveness',
      name: 'Conditional Access Effectiveness',
      metric: 'ca_policy_effectiveness_score',
      operator: 'lt',
      value: 85,
      severity: 'medium',
      enabled: true,
      category: 'Access Control',
      description: 'Alert when conditional access policy effectiveness is low',
    },
  ];

  // Escalation rules
  const escalationRules: EscalationRule[] = [
    {
      id: 'critical-immediate',
      name: 'Critical Alert Immediate Escalation',
      conditions: {
        severity: ['critical'],
        category: ['Authentication', 'Data Protection'],
        duration: 0,
      },
      actions: [
        { type: 'email', target: 'security-team@company.com', template: 'critical-alert' },
        { type: 'teams', target: 'Security Team Channel', template: 'teams-critical' },
      ],
      escalationChain: ['Security Manager', 'CISO', 'CTO'],
    },
    {
      id: 'high-30min',
      name: 'High Severity 30-Minute Escalation',
      conditions: {
        severity: ['high'],
        category: ['Authentication', 'Access Control', 'Identity Hygiene'],
        duration: 30,
      },
      actions: [
        { type: 'email', target: 'compliance-team@company.com', template: 'high-alert' },
        { type: 'ticket', target: 'ServiceNow', template: 'compliance-ticket' },
      ],
      escalationChain: ['Compliance Lead', 'Security Manager'],
    },
  ];

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    switch (alertFilter) {
      case 'active':
        return alerts.filter(alert => alert.status === 'active');
      case 'critical':
        return alerts.filter(alert => alert.severity === 'critical');
      case 'unassigned':
        return alerts.filter(alert => !alert.assignedTo);
      default:
        return alerts;
    }
  }, [alerts, alertFilter]);

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      case 'info': return '#2563EB';
      default: return '#6B7280';
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#DC2626';
      case 'acknowledged': return '#D97706';
      case 'resolved': return '#059669';
      case 'suppressed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Alerts</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load compliance alerts'}
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
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
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
          <span className="text-2xl">🚨</span>
          <h3 className="text-lg font-semibold text-gray-900">Compliance Alerts</h3>
          {alerts.filter(a => a.status === 'active').length > 0 && (
            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
              {alerts.filter(a => a.status === 'active').length} Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {(['alerts', 'thresholds', 'escalation'] as const).map((view) => (
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
            ariaLabel="Refresh alerts"
            variant="ghost"
            colorScheme="secondary"
            size="sm"
          />
        </div>
      </div>

      {/* Alerts Tab */}
      {selectedView === 'alerts' && (
        <>
          {/* Alert Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-1">
              {(['all', 'active', 'critical', 'unassigned'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={alertFilter === filter ? 'solid' : 'outline'}
                  colorScheme={alertFilter === filter ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAlertFilter(filter)}
                  className="text-xs capitalize"
                >
                  {filter}
                </Button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">{filteredAlerts.length} alerts</span>
              <Button size="sm" variant="outline" colorScheme="secondary">
                Mark All Read
              </Button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  alert.status === 'active' ? 'bg-white' : 'bg-gray-50'
                }`}
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                onClick={() => onAlertSelect?.(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{alert.title}</h5>
                      <span 
                        className="px-2 py-1 text-xs font-semibold rounded-full"
                        style={{ 
                          backgroundColor: `${getSeverityColor(alert.severity)}20`,
                          color: getSeverityColor(alert.severity)
                        }}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        {alert.category}
                      </span>
                      <span 
                        className="px-2 py-1 text-xs font-semibold rounded-full"
                        style={{ 
                          backgroundColor: `${getStatusColor(alert.status)}20`,
                          color: getStatusColor(alert.status)
                        }}
                      >
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                    
                    {alert.threshold && (
                      <div className="text-xs text-gray-500 mb-2">
                        <strong>Threshold:</strong> {alert.threshold.metric} {
                          alert.threshold.operator === 'gt' ? '>' : 
                          alert.threshold.operator === 'lt' ? '<' : '='
                        } {alert.threshold.threshold} (Current: {alert.threshold.current})
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                      <div>
                        <span className="font-medium text-gray-700">Affected Resources:</span>
                        <span className="ml-1 text-gray-600">{alert.affectedResources}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Source:</span>
                        <span className="ml-1 text-gray-600">{alert.source}</span>
                      </div>
                      {alert.assignedTo && (
                        <div>
                          <span className="font-medium text-gray-700">Assigned:</span>
                          <span className="ml-1 text-gray-600">{alert.assignedTo}</span>
                        </div>
                      )}
                      {alert.dueDate && (
                        <div>
                          <span className="font-medium text-gray-700">Due:</span>
                          <span className="ml-1 text-gray-600">
                            {new Date(alert.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      <strong>Impact:</strong> {alert.estimatedImpact}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="text-right text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                    <div className="flex space-x-1">
                      {alert.status === 'active' && (
                        <Button size="sm" variant="outline" colorScheme="secondary">
                          Acknowledge
                        </Button>
                      )}
                      <Button size="sm" variant="solid" colorScheme="primary">
                        View
                      </Button>
                    </div>
                  </div>
                </div>
                
                {showDetailedView && alert.recommendedActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-700 mb-2">Recommended Actions:</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {alert.recommendedActions.map((action, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl block mb-2">✅</span>
              <p>No alerts matching the selected filter.</p>
            </div>
          )}
        </>
      )}

      {/* Thresholds Tab */}
      {selectedView === 'thresholds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Alert Thresholds</h4>
            <Button size="sm" variant="solid" colorScheme="primary">
              Add Threshold
            </Button>
          </div>
          
          <div className="space-y-3">
            {alertThresholds.map((threshold) => (
              <div key={threshold.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{threshold.name}</h5>
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        {threshold.category}
                      </span>
                      <span 
                        className="px-2 py-1 text-xs font-semibold rounded-full"
                        style={{ 
                          backgroundColor: `${getSeverityColor(threshold.severity)}20`,
                          color: getSeverityColor(threshold.severity)
                        }}
                      >
                        {threshold.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        threshold.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {threshold.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{threshold.description}</p>
                    <div className="text-xs text-gray-500">
                      <strong>Condition:</strong> {threshold.metric} {
                        threshold.operator === 'gt' ? '>' : 
                        threshold.operator === 'lt' ? '<' : '='
                      } {threshold.value}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" colorScheme="secondary">
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant={threshold.enabled ? 'solid' : 'outline'}
                      colorScheme={threshold.enabled ? 'danger' : 'primary'}
                    >
                      {threshold.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escalation Tab */}
      {selectedView === 'escalation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Escalation Rules</h4>
            <Button size="sm" variant="solid" colorScheme="primary">
              Add Rule
            </Button>
          </div>
          
          <div className="space-y-4">
            {escalationRules.map((rule) => (
              <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm mb-2">{rule.name}</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="font-medium text-gray-700">Severity:</span>
                        <span className="ml-1 text-gray-600">{rule.conditions.severity.join(', ')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Categories:</span>
                        <span className="ml-1 text-gray-600">{rule.conditions.category.join(', ')}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="ml-1 text-gray-600">{rule.conditions.duration} minutes</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Actions:</span>
                        <span className="ml-1 text-gray-600">{rule.actions.length} configured</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" colorScheme="secondary">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" colorScheme="danger">
                      Delete
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">Actions:</div>
                  <div className="space-y-1">
                    {rule.actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {action.type.toUpperCase()}
                        </span>
                        <span>{action.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-1">Escalation Chain:</div>
                  <div className="flex items-center space-x-2">
                    {rule.escalationChain.map((person, index) => (
                      <React.Fragment key={person}>
                        <span className="text-xs text-gray-600">{person}</span>
                        {index < rule.escalationChain.length - 1 && (
                          <span className="text-gray-400">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" colorScheme="secondary">
            Export Alerts
          </Button>
          <Button size="sm" variant="solid" colorScheme="primary">
            Configure
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ComplianceAlertsWidget; 