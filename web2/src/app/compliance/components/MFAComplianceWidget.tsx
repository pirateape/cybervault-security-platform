'use client';

import React, { useState, useMemo } from 'react';
import { 
  useMFAStatus, 
  type MFAStatus,
  getRiskLevelColor,
  getComplianceStatusColor,
  getComplianceStatusText
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface MFAComplianceWidgetProps {
  className?: string;
  showDetailedView?: boolean;
  onUserSelect?: (user: MFAStatus) => void;
}

interface RemediationSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

export function MFAComplianceWidget({ 
  className = '', 
  showDetailedView = false,
  onUserSelect 
}: MFAComplianceWidgetProps) {
  const { data: mfaStatus, isLoading, error, refetch } = useMFAStatus();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'enabled' | 'disabled' | 'high-risk'>('all');
  const [showRemediation, setShowRemediation] = useState(false);

  // Calculate MFA metrics
  const metrics = useMemo(() => {
    if (!mfaStatus) return null;

    const total = mfaStatus.length;
    const enabled = mfaStatus.filter(user => user.isEnabled).length;
    const registered = mfaStatus.filter(user => user.isRegistered).length;
    const highRisk = mfaStatus.filter(user => user.riskLevel === 'high').length;
    const mediumRisk = mfaStatus.filter(user => user.riskLevel === 'medium').length;
    const lowRisk = mfaStatus.filter(user => user.riskLevel === 'low').length;

    const enabledPercentage = total > 0 ? Math.round((enabled / total) * 100) : 0;
    const registeredPercentage = total > 0 ? Math.round((registered / total) * 100) : 0;

    return {
      total,
      enabled,
      registered,
      highRisk,
      mediumRisk,
      lowRisk,
      enabledPercentage,
      registeredPercentage,
      disabled: total - enabled,
      unregistered: total - registered,
    };
  }, [mfaStatus]);

  // Filter users based on selected filter
  const filteredUsers = useMemo(() => {
    if (!mfaStatus) return [];

    switch (selectedFilter) {
      case 'enabled':
        return mfaStatus.filter(user => user.isEnabled);
      case 'disabled':
        return mfaStatus.filter(user => !user.isEnabled);
      case 'high-risk':
        return mfaStatus.filter(user => user.riskLevel === 'high');
      default:
        return mfaStatus;
    }
  }, [mfaStatus, selectedFilter]);

  // Generate remediation suggestions
  const remediationSuggestions: RemediationSuggestion[] = useMemo(() => {
    if (!metrics) return [];

    const suggestions: RemediationSuggestion[] = [];

    if (metrics.enabledPercentage < 90) {
      suggestions.push({
        id: 'enable-mfa-all',
        title: 'Enable MFA for All Users',
        description: `${metrics.disabled} users don't have MFA enabled. This represents a significant security risk.`,
        priority: 'high',
        action: 'Configure conditional access policies to require MFA for all users',
        impact: `Secure ${metrics.disabled} additional user accounts`,
        effort: 'medium'
      });
    }

    if (metrics.highRisk > 0) {
      suggestions.push({
        id: 'address-high-risk',
        title: 'Address High-Risk Users',
        description: `${metrics.highRisk} users are classified as high-risk due to inactivity or missing MFA.`,
        priority: 'high',
        action: 'Review and secure high-risk user accounts immediately',
        impact: `Reduce security risk for ${metrics.highRisk} accounts`,
        effort: 'low'
      });
    }

    if (metrics.unregistered > 0) {
      suggestions.push({
        id: 'mfa-registration-campaign',
        title: 'MFA Registration Campaign',
        description: `${metrics.unregistered} users haven't registered MFA methods yet.`,
        priority: 'medium',
        action: 'Launch user education and registration campaign',
        impact: `Improve MFA adoption by ${metrics.unregistered} users`,
        effort: 'medium'
      });
    }

    if (metrics.enabledPercentage > 90) {
      suggestions.push({
        id: 'advanced-mfa-methods',
        title: 'Deploy Advanced MFA Methods',
        description: 'Consider implementing passwordless authentication for enhanced security.',
        priority: 'low',
        action: 'Evaluate Windows Hello, FIDO2, or certificate-based authentication',
        impact: 'Enhanced user experience and security',
        effort: 'high'
      });
    }

    return suggestions;
  }, [metrics]);

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading MFA Data</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load MFA compliance data'}
          </p>
          <Button onClick={() => refetch()} size="sm">
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
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
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
          <h3 className="text-lg font-semibold text-gray-900">MFA Compliance</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={showRemediation ? 'solid' : 'outline'}
            colorScheme={showRemediation ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowRemediation(!showRemediation)}
          >
            {showRemediation ? 'Hide' : 'Show'} Remediation
          </Button>
          <IconButton
            icon={<span className="text-sm">🔄</span>}
            onClick={() => refetch()}
            ariaLabel="Refresh MFA data"
            variant="ghost"
            colorScheme="secondary"
            size="sm"
          />
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">MFA Enabled</p>
              <p className="text-2xl font-bold text-green-900">{metrics.enabledPercentage}%</p>
              <p className="text-xs text-green-600">{metrics.enabled} of {metrics.total} users</p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">MFA Registered</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.registeredPercentage}%</p>
              <p className="text-xs text-blue-600">{metrics.registered} of {metrics.total} users</p>
            </div>
            <div className="text-3xl">📱</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Distribution</h4>
        <div className="flex space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="flex h-full">
              <div 
                className="bg-green-500" 
                style={{ width: `${(metrics.lowRisk / metrics.total) * 100}%` }}
                title={`Low Risk: ${metrics.lowRisk} users`}
              />
              <div 
                className="bg-yellow-500" 
                style={{ width: `${(metrics.mediumRisk / metrics.total) * 100}%` }}
                title={`Medium Risk: ${metrics.mediumRisk} users`}
              />
              <div 
                className="bg-red-500" 
                style={{ width: `${(metrics.highRisk / metrics.total) * 100}%` }}
                title={`High Risk: ${metrics.highRisk} users`}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Low: {metrics.lowRisk}</span>
          <span>Medium: {metrics.mediumRisk}</span>
          <span>High: {metrics.highRisk}</span>
        </div>
      </div>

      {/* Remediation Suggestions */}
      {showRemediation && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Remediation Suggestions</h4>
          <div className="space-y-3">
            {remediationSuggestions.map((suggestion) => (
              <div 
                key={suggestion.id}
                className={`p-3 rounded-lg border-l-4 ${
                  suggestion.priority === 'high' 
                    ? 'bg-red-50 border-red-400'
                    : suggestion.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">{suggestion.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        suggestion.priority === 'high' 
                          ? 'bg-red-100 text-red-800'
                          : suggestion.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {suggestion.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-gray-500">
                        Effort: {suggestion.effort}
                      </span>
                    </div>
                  </div>
                                     <Button size="sm" variant="outline" colorScheme="secondary" className="ml-3">
                     Take Action
                   </Button>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Action:</strong> {suggestion.action}</p>
                  <p><strong>Impact:</strong> {suggestion.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed View */}
      {showDetailedView && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">User Details</h4>
            <div className="flex space-x-2">
              {(['all', 'enabled', 'disabled', 'high-risk'] as const).map((filter) => (
                                 <Button
                   key={filter}
                   variant={selectedFilter === filter ? 'solid' : 'outline'}
                   colorScheme={selectedFilter === filter ? 'primary' : 'secondary'}
                   size="sm"
                   onClick={() => setSelectedFilter(filter)}
                   className="text-xs capitalize"
                 >
                  {filter.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onUserSelect?.(user)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.userPrincipalName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span 
                      className="px-2 py-1 text-xs font-semibold rounded-full"
                      style={{ 
                        backgroundColor: `${getRiskLevelColor(user.riskLevel)}20`,
                        color: getRiskLevelColor(user.riskLevel)
                      }}
                    >
                      {user.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl block mb-2">🔍</span>
              <p>No users found matching the selected filter.</p>
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
             Export Report
           </Button>
           <Button size="sm" variant="solid" colorScheme="primary">
             Configure MFA
           </Button>
         </div>
      </div>
    </Card>
  );
}

export default MFAComplianceWidget; 