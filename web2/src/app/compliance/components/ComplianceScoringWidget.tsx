'use client';

import React, { useState, useMemo } from 'react';
import { 
  useComplianceSummary,
  type ComplianceSummary
} from '@data-access/graphComplianceApi';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { IconButton } from '@ui/primitives/IconButton';

interface ComplianceScoringWidgetProps {
  className?: string;
  showDetailedView?: boolean;
}

interface ScoreComponent {
  id: string;
  name: string;
  category: string;
  currentScore: number;
  maxScore: number;
  weight: number;
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
  description: string;
}

interface BenchmarkComparison {
  id: string;
  name: string;
  industry: string;
  organizationSize: string;
  score: number;
  description: string;
}

interface TrendData {
  date: string;
  overallScore: number;
  mfaScore: number;
  conditionalAccessScore: number;
  encryptionScore: number;
  inactiveUsersScore: number;
}

export function ComplianceScoringWidget({ 
  className = '', 
  showDetailedView = false 
}: ComplianceScoringWidgetProps) {
  const { data: complianceSummary, isLoading, error, refetch } = useComplianceSummary();
  const [selectedView, setSelectedView] = useState<'overview' | 'components' | 'trends' | 'benchmarks'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Calculate dynamic compliance score components
  const scoreComponents: ScoreComponent[] = useMemo(() => {
    if (!complianceSummary) return [];

    return [
      {
        id: 'mfa-compliance',
        name: 'MFA Compliance',
        category: 'Authentication',
        currentScore: complianceSummary.mfaCompliance?.percentage || 0,
        maxScore: 100,
        weight: 25,
        trend: complianceSummary.mfaCompliance?.trend || 'stable',
        lastUpdated: new Date().toISOString(),
        description: 'Multi-factor authentication adoption and enforcement across the organization',
      },
      {
        id: 'conditional-access',
        name: 'Conditional Access',
        category: 'Access Control',
        currentScore: complianceSummary.conditionalAccess?.effectivenessScore || 0,
        maxScore: 100,
        weight: 20,
        trend: complianceSummary.conditionalAccess?.trend || 'stable',
        lastUpdated: new Date().toISOString(),
        description: 'Effectiveness and coverage of conditional access policies',
      },
      {
        id: 'encryption-coverage',
        name: 'Encryption Coverage',
        category: 'Data Protection',
        currentScore: complianceSummary.encryption?.overallCompliance || 0,
        maxScore: 100,
        weight: 20,
        trend: complianceSummary.encryption?.trend || 'stable',
        lastUpdated: new Date().toISOString(),
        description: 'Data encryption coverage across storage, transit, and devices',
      },
      {
        id: 'inactive-users',
        name: 'Inactive User Management',
        category: 'Identity Hygiene',
        currentScore: Math.max(0, 100 - (complianceSummary.inactiveUsers?.riskScore || 0)),
        maxScore: 100,
        weight: 15,
        trend: complianceSummary.inactiveUsers?.trend || 'stable',
        lastUpdated: new Date().toISOString(),
        description: 'Management and remediation of inactive user accounts',
      },
      {
        id: 'policy-enforcement',
        name: 'Policy Enforcement',
        category: 'Governance',
        currentScore: complianceSummary.policyEnforcement?.score || 0,
        maxScore: 100,
        weight: 10,
        trend: complianceSummary.policyEnforcement?.trend || 'stable',
        lastUpdated: new Date().toISOString(),
        description: 'Overall policy enforcement and compliance monitoring',
      },
      {
        id: 'incident-response',
        name: 'Incident Response',
        category: 'Security Operations',
        currentScore: complianceSummary.incidentResponse?.readinessScore || 0,
        maxScore: 100,
        weight: 10,
        trend: complianceSummary.incidentResponse?.trend || 'stable',
        lastUpdated: new Date().toISOString(),
        description: 'Incident response capability and security monitoring effectiveness',
      },
    ];
  }, [complianceSummary]);

  // Calculate weighted overall score
  const overallScore = useMemo(() => {
    if (scoreComponents.length === 0) return 0;

    const totalWeightedScore = scoreComponents.reduce((sum, component) => {
      return sum + (component.currentScore * component.weight / 100);
    }, 0);

    const totalWeight = scoreComponents.reduce((sum, component) => sum + component.weight, 0);
    
    return totalWeight > 0 ? Math.round(totalWeightedScore) : 0;
  }, [scoreComponents]);

  // Generate mock trend data for visualization
  const trendData: TrendData[] = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data: TrendData[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic trend data with some variance
      const baseScore = overallScore;
      const variance = Math.random() * 10 - 5; // ±5 points variance
      
      data.push({
        date: date.toISOString().split('T')[0],
        overallScore: Math.max(0, Math.min(100, baseScore + variance)),
        mfaScore: Math.max(0, Math.min(100, (scoreComponents[0]?.currentScore || 0) + variance)),
        conditionalAccessScore: Math.max(0, Math.min(100, (scoreComponents[1]?.currentScore || 0) + variance)),
        encryptionScore: Math.max(0, Math.min(100, (scoreComponents[2]?.currentScore || 0) + variance)),
        inactiveUsersScore: Math.max(0, Math.min(100, (scoreComponents[3]?.currentScore || 0) + variance)),
      });
    }
    
    return data;
  }, [timeRange, overallScore, scoreComponents]);

  // Industry benchmark data
  const benchmarkComparisons: BenchmarkComparison[] = [
    {
      id: 'industry-average',
      name: 'Industry Average',
      industry: 'Technology',
      organizationSize: '1000-5000 employees',
      score: 78,
      description: 'Average compliance score for technology companies of similar size',
    },
    {
      id: 'top-quartile',
      name: 'Top Quartile',
      industry: 'Technology',
      organizationSize: '1000-5000 employees',
      score: 92,
      description: 'Score representing the top 25% of organizations in your category',
    },
    {
      id: 'regulatory-minimum',
      name: 'Regulatory Minimum',
      industry: 'All Industries',
      organizationSize: 'All Sizes',
      score: 65,
      description: 'Minimum compliance score required for regulatory compliance',
    },
    {
      id: 'security-leader',
      name: 'Security Leader',
      industry: 'Technology',
      organizationSize: '1000-5000 employees',
      score: 96,
      description: 'Score representing security-leading organizations',
    },
  ];

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#F59E0B'; // Yellow
    if (score >= 70) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  // Get score grade
  const getScoreGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
  };

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Compliance Score</h3>
          <p className="text-sm text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load compliance scoring data'}
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
          <div className="flex items-center justify-center mb-6">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <h3 className="text-lg font-semibold text-gray-900">Compliance Score</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {(['overview', 'components', 'trends', 'benchmarks'] as const).map((view) => (
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
            ariaLabel="Refresh compliance score"
            variant="ghost"
            colorScheme="secondary"
            size="sm"
          />
        </div>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <>
          {/* Main Score Display */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              {/* Circular Progress */}
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={getScoreColor(overallScore)}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - overallScore / 100)}`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              {/* Score Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: getScoreColor(overallScore) }}>
                    {overallScore}
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                  <div className="text-lg font-semibold" style={{ color: getScoreColor(overallScore) }}>
                    {getScoreGrade(overallScore)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {overallScore >= 90 ? 'Excellent' : 
               overallScore >= 80 ? 'Good' : 
               overallScore >= 70 ? 'Fair' : 'Needs Improvement'} Compliance Posture
            </h4>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {overallScore >= 90 
                ? 'Your organization demonstrates excellent compliance practices with minimal security gaps.'
                : overallScore >= 80
                ? 'Your compliance posture is good with some areas for improvement identified.'
                : overallScore >= 70
                ? 'Your compliance posture is fair but requires attention to critical security areas.'
                : 'Your compliance posture needs immediate attention to address significant security gaps.'
              }
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{scoreComponents.length}</div>
              <div className="text-xs text-gray-600">Components</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {scoreComponents.filter(c => c.trend === 'improving').length}
              </div>
              <div className="text-xs text-gray-600">Improving</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {scoreComponents.filter(c => c.currentScore < 70).length}
              </div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(scoreComponents.reduce((sum, c) => sum + c.weight, 0))}%
              </div>
              <div className="text-xs text-gray-600">Coverage</div>
            </div>
          </div>

          {/* Top Issues */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Areas Needing Attention</h4>
            <div className="space-y-2">
              {scoreComponents
                .filter(component => component.currentScore < 80)
                .sort((a, b) => a.currentScore - b.currentScore)
                .slice(0, 3)
                .map((component) => (
                  <div key={component.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{component.name}</p>
                      <p className="text-xs text-gray-600">{component.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">{component.currentScore}%</div>
                        <div className="text-xs text-gray-500">{component.weight}% weight</div>
                      </div>
                      <Button size="sm" variant="solid" colorScheme="danger">
                        Fix
                      </Button>
                    </div>
                  </div>
                ))
              }
            </div>
            
            {scoreComponents.filter(c => c.currentScore < 80).length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <span className="text-2xl block mb-2">✅</span>
                <p>All compliance components are performing well!</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Components Tab */}
      {selectedView === 'components' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Score Components</h4>
            <span className="text-xs text-gray-500">{scoreComponents.length} components</span>
          </div>
          
          <div className="space-y-3">
            {scoreComponents.map((component) => (
              <div key={component.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-medium text-gray-900 text-sm">{component.name}</h5>
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        {component.category}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        component.trend === 'improving' ? 'bg-green-100 text-green-800' :
                        component.trend === 'declining' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {component.trend === 'improving' ? '📈' : component.trend === 'declining' ? '📉' : '➡️'}
                        {component.trend}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{component.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: getScoreColor(component.currentScore) }}>
                      {component.currentScore}%
                    </div>
                    <div className="text-xs text-gray-500">{component.weight}% weight</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${component.currentScore}%`,
                          backgroundColor: getScoreColor(component.currentScore)
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      Updated: {new Date(component.lastUpdated).toLocaleDateString()}
                    </span>
                    <Button size="sm" variant="outline" colorScheme="secondary">
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {selectedView === 'trends' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Compliance Trends</h4>
            <div className="flex space-x-1">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'solid' : 'outline'}
                  colorScheme={timeRange === range ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="text-xs"
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Simple trend visualization */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-center mb-4">
              <h5 className="text-sm font-medium text-gray-700">Overall Score Trend</h5>
              <div className="text-2xl font-bold" style={{ color: getScoreColor(overallScore) }}>
                {overallScore}%
              </div>
              <div className="text-xs text-gray-500">
                Current Score ({timeRange} view)
              </div>
            </div>
            
            {/* Trend indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'MFA', score: scoreComponents[0]?.currentScore || 0, trend: scoreComponents[0]?.trend },
                { name: 'Access Control', score: scoreComponents[1]?.currentScore || 0, trend: scoreComponents[1]?.trend },
                { name: 'Encryption', score: scoreComponents[2]?.currentScore || 0, trend: scoreComponents[2]?.trend },
                { name: 'User Hygiene', score: scoreComponents[3]?.currentScore || 0, trend: scoreComponents[3]?.trend },
              ].map((item) => (
                <div key={item.name} className="text-center p-3 bg-white rounded border">
                  <div className="text-lg font-bold" style={{ color: getScoreColor(item.score) }}>
                    {item.score}%
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{item.name}</div>
                  <div className={`text-xs ${
                    item.trend === 'improving' ? 'text-green-600' :
                    item.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {item.trend === 'improving' ? '📈' : item.trend === 'declining' ? '📉' : '➡️'}
                    {item.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Historical data summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Trend Analysis</h5>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Overall compliance score has {overallScore >= 80 ? 'improved' : 'declined'} over the selected period</p>
              <p>• {scoreComponents.filter(c => c.trend === 'improving').length} components showing improvement</p>
              <p>• {scoreComponents.filter(c => c.trend === 'declining').length} components need attention</p>
              <p>• Recommended focus: {scoreComponents.sort((a, b) => a.currentScore - b.currentScore)[0]?.name || 'All areas performing well'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Benchmarks Tab */}
      {selectedView === 'benchmarks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Industry Benchmarks</h4>
            <span className="text-xs text-gray-500">Your Score: {overallScore}%</span>
          </div>
          
          <div className="space-y-3">
            {benchmarkComparisons.map((benchmark) => (
              <div key={benchmark.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm mb-1">{benchmark.name}</h5>
                    <p className="text-xs text-gray-600 mb-2">{benchmark.description}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{benchmark.industry}</span>
                      <span>•</span>
                      <span>{benchmark.organizationSize}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: getScoreColor(benchmark.score) }}>
                      {benchmark.score}%
                    </div>
                    <div className={`text-xs font-medium ${
                      overallScore >= benchmark.score ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {overallScore >= benchmark.score 
                        ? `+${overallScore - benchmark.score} ahead` 
                        : `${benchmark.score - overallScore} behind`
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${benchmark.score}%`,
                          backgroundColor: getScoreColor(benchmark.score)
                        }}
                      />
                      {/* Your score marker */}
                      <div 
                        className="absolute top-0 w-1 h-2 bg-blue-600 rounded"
                        style={{ left: `${Math.min(overallScore, 100)}%` }}
                        title={`Your score: ${overallScore}%`}
                      />
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    overallScore >= benchmark.score 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {overallScore >= benchmark.score ? 'Above' : 'Below'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h5 className="text-sm font-medium text-purple-800 mb-2">Benchmark Insights</h5>
            <div className="text-xs text-purple-700 space-y-1">
              <p>• You are performing {overallScore >= 78 ? 'above' : 'below'} industry average</p>
              <p>• {overallScore >= 92 ? 'Congratulations! You\'re in the top quartile' : `${92 - overallScore} points needed to reach top quartile`}</p>
              <p>• Focus areas to improve ranking: {scoreComponents.sort((a, b) => a.currentScore - b.currentScore).slice(0, 2).map(c => c.name).join(', ')}</p>
            </div>
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
            Improve Score
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ComplianceScoringWidget; 