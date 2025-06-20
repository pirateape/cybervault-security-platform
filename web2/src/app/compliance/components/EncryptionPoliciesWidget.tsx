'use client';

import React, { useState, useMemo } from 'react';
import { 
  useEncryptionPolicies, 
  type EncryptionPolicy
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface EncryptionPoliciesWidgetProps {
  className?: string;
  showDetailedView?: boolean;
  onPolicySelect?: (policy: EncryptionPolicy) => void;
}

interface EncryptionGap {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  coverage: number;
  affectedResources: number;
  recommendation: string;
  complianceStandard?: string;
}

interface EncryptionStandard {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  currentCompliance: number;
  targetCompliance: number;
  gaps: number;
}

export function EncryptionPoliciesWidget({ 
  className = '', 
  showDetailedView = false,
  onPolicySelect 
}: EncryptionPoliciesWidgetProps) {
  const { data: policies, isLoading, error, refetch } = useEncryptionPolicies();
  const [selectedView, setSelectedView] = useState<'overview' | 'gaps' | 'standards'>('overview');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'storage' | 'transit' | 'device'>('all');

  // Calculate encryption metrics
  const metrics = useMemo(() => {
    if (!policies) return null;

    const total = policies.length;
    const enforced = policies.filter(policy => policy.enforcementState === 'enforced').length;
    const monitoring = policies.filter(policy => policy.enforcementState === 'monitoring').length;
    const disabled = policies.filter(policy => policy.enforcementState === 'disabled').length;

    // Calculate coverage by category
    const storageEncryption = policies.filter(policy => policy.encryptionType === 'storage');
    const transitEncryption = policies.filter(policy => policy.encryptionType === 'transit');
    const deviceEncryption = policies.filter(policy => policy.encryptionType === 'device');

    const storageCompliance = storageEncryption.length > 0 
      ? Math.round(storageEncryption.reduce((sum, policy) => sum + policy.compliancePercentage, 0) / storageEncryption.length)
      : 0;

    const transitCompliance = transitEncryption.length > 0
      ? Math.round(transitEncryption.reduce((sum, policy) => sum + policy.compliancePercentage, 0) / transitEncryption.length)
      : 0;

    const deviceCompliance = deviceEncryption.length > 0
      ? Math.round(deviceEncryption.reduce((sum, policy) => sum + policy.compliancePercentage, 0) / deviceEncryption.length)
      : 0;

    const overallCompliance = total > 0
      ? Math.round(policies.reduce((sum, policy) => sum + policy.compliancePercentage, 0) / total)
      : 0;

    const enforcedPercentage = total > 0 ? Math.round((enforced / total) * 100) : 0;

    // Calculate risk score based on non-compliant resources
    const totalResources = policies.reduce((sum, policy) => sum + policy.totalResources, 0);
    const encryptedResources = policies.reduce((sum, policy) => sum + policy.encryptedResources, 0);
    const encryptionCoverage = totalResources > 0 ? Math.round((encryptedResources / totalResources) * 100) : 0;

    return {
      total,
      enforced,
      monitoring,
      disabled,
      enforcedPercentage,
      overallCompliance,
      storageCompliance,
      transitCompliance,
      deviceCompliance,
      encryptionCoverage,
      totalResources,
      encryptedResources,
      unencryptedResources: totalResources - encryptedResources,
    };
  }, [policies]);

  // Identify encryption gaps
  const encryptionGaps: EncryptionGap[] = useMemo(() => {
    if (!policies || !metrics) return [];

    const gaps: EncryptionGap[] = [];

    // Check for storage encryption gaps
    if (metrics.storageCompliance < 90) {
      const storageGap = 90 - metrics.storageCompliance;
      gaps.push({
        id: 'storage-encryption-gap',
        category: 'Data at Rest',
        title: 'Insufficient Storage Encryption',
        description: `${storageGap}% of storage resources lack proper encryption coverage.`,
        severity: storageGap > 50 ? 'critical' : storageGap > 25 ? 'high' : 'medium',
        coverage: metrics.storageCompliance,
        affectedResources: Math.floor(metrics.totalResources * (storageGap / 100)),
        recommendation: 'Enable encryption for all storage accounts, databases, and file shares.',
        complianceStandard: 'SOC 2, ISO 27001, GDPR',
      });
    }

    // Check for transit encryption gaps
    if (metrics.transitCompliance < 95) {
      const transitGap = 95 - metrics.transitCompliance;
      gaps.push({
        id: 'transit-encryption-gap',
        category: 'Data in Transit',
        title: 'Insufficient Transit Encryption',
        description: `${transitGap}% of data transmission lacks proper encryption.`,
        severity: transitGap > 40 ? 'critical' : transitGap > 20 ? 'high' : 'medium',
        coverage: metrics.transitCompliance,
        affectedResources: Math.floor(metrics.totalResources * (transitGap / 100)),
        recommendation: 'Enforce TLS 1.2+ for all API endpoints and data transfers.',
        complianceStandard: 'PCI DSS, HIPAA, SOC 2',
      });
    }

    // Check for device encryption gaps
    if (metrics.deviceCompliance < 85) {
      const deviceGap = 85 - metrics.deviceCompliance;
      gaps.push({
        id: 'device-encryption-gap',
        category: 'Device Encryption',
        title: 'Insufficient Device Encryption',
        description: `${deviceGap}% of devices lack proper encryption enforcement.`,
        severity: deviceGap > 60 ? 'critical' : deviceGap > 30 ? 'high' : 'medium',
        coverage: metrics.deviceCompliance,
        affectedResources: Math.floor(metrics.totalResources * (deviceGap / 100)),
        recommendation: 'Implement BitLocker or equivalent device encryption policies.',
        complianceStandard: 'NIST, ISO 27001',
      });
    }

    // Check for key management gaps
    const keyManagementPolicies = policies.filter(policy => 
      policy.keyManagement && policy.keyManagement.rotationEnabled
    );
    
    if (keyManagementPolicies.length < policies.length * 0.8) {
      gaps.push({
        id: 'key-management-gap',
        category: 'Key Management',
        title: 'Inadequate Key Management',
        description: 'Missing key rotation and management policies for encryption keys.',
        severity: 'high',
        coverage: Math.round((keyManagementPolicies.length / policies.length) * 100),
        affectedResources: policies.length - keyManagementPolicies.length,
        recommendation: 'Implement automated key rotation and centralized key management.',
        complianceStandard: 'FIPS 140-2, Common Criteria',
      });
    }

    // Check for algorithm strength
    const weakAlgorithms = policies.filter(policy => 
      policy.encryptionAlgorithm && 
      (policy.encryptionAlgorithm.includes('DES') || 
       policy.encryptionAlgorithm.includes('RC4') ||
       policy.encryptionAlgorithm.includes('MD5'))
    );

    if (weakAlgorithms.length > 0) {
      gaps.push({
        id: 'weak-algorithms',
        category: 'Algorithm Strength',
        title: 'Weak Encryption Algorithms',
        description: `${weakAlgorithms.length} policies use outdated or weak encryption algorithms.`,
        severity: 'critical',
        coverage: Math.round(((policies.length - weakAlgorithms.length) / policies.length) * 100),
        affectedResources: weakAlgorithms.length,
        recommendation: 'Upgrade to AES-256, RSA-2048+, or equivalent strong encryption algorithms.',
        complianceStandard: 'NIST SP 800-57, FIPS 140-2',
      });
    }

    return gaps.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [policies, metrics]);

  // Compliance standards tracking
  const complianceStandards: EncryptionStandard[] = [
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      description: 'Security, availability, and confidentiality controls',
      requirements: ['Data at rest encryption', 'Data in transit encryption', 'Key management'],
      currentCompliance: metrics?.overallCompliance || 0,
      targetCompliance: 95,
      gaps: encryptionGaps.filter(gap => gap.complianceStandard?.includes('SOC 2')).length,
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'Information security management standards',
      requirements: ['Encryption controls', 'Key lifecycle management', 'Access controls'],
      currentCompliance: Math.min(metrics?.overallCompliance || 0, 92),
      targetCompliance: 98,
      gaps: encryptionGaps.filter(gap => gap.complianceStandard?.includes('ISO 27001')).length,
    },
    {
      id: 'gdpr',
      name: 'GDPR',
      description: 'General Data Protection Regulation',
      requirements: ['Personal data encryption', 'Data breach protection', 'Privacy by design'],
      currentCompliance: Math.min(metrics?.storageCompliance || 0, 88),
      targetCompliance: 100,
      gaps: encryptionGaps.filter(gap => gap.complianceStandard?.includes('GDPR')).length,
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      description: 'Health Insurance Portability and Accountability Act',
      requirements: ['PHI encryption', 'Secure transmission', 'Access logging'],
      currentCompliance: Math.min(metrics?.transitCompliance || 0, 85),
      targetCompliance: 100,
      gaps: encryptionGaps.filter(gap => gap.complianceStandard?.includes('HIPAA')).length,
    },
  ];

  // Filter policies by category
  const filteredPolicies = useMemo(() => {
    if (!policies) return [];

    switch (categoryFilter) {
      case 'storage':
        return policies.filter(policy => policy.encryptionType === 'storage');
      case 'transit':
        return policies.filter(policy => policy.encryptionType === 'transit');
      case 'device':
        return policies.filter(policy => policy.encryptionType === 'device');
      default:
        return policies;
    }
  }, [policies, categoryFilter]);

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Encryption Policies</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load encryption policies data'}
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
          <span className="text-2xl">🔐</span>
          <h3 className="text-lg font-semibold text-gray-900">Encryption Policies</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {(['overview', 'gaps', 'standards'] as const).map((view) => (
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
            ariaLabel="Refresh encryption policies data"
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Overall Compliance</p>
                  <p className="text-2xl font-bold text-green-900">{metrics.overallCompliance}%</p>
                  <p className="text-xs text-green-600">{metrics.enforced} policies enforced</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Encryption Coverage</p>
                  <p className="text-2xl font-bold text-blue-900">{metrics.encryptionCoverage}%</p>
                  <p className="text-xs text-blue-600">{metrics.encryptedResources} of {metrics.totalResources} resources</p>
                </div>
                <div className="text-3xl">🛡️</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Policy Enforcement</p>
                  <p className="text-2xl font-bold text-purple-900">{metrics.enforcedPercentage}%</p>
                  <p className="text-xs text-purple-600">{metrics.total} total policies</p>
                </div>
                <div className="text-3xl">⚖️</div>
              </div>
            </div>
          </div>

          {/* Encryption Type Breakdown */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Encryption Coverage by Type</h4>
            <div className="space-y-3">
              {[
                { type: 'Storage (At Rest)', compliance: metrics.storageCompliance, color: 'bg-blue-500' },
                { type: 'Transit (In Motion)', compliance: metrics.transitCompliance, color: 'bg-green-500' },
                { type: 'Device (Endpoint)', compliance: metrics.deviceCompliance, color: 'bg-purple-500' },
              ].map(({ type, compliance, color }) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{type}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${compliance}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">{compliance}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Status Distribution */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Policy Enforcement Status</h4>
            <div className="space-y-2">
              {[
                { status: 'enforced', count: metrics.enforced, color: 'bg-green-500', textColor: 'text-green-700' },
                { status: 'monitoring', count: metrics.monitoring, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                { status: 'disabled', count: metrics.disabled, color: 'bg-red-500', textColor: 'text-red-700' },
              ].map(({ status, count, color, textColor }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${color}`}></div>
                    <span className={`text-sm font-medium capitalize ${textColor}`}>{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count} policies</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
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
                  {(['all', 'storage', 'transit', 'device'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={categoryFilter === filter ? 'solid' : 'outline'}
                      colorScheme={categoryFilter === filter ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setCategoryFilter(filter)}
                      className="text-xs capitalize"
                    >
                      {filter}
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
                          {policy.encryptionType} • {policy.encryptionAlgorithm}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {policy.encryptedResources}/{policy.totalResources} resources
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{policy.compliancePercentage}%</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              policy.compliancePercentage >= 90 ? 'bg-green-500' :
                              policy.compliancePercentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${policy.compliancePercentage}%` }}
                          />
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        policy.enforcementState === 'enforced' 
                          ? 'bg-green-100 text-green-800'
                          : policy.enforcementState === 'disabled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {policy.enforcementState}
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
            <h4 className="text-sm font-medium text-gray-700">Encryption Compliance Gaps</h4>
            <span className="text-xs text-gray-500">{encryptionGaps.length} gaps identified</span>
          </div>
          
          {encryptionGaps.map((gap) => (
            <div 
              key={gap.id}
              className={`p-4 rounded-lg border-l-4 ${
                gap.severity === 'critical' 
                  ? 'bg-red-50 border-red-500'
                  : gap.severity === 'high' 
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
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      gap.severity === 'critical' 
                        ? 'bg-red-100 text-red-800'
                        : gap.severity === 'high' 
                        ? 'bg-red-100 text-red-800'
                        : gap.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {gap.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{gap.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-700">Coverage:</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            gap.coverage >= 90 ? 'bg-green-500' :
                            gap.coverage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${gap.coverage}%` }}
                        />
                      </div>
                      <span className="text-gray-600">{gap.coverage}%</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Affected Resources:</span>
                      <span className="ml-1 text-gray-600">{gap.affectedResources}</span>
                    </div>
                  </div>
                  {gap.complianceStandard && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-gray-700">Compliance Standards:</span>
                      <span className="ml-1 text-xs text-gray-600">{gap.complianceStandard}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-600">
                    <strong>Recommendation:</strong> {gap.recommendation}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="solid" 
                  colorScheme={gap.severity === 'critical' || gap.severity === 'high' ? 'danger' : 'primary'}
                  className="ml-3"
                >
                  Remediate
                </Button>
              </div>
            </div>
          ))}

          {encryptionGaps.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl block mb-2">✅</span>
              <p>No encryption compliance gaps detected. Your encryption policies are well-configured.</p>
            </div>
          )}
        </div>
      )}

      {/* Standards Tab */}
      {selectedView === 'standards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Compliance Standards</h4>
            <span className="text-xs text-gray-500">{complianceStandards.length} standards tracked</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceStandards.map((standard) => (
              <div key={standard.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm mb-1">{standard.name}</h5>
                    <p className="text-xs text-gray-600 mb-2">{standard.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{standard.currentCompliance}%</div>
                    <div className="text-xs text-gray-500">Current</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Progress to Target</span>
                    <span className="text-gray-600">{standard.targetCompliance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        standard.currentCompliance >= standard.targetCompliance ? 'bg-green-500' :
                        standard.currentCompliance >= standard.targetCompliance * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((standard.currentCompliance / standard.targetCompliance) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="text-xs font-medium text-gray-700">Key Requirements:</div>
                  <div className="space-y-1">
                    {standard.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <span className="text-green-600">✓</span>
                        <span className="text-gray-600">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {standard.gaps > 0 && (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                        {standard.gaps} gaps
                      </span>
                    )}
                    {standard.currentCompliance >= standard.targetCompliance && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Compliant
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="outline" colorScheme="secondary">
                    View Details
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
            Export Report
          </Button>
          <Button size="sm" variant="solid" colorScheme="primary">
            Create Policy
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default EncryptionPoliciesWidget; 