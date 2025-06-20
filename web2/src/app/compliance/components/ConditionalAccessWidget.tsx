'use client';

import React, { useState, useMemo } from 'react';
import { 
  useConditionalAccessPolicies, 
  type ConditionalAccessPolicy
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface ConditionalAccessWidgetProps {
  className?: string;
  showDetailedView?: boolean;
  onPolicySelect?: (policy: ConditionalAccessPolicy) => void;
}

interface PolicyGap {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  coverage: number;
  recommendation: string;
  templateAvailable: boolean;
}

interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  useCase: string;
  complexity: 'basic' | 'intermediate' | 'advanced';
  conditions: string[];
  controls: string[];
  estimatedCoverage: number;
}

export function ConditionalAccessWidget({ 
  className = '', 
  showDetailedView = false,
  onPolicySelect 
}: ConditionalAccessWidgetProps) {
  const { data: policies, isLoading, error, refetch } = useConditionalAccessPolicies();
  const [selectedView, setSelectedView] = useState<'overview' | 'gaps' | 'templates'>('overview');
  const [policyFilter, setPolicyFilter] = useState<'all' | 'enabled' | 'disabled' | 'report-only'>('all');

  // Calculate policy metrics and effectiveness
  const metrics = useMemo(() => {
    if (!policies) return null;

    const total = policies.length;
    const enabled = policies.filter(policy => policy.state === 'enabled').length;
    const disabled = policies.filter(policy => policy.state === 'disabled').length;
    const reportOnly = policies.filter(policy => policy.state === 'enabledForReportingButNotEnforced').length;

    // Calculate coverage scores based on policy conditions and controls
    const coverageScores = policies.map(policy => {
      let score = 0;
      
      // User coverage
      const userIncludes = policy.conditions.users.includeUsers.length + 
                          policy.conditions.users.includeGroups.length;
      if (userIncludes > 0) score += 25;
      
      // Application coverage
      const appIncludes = policy.conditions.applications.includeApplications.length;
      if (appIncludes > 0) score += 25;
      
      // Platform coverage
      if (policy.conditions.platforms?.includePlatforms.length) score += 15;
      
      // Location coverage
      if (policy.conditions.locations?.includeLocations.length) score += 15;
      
      // Controls effectiveness
      if (policy.grantControls?.builtInControls.length) score += 20;
      
      return Math.min(score, 100);
    });

    const averageEffectiveness = coverageScores.length > 0 
      ? Math.round(coverageScores.reduce((sum, score) => sum + score, 0) / coverageScores.length)
      : 0;

    const enabledPercentage = total > 0 ? Math.round((enabled / total) * 100) : 0;

    return {
      total,
      enabled,
      disabled,
      reportOnly,
      enabledPercentage,
      averageEffectiveness,
      coverageScores,
    };
  }, [policies]);

  // Identify policy gaps
  const policyGaps: PolicyGap[] = useMemo(() => {
    if (!policies || !metrics) return [];

    const gaps: PolicyGap[] = [];

    // Check for MFA enforcement gaps
    const mfaPolicies = policies.filter(policy => 
      policy.grantControls?.builtInControls.includes('mfa') ||
      policy.grantControls?.builtInControls.includes('requireMultiFactorAuthentication')
    );
    
    if (mfaPolicies.length === 0) {
      gaps.push({
        id: 'mfa-enforcement',
        category: 'Authentication',
        title: 'Missing MFA Enforcement',
        description: 'No conditional access policies require multi-factor authentication.',
        severity: 'high',
        coverage: 0,
        recommendation: 'Create a policy requiring MFA for all users accessing cloud applications.',
        templateAvailable: true,
      });
    }

    // Check for location-based access control
    const locationPolicies = policies.filter(policy => 
      policy.conditions.locations?.includeLocations.length ||
      policy.conditions.locations?.excludeLocations.length
    );
    
    if (locationPolicies.length === 0) {
      gaps.push({
        id: 'location-control',
        category: 'Access Control',
        title: 'No Location-Based Policies',
        description: 'No policies control access based on user location or trusted networks.',
        severity: 'medium',
        coverage: 0,
        recommendation: 'Implement location-based access controls for sensitive applications.',
        templateAvailable: true,
      });
    }

    // Check for device compliance requirements
    const devicePolicies = policies.filter(policy => 
      policy.grantControls?.builtInControls.includes('compliantDevice') ||
      policy.grantControls?.builtInControls.includes('domainJoinedDevice')
    );
    
    if (devicePolicies.length === 0) {
      gaps.push({
        id: 'device-compliance',
        category: 'Device Security',
        title: 'Missing Device Compliance',
        description: 'No policies require device compliance or domain joining.',
        severity: 'medium',
        coverage: 0,
        recommendation: 'Require compliant or domain-joined devices for accessing corporate resources.',
        templateAvailable: true,
      });
    }

    // Check for privileged user protection
    const privilegedPolicies = policies.filter(policy => {
      const users = policy.conditions.users.includeUsers;
      const groups = policy.conditions.users.includeGroups;
      return users.some(user => user.includes('admin')) || 
             groups.some(group => group.includes('admin'));
    });
    
    if (privilegedPolicies.length < 2) {
      gaps.push({
        id: 'privileged-access',
        category: 'Privileged Access',
        title: 'Insufficient Privileged User Protection',
        description: 'Limited protection for administrative and privileged accounts.',
        severity: 'high',
        coverage: privilegedPolicies.length * 33,
        recommendation: 'Implement stricter controls for privileged users including MFA and trusted devices.',
        templateAvailable: true,
      });
    }

    // Check for application-specific policies
    const appSpecificPolicies = policies.filter(policy => 
      policy.conditions.applications.includeApplications.length > 0 &&
      !policy.conditions.applications.includeApplications.includes('All')
    );
    
    if (appSpecificPolicies.length < 3) {
      gaps.push({
        id: 'app-specific-controls',
        category: 'Application Security',
        title: 'Limited Application-Specific Controls',
        description: 'Few policies target specific high-risk applications.',
        severity: 'low',
        coverage: appSpecificPolicies.length * 25,
        recommendation: 'Create targeted policies for high-risk applications like email and file sharing.',
        templateAvailable: true,
      });
    }

    return gaps.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [policies, metrics]);

  // Policy templates
  const policyTemplates: PolicyTemplate[] = [
    {
      id: 'mfa-all-users',
      name: 'Require MFA for All Users',
      description: 'Enforce multi-factor authentication for all users accessing cloud applications.',
      category: 'Authentication',
      useCase: 'Basic security baseline for all user access',
      complexity: 'basic',
      conditions: ['All users', 'All cloud apps', 'Any location'],
      controls: ['Require MFA'],
      estimatedCoverage: 95,
    },
    {
      id: 'block-legacy-auth',
      name: 'Block Legacy Authentication',
      description: 'Prevent access from clients using legacy authentication protocols.',
      category: 'Authentication',
      useCase: 'Prevent attacks using legacy protocols',
      complexity: 'basic',
      conditions: ['All users', 'Legacy auth clients'],
      controls: ['Block access'],
      estimatedCoverage: 85,
    },
    {
      id: 'privileged-mfa-trusted',
      name: 'Privileged Users - MFA + Trusted Device',
      description: 'Require MFA and compliant devices for administrative accounts.',
      category: 'Privileged Access',
      useCase: 'Enhanced protection for admin accounts',
      complexity: 'intermediate',
      conditions: ['Admin users', 'All apps', 'Any location'],
      controls: ['Require MFA', 'Require compliant device'],
      estimatedCoverage: 98,
    },
    {
      id: 'location-based-access',
      name: 'Location-Based Access Control',
      description: 'Allow access only from trusted locations or require MFA from untrusted locations.',
      category: 'Access Control',
      useCase: 'Geo-based security controls',
      complexity: 'intermediate',
      conditions: ['All users', 'All apps', 'Untrusted locations'],
      controls: ['Require MFA', 'Block or allow'],
      estimatedCoverage: 80,
    },
    {
      id: 'high-risk-sign-in',
      name: 'High-Risk Sign-in Protection',
      description: 'Block or require additional verification for high-risk sign-ins.',
      category: 'Risk Management',
      useCase: 'AI-powered risk detection response',
      complexity: 'advanced',
      conditions: ['All users', 'High sign-in risk', 'All apps'],
      controls: ['Block access', 'Require MFA'],
      estimatedCoverage: 90,
    },
    {
      id: 'session-controls',
      name: 'Session Controls for Sensitive Apps',
      description: 'Implement session controls and app restrictions for sensitive applications.',
      category: 'Application Security',
      useCase: 'Enhanced controls for high-value apps',
      complexity: 'advanced',
      conditions: ['All users', 'Sensitive apps', 'Any location'],
      controls: ['Use app restrictions', 'Sign-in frequency', 'Persistent browser'],
      estimatedCoverage: 75,
    },
  ];

  // Filter policies
  const filteredPolicies = useMemo(() => {
    if (!policies) return [];

    switch (policyFilter) {
      case 'enabled':
        return policies.filter(policy => policy.state === 'enabled');
      case 'disabled':
        return policies.filter(policy => policy.state === 'disabled');
      case 'report-only':
        return policies.filter(policy => policy.state === 'enabledForReportingButNotEnforced');
      default:
        return policies;
    }
  }, [policies, policyFilter]);

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Policies</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load conditional access policies'}
          </p>
          <Button onClick={() => refetch()} size="sm" variant="solid" colorScheme="primary">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading || !metrics) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
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
          <span className="text-2xl">🛡️</span>
          <h3 className="text-lg font-semibold text-gray-900">Conditional Access</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {(['overview', 'gaps', 'templates'] as const).map((view) => (
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
            ariaLabel="Refresh conditional access data"
            variant="ghost"
            colorScheme="secondary"
            size="sm"
          />
        </div>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <>
          {/* Main Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Policies</p>
                  <p className="text-2xl font-bold text-blue-900">{metrics.total}</p>
                  <p className="text-xs text-blue-600">{metrics.enabled} enabled</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Policy Coverage</p>
                  <p className="text-2xl font-bold text-green-900">{metrics.enabledPercentage}%</p>
                  <p className="text-xs text-green-600">Policies active</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Effectiveness</p>
                  <p className="text-2xl font-bold text-purple-900">{metrics.averageEffectiveness}%</p>
                  <p className="text-xs text-purple-600">Average policy score</p>
                </div>
                <div className="text-3xl">🎯</div>
              </div>
            </div>
          </div>

          {/* Policy Status Distribution */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Policy Status Distribution</h4>
            <div className="space-y-2">
              {[
                { status: 'enabled', count: metrics.enabled, color: 'bg-green-500', textColor: 'text-green-700' },
                { status: 'report-only', count: metrics.reportOnly, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                { status: 'disabled', count: metrics.disabled, color: 'bg-red-500', textColor: 'text-red-700' },
              ].map(({ status, count, color, textColor }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${color}`}></div>
                    <span className={`text-sm font-medium capitalize ${textColor}`}>
                      {status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count} policies</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${metrics.total > 0 ? (count / metrics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy List */}
          {showDetailedView && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Policy Details</h4>
                <div className="flex space-x-1">
                  {(['all', 'enabled', 'disabled', 'report-only'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={policyFilter === filter ? 'solid' : 'outline'}
                      colorScheme={policyFilter === filter ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setPolicyFilter(filter)}
                      className="text-xs capitalize"
                    >
                      {filter.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredPolicies.map((policy) => (
                  <div 
                    key={policy.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onPolicySelect?.(policy)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{policy.displayName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {policy.conditions.applications.includeApplications.length} apps
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {policy.grantControls?.builtInControls.length || 0} controls
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        policy.state === 'enabled' 
                          ? 'bg-green-100 text-green-800'
                          : policy.state === 'disabled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {policy.state.replace('enabledForReportingButNotEnforced', 'report-only')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Gaps Tab */}
      {selectedView === 'gaps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Security Gaps Analysis</h4>
            <span className="text-xs text-gray-500">{policyGaps.length} gaps identified</span>
          </div>
          
          {policyGaps.map((gap) => (
            <div 
              key={gap.id}
              className={`p-4 rounded-lg border-l-4 ${
                gap.severity === 'high' 
                  ? 'bg-red-50 border-red-400'
                  : gap.severity === 'medium'
                  ? 'bg-yellow-50 border-yellow-400'
                  : 'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">{gap.title}</h5>
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                      {gap.category}
                    </span>
                    {gap.templateAvailable && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        TEMPLATE AVAILABLE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{gap.description}</p>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-700">Coverage:</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            gap.coverage > 70 ? 'bg-green-500' :
                            gap.coverage > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${gap.coverage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{gap.coverage}%</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      gap.severity === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : gap.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {gap.severity.toUpperCase()} SEVERITY
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    <strong>Recommendation:</strong> {gap.recommendation}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="solid" 
                  colorScheme={gap.templateAvailable ? 'primary' : 'secondary'}
                  className="ml-3"
                >
                  {gap.templateAvailable ? 'Use Template' : 'Create Policy'}
                </Button>
              </div>
            </div>
          ))}

          {policyGaps.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl block mb-2">✅</span>
              <p>No significant security gaps detected in your conditional access policies.</p>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {selectedView === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Policy Templates</h4>
            <span className="text-xs text-gray-500">{policyTemplates.length} templates available</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policyTemplates.map((template) => (
              <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm mb-1">{template.name}</h5>
                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        {template.category}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        template.complexity === 'basic' ? 'bg-green-100 text-green-800' :
                        template.complexity === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {template.complexity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{template.estimatedCoverage}%</div>
                    <div className="text-xs text-gray-500">Coverage</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div>
                    <span className="text-xs font-medium text-gray-700">Conditions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.conditions.map((condition, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-700">Controls:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.controls.map((control, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                          {control}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{template.useCase}</span>
                  <Button size="sm" variant="solid" colorScheme="primary">
                    Deploy Template
                  </Button>
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
            Export Analysis
          </Button>
          <Button size="sm" variant="solid" colorScheme="primary">
            Create Policy
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ConditionalAccessWidget; 