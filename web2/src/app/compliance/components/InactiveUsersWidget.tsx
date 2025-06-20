'use client';

import React, { useState, useMemo } from 'react';
import { 
  useInactiveUsers, 
  type InactiveUser,
  getRiskLevelColor
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface InactiveUsersWidgetProps {
  className?: string;
  daysThreshold?: number;
  showDetailedView?: boolean;
  onUserSelect?: (user: InactiveUser) => void;
}

interface CleanupRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  affectedUsers: number;
  riskReduction: number;
  effort: 'low' | 'medium' | 'high';
  automation: boolean;
}

export function InactiveUsersWidget({ 
  className = '', 
  daysThreshold = 90,
  showDetailedView = false,
  onUserSelect 
}: InactiveUsersWidgetProps) {
  const { data: inactiveUsers, isLoading, error, refetch } = useInactiveUsers(daysThreshold);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'high' | 'critical'>('all');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [sortBy, setSortBy] = useState<'riskScore' | 'daysSinceLastSignIn' | 'displayName'>('riskScore');

  // Calculate inactive user metrics
  const metrics = useMemo(() => {
    if (!inactiveUsers) return null;

    const total = inactiveUsers.length;
    const critical = inactiveUsers.filter(user => user.riskLevel === 'critical').length;
    const high = inactiveUsers.filter(user => user.riskLevel === 'high').length;
    const medium = inactiveUsers.filter(user => user.riskLevel === 'medium').length;
    const low = inactiveUsers.filter(user => user.riskLevel === 'low').length;

    const averageRiskScore = total > 0 
      ? Math.round(inactiveUsers.reduce((sum, user) => sum + user.riskScore, 0) / total)
      : 0;

    const averageDaysInactive = total > 0
      ? Math.round(inactiveUsers.reduce((sum, user) => sum + user.daysSinceLastSignIn, 0) / total)
      : 0;

    const disabledUsers = inactiveUsers.filter(user => !user.accountEnabled).length;
    const neverSignedIn = inactiveUsers.filter(user => !user.lastSignInDateTime).length;

    return {
      total,
      critical,
      high,
      medium,
      low,
      averageRiskScore,
      averageDaysInactive,
      disabledUsers,
      neverSignedIn,
      highRiskPercentage: total > 0 ? Math.round(((critical + high) / total) * 100) : 0,
    };
  }, [inactiveUsers]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    if (!inactiveUsers) return [];

    let filtered = inactiveUsers;

    // Apply risk filter
    if (selectedRiskFilter !== 'all') {
      filtered = inactiveUsers.filter(user => user.riskLevel === selectedRiskFilter);
    }

    // Sort users
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'riskScore':
          return b.riskScore - a.riskScore;
        case 'daysSinceLastSignIn':
          return b.daysSinceLastSignIn - a.daysSinceLastSignIn;
        case 'displayName':
          return a.displayName.localeCompare(b.displayName);
        default:
          return 0;
      }
    });
  }, [inactiveUsers, selectedRiskFilter, sortBy]);

  // Generate cleanup recommendations
  const cleanupRecommendations: CleanupRecommendation[] = useMemo(() => {
    if (!metrics) return [];

    const recommendations: CleanupRecommendation[] = [];

    if (metrics.critical > 0) {
      recommendations.push({
        id: 'disable-critical-users',
        title: 'Disable Critical Risk Users',
        description: `${metrics.critical} users pose critical security risks and should be disabled immediately.`,
        priority: 'high',
        action: 'Disable accounts for users with critical risk scores (>80%)',
        affectedUsers: metrics.critical,
        riskReduction: 85,
        effort: 'low',
        automation: true,
      });
    }

    if (metrics.neverSignedIn > 0) {
      recommendations.push({
        id: 'cleanup-never-signed-in',
        title: 'Clean Up Never-Used Accounts',
        description: `${metrics.neverSignedIn} accounts have never been used and can likely be safely removed.`,
        priority: 'high',
        action: 'Review and delete accounts that have never been signed into',
        affectedUsers: metrics.neverSignedIn,
        riskReduction: 70,
        effort: 'medium',
        automation: false,
      });
    }

    if (metrics.high > 0) {
      recommendations.push({
        id: 'review-high-risk',
        title: 'Review High-Risk Inactive Users',
        description: `${metrics.high} users are classified as high-risk and need immediate attention.`,
        priority: 'high',
        action: 'Conduct security review of high-risk inactive accounts',
        affectedUsers: metrics.high,
        riskReduction: 60,
        effort: 'medium',
        automation: false,
      });
    }

    if (metrics.averageDaysInactive > 180) {
      recommendations.push({
        id: 'implement-retention-policy',
        title: 'Implement Account Retention Policy',
        description: 'Average inactivity period is high. Consider implementing automated retention policies.',
        priority: 'medium',
        action: 'Create automated policies to disable accounts after extended inactivity',
        affectedUsers: Math.floor(metrics.total * 0.6),
        riskReduction: 45,
        effort: 'high',
        automation: true,
      });
    }

    if (metrics.disabledUsers > 0) {
      recommendations.push({
        id: 'cleanup-disabled-accounts',
        title: 'Clean Up Disabled Accounts',
        description: `${metrics.disabledUsers} accounts are already disabled but still exist in the system.`,
        priority: 'low',
        action: 'Archive or delete disabled accounts after retention period',
        affectedUsers: metrics.disabledUsers,
        riskReduction: 20,
        effort: 'low',
        automation: true,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [metrics]);

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Inactive Users</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load inactive users data'}
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
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
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
          <span className="text-2xl">👥</span>
          <h3 className="text-lg font-semibold text-gray-900">Inactive Users</h3>
          <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
            {daysThreshold}+ days
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={showRecommendations ? 'solid' : 'outline'}
            colorScheme={showRecommendations ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowRecommendations(!showRecommendations)}
          >
            {showRecommendations ? 'Hide' : 'Show'} Recommendations
          </Button>
          <IconButton
            icon={<span className="text-sm">🔄</span>}
            onClick={() => refetch()}
            ariaLabel="Refresh inactive users data"
            variant="ghost"
            colorScheme="secondary"
            size="sm"
          />
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Total Inactive</p>
              <p className="text-2xl font-bold text-red-900">{metrics.total}</p>
              <p className="text-xs text-red-600">Users inactive {daysThreshold}+ days</p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">High Risk</p>
              <p className="text-2xl font-bold text-orange-900">{metrics.highRiskPercentage}%</p>
              <p className="text-xs text-orange-600">{metrics.critical + metrics.high} critical/high risk</p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Avg Risk Score</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.averageRiskScore}%</p>
              <p className="text-xs text-purple-600">Avg {metrics.averageDaysInactive} days inactive</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Level Distribution</h4>
        <div className="space-y-2">
          {[
            { level: 'critical', count: metrics.critical, color: 'bg-red-500', textColor: 'text-red-700' },
            { level: 'high', count: metrics.high, color: 'bg-orange-500', textColor: 'text-orange-700' },
            { level: 'medium', count: metrics.medium, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
            { level: 'low', count: metrics.low, color: 'bg-green-500', textColor: 'text-green-700' },
          ].map(({ level, count, color, textColor }) => (
            <div key={level} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${color}`}></div>
                <span className={`text-sm font-medium capitalize ${textColor}`}>{level}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{count} users</span>
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

      {/* Cleanup Recommendations */}
      {showRecommendations && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Cleanup Recommendations</h4>
          <div className="space-y-3">
            {cleanupRecommendations.map((recommendation) => (
              <div 
                key={recommendation.id}
                className={`p-4 rounded-lg border-l-4 ${
                  recommendation.priority === 'high' 
                    ? 'bg-red-50 border-red-400'
                    : recommendation.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900 text-sm">{recommendation.title}</h5>
                      {recommendation.automation && (
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          AUTOMATED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{recommendation.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Affected Users:</span>
                        <span className="ml-1 text-gray-600">{recommendation.affectedUsers}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Risk Reduction:</span>
                        <span className="ml-1 text-gray-600">{recommendation.riskReduction}%</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Effort:</span>
                        <span className={`ml-1 ${
                          recommendation.effort === 'high' ? 'text-red-600' :
                          recommendation.effort === 'medium' ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {recommendation.effort.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Priority:</span>
                        <span className={`ml-1 ${
                          recommendation.priority === 'high' ? 'text-red-600' :
                          recommendation.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                        }`}>
                          {recommendation.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    colorScheme={recommendation.priority === 'high' ? 'danger' : 'secondary'}
                    className="ml-3"
                  >
                    {recommendation.automation ? 'Configure' : 'Review'}
                  </Button>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>Action:</strong> {recommendation.action}
                  </p>
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
            <div className="flex items-center space-x-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="riskScore">Sort by Risk Score</option>
                <option value="daysSinceLastSignIn">Sort by Days Inactive</option>
                <option value="displayName">Sort by Name</option>
              </select>
              <div className="flex space-x-1">
                {(['all', 'critical', 'high'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedRiskFilter === filter ? 'solid' : 'outline'}
                    colorScheme={selectedRiskFilter === filter ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedRiskFilter(filter)}
                    className="text-xs capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {filteredAndSortedUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => onUserSelect?.(user)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.userPrincipalName}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {user.daysSinceLastSignIn} days inactive
                          </span>
                          {user.department && (
                            <span className="text-xs text-gray-400">• {user.department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{user.riskScore}%</span>
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
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1"
                        style={{ 
                          backgroundColor: `${getRiskLevelColor(user.riskLevel)}20`,
                          color: getRiskLevelColor(user.riskLevel)
                        }}
                      >
                        {user.recommendedAction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.accountEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.accountEnabled ? 'Active' : 'Disabled'}
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
                </div>
              ))}
            </div>
          </div>

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl block mb-2">🔍</span>
              <p>No inactive users found matching the selected filter.</p>
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
          <Button size="sm" variant="solid" colorScheme="danger">
            Bulk Actions
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default InactiveUsersWidget; 