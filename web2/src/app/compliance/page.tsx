'use client';

import React, { useState, useMemo } from 'react';
import { 
  useComplianceSummary, 
  useMFAStatus, 
  useConditionalAccessPolicies, 
  useEncryptionPolicies, 
  useInactiveUsers,
  useRefreshComplianceData,
  getComplianceStatusColor,
  getComplianceStatusText,
  getRiskLevelColor,
  type ComplianceSummary,
  type MFAStatus,
  type ConditionalAccessPolicy,
  type EncryptionPolicy,
  type InactiveUser
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface ComplianceMetricCardProps {
  title: string;
  value: number;
  maxValue?: number;
  percentage: number;
  trend?: 'improving' | 'declining' | 'stable';
  description: string;
  color: string;
  icon: string;
}

function ComplianceMetricCard({ 
  title, 
  value, 
  maxValue, 
  percentage, 
  trend, 
  description, 
  color,
  icon 
}: ComplianceMetricCardProps) {
  const trendIcon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
  const trendColor = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card className="p-6 bg-white shadow-lg rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trendColor}`}>
            <span>{trendIcon}</span>
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold" style={{ color }}>
            {percentage}%
          </span>
          <span className="text-sm text-gray-600">
            {value}{maxValue ? ` / ${maxValue}` : ''}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color 
            }}
          />
        </div>
        
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Card>
  );
}

interface MFAStatusTableProps {
  mfaStatus: MFAStatus[];
  isLoading: boolean;
}

function MFAStatusTable({ mfaStatus, isLoading }: MFAStatusTableProps) {
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled' | 'high-risk'>('all');
  
  const filteredData = useMemo(() => {
    switch (filter) {
      case 'enabled':
        return mfaStatus.filter(user => user.isEnabled);
      case 'disabled':
        return mfaStatus.filter(user => !user.isEnabled);
      case 'high-risk':
        return mfaStatus.filter(user => user.riskLevel === 'high');
      default:
        return mfaStatus;
    }
  }, [mfaStatus, filter]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">MFA Status Details</h3>
        <div className="flex space-x-2">
          {(['all', 'enabled', 'disabled', 'high-risk'] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(filterOption)}
              className="capitalize"
            >
              {filterOption.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MFA Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Methods
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Sign-in
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.userPrincipalName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.methodsRegistered.length > 0 
                    ? user.methodsRegistered.join(', ') 
                    : 'None'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full`}
                    style={{ 
                      backgroundColor: `${getRiskLevelColor(user.riskLevel)}20`,
                      color: getRiskLevelColor(user.riskLevel)
                    }}
                  >
                    {user.riskLevel.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastSignInDateTime 
                    ? new Date(user.lastSignInDateTime).toLocaleDateString()
                    : 'Never'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found matching the selected filter.
        </div>
      )}
    </Card>
  );
}

interface ConditionalAccessPoliciesTableProps {
  policies: ConditionalAccessPolicy[];
  isLoading: boolean;
}

function ConditionalAccessPoliciesTable({ policies, isLoading }: ConditionalAccessPoliciesTableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Conditional Access Policies</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policy Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applications
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Controls
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {policy.displayName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    policy.state === 'enabled' 
                      ? 'bg-green-100 text-green-800'
                      : policy.state === 'disabled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {policy.state}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {policy.conditions.applications.includeApplications.length} apps
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {policy.grantControls?.builtInControls.join(', ') || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(policy.modifiedDateTime).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

interface InactiveUsersTableProps {
  inactiveUsers: InactiveUser[];
  isLoading: boolean;
}

function InactiveUsersTable({ inactiveUsers, isLoading }: InactiveUsersTableProps) {
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'critical'>('all');
  
  const filteredUsers = useMemo(() => {
    if (riskFilter === 'all') return inactiveUsers;
    return inactiveUsers.filter(user => user.riskLevel === riskFilter);
  }, [inactiveUsers, riskFilter]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Inactive Users</h3>
        <div className="flex space-x-2">
          {(['all', 'high', 'critical'] as const).map((filter) => (
            <Button
              key={filter}
              variant={riskFilter === filter ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRiskFilter(filter)}
              className="capitalize"
            >
              {filter} Risk
            </Button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Inactive
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recommended Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.displayName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.userPrincipalName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.daysSinceLastSignIn} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      {user.riskScore}%
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${user.riskScore}%`,
                          backgroundColor: getRiskLevelColor(user.riskLevel)
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.accountEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.accountEnabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span 
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize`}
                    style={{ 
                      backgroundColor: `${getRiskLevelColor(user.riskLevel)}20`,
                      color: getRiskLevelColor(user.riskLevel)
                    }}
                  >
                    {user.recommendedAction}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No inactive users found matching the selected filter.
        </div>
      )}
    </Card>
  );
}

export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'mfa' | 'policies' | 'encryption' | 'users'>('overview');
  
  // Data fetching hooks
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useComplianceSummary();
  const { data: mfaStatus, isLoading: mfaLoading } = useMFAStatus();
  const { data: policies, isLoading: policiesLoading } = useConditionalAccessPolicies();
  const { data: encryptionPolicies, isLoading: encryptionLoading } = useEncryptionPolicies();
  const { data: inactiveUsers, isLoading: inactiveUsersLoading } = useInactiveUsers();
  const refreshMutation = useRefreshComplianceData();

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  if (summaryError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="p-6 max-w-md mx-auto">
          <div className="text-center">
            <span className="text-4xl mb-4 block">⚠️</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Compliance Data</h2>
            <p className="text-sm text-gray-600 mb-4">
              {summaryError instanceof Error ? summaryError.message : 'Unknown error occurred'}
            </p>
            <Button onClick={handleRefresh} disabled={refreshMutation.isPending}>
              {refreshMutation.isPending ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Microsoft Graph Compliance Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Real-time compliance monitoring and security insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                Last updated: {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleTimeString() : 'Loading...'}
              </div>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshMutation.isPending}
                className="p-2"
                title="Refresh data"
              >
                <span className={`text-lg ${refreshMutation.isPending ? 'animate-spin' : ''}`}>
                  🔄
                </span>
              </IconButton>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'mfa', label: 'MFA Status', icon: '🔐' },
              { id: 'policies', label: 'Access Policies', icon: '🛡️' },
              { id: 'encryption', label: 'Encryption', icon: '🔒' },
              { id: 'users', label: 'Inactive Users', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overall Score */}
            {summary && (
              <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Overall Compliance Score</h2>
                  <div className="text-6xl font-bold mb-4" style={{ color: getComplianceStatusColor(summary.overallScore) }}>
                    {summary.overallScore}%
                  </div>
                  <p className="text-lg text-gray-600">
                    {getComplianceStatusText(summary.overallScore)} compliance posture
                  </p>
                </div>
              </Card>
            )}

            {/* Compliance Metrics Grid */}
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ComplianceMetricCard
                  title="MFA Compliance"
                  value={summary.mfaCompliance.enabledUsers}
                  maxValue={summary.mfaCompliance.totalUsers}
                  percentage={summary.mfaCompliance.percentage}
                  trend={summary.mfaCompliance.trend}
                  description="Users with MFA enabled"
                  color={getComplianceStatusColor(summary.mfaCompliance.percentage)}
                  icon="🔐"
                />
                <ComplianceMetricCard
                  title="Access Policies"
                  value={summary.conditionalAccessCompliance.activePolicies}
                  maxValue={summary.conditionalAccessCompliance.totalPolicies}
                  percentage={summary.conditionalAccessCompliance.coverage}
                  description="Active conditional access policies"
                  color={getComplianceStatusColor(summary.conditionalAccessCompliance.coverage)}
                  icon="🛡️"
                />
                <ComplianceMetricCard
                  title="Device Encryption"
                  value={summary.encryptionCompliance.compliantDevices}
                  maxValue={summary.encryptionCompliance.totalDevices}
                  percentage={summary.encryptionCompliance.percentage}
                  description="Devices with encryption enabled"
                  color={getComplianceStatusColor(summary.encryptionCompliance.percentage)}
                  icon="🔒"
                />
                <ComplianceMetricCard
                  title="Inactive Users Risk"
                  value={summary.inactiveUsersRisk.inactiveUsers}
                  maxValue={summary.inactiveUsersRisk.totalUsers}
                  percentage={100 - summary.inactiveUsersRisk.riskScore}
                  description="Users with recent activity"
                  color={getComplianceStatusColor(100 - summary.inactiveUsersRisk.riskScore)}
                  icon="👥"
                />
              </div>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setActiveTab('mfa')}
                  className="flex items-center justify-center space-x-2 p-4"
                  variant="secondary"
                >
                  <span>🔐</span>
                  <span>Review MFA Status</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('policies')}
                  className="flex items-center justify-center space-x-2 p-4"
                  variant="secondary"
                >
                  <span>🛡️</span>
                  <span>Manage Access Policies</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center justify-center space-x-2 p-4"
                  variant="secondary"
                >
                  <span>👥</span>
                  <span>Review Inactive Users</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'mfa' && mfaStatus && (
          <MFAStatusTable mfaStatus={mfaStatus} isLoading={mfaLoading} />
        )}

        {activeTab === 'policies' && policies && (
          <ConditionalAccessPoliciesTable policies={policies} isLoading={policiesLoading} />
        )}

        {activeTab === 'encryption' && encryptionPolicies && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Encryption Policies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {encryptionPolicies.map((policy) => (
                <Card key={policy.id} className="p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{policy.displayName}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      policy.state === 'enabled' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {policy.state}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{policy.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Compliant Devices:</span>
                      <span className="font-medium">{policy.compliance.compliantDevices}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Devices:</span>
                      <span className="font-medium">{policy.compliance.totalDevices}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${policy.compliance.compliancePercentage}%` }}
                      />
                    </div>
                    <div className="text-center text-sm font-medium text-gray-900">
                      {policy.compliance.compliancePercentage}% Compliant
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {activeTab === 'users' && inactiveUsers && (
          <InactiveUsersTable inactiveUsers={inactiveUsers} isLoading={inactiveUsersLoading} />
        )}

        {/* Loading States */}
        {summaryLoading && (
          <div className="space-y-6">
            <Card className="p-8">
              <div className="animate-pulse text-center">
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                <div className="h-16 bg-gray-200 rounded w-24 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
              </div>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 