'use client';

import React, { useState } from 'react';
import {
  useAnalyzeRuleImpact,
  type RuleImpactAnalysis as RuleImpactAnalysisType
} from '@/libs/data-access/enhancedRulesApi';

interface RuleImpactAnalysisProps {
  ruleId: string;
  orgId: string;
  impactAnalysis?: RuleImpactAnalysisType;
  isLoading: boolean;
  onRuleSelect: (ruleId: string) => void;
}

export function RuleImpactAnalysis({
  ruleId,
  orgId,
  impactAnalysis,
  isLoading,
  onRuleSelect
}: RuleImpactAnalysisProps) {
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const analyzeImpact = useAnalyzeRuleImpact(orgId, ruleId);

  const handleRunAnalysis = async () => {
    try {
      await analyzeImpact.mutateAsync({
        analysisType,
        includePerformance: true,
        includeCompliance: true,
        includeDependencies: true
      });
      setShowAnalysisDialog(false);
    } catch (error) {
      console.error('Failed to run impact analysis:', error);
    }
  };

  const getImpactSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!ruleId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">📊</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Impact Analysis</h3>
          <p className="text-gray-500 mb-6">
            Select a rule to analyze its impact on compliance and performance.
          </p>
          <button
            onClick={() => onRuleSelect('sample-rule-1')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Rules
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Impact Analysis</h2>
            <p className="text-gray-600">Rule ID: {ruleId}</p>
          </div>
          <button
            onClick={() => setShowAnalysisDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run New Analysis
          </button>
        </div>

        {impactAnalysis && (
          <div className="text-sm text-gray-500">
            Last analysis: {formatDate(impactAnalysis.analyzed_at)}
          </div>
        )}
      </div>

      {impactAnalysis ? (
        <>
          {/* Impact Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Compliance Impact</h3>
                <span className="text-2xl">⚖️</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Overall Score</span>
                    <span className={`text-xl font-bold ${getComplianceScoreColor(impactAnalysis.compliance_impact.overall_score)}`}>
                      {impactAnalysis.compliance_impact.overall_score}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Affected Standards</span>
                    <span className="text-sm font-medium">
                      {impactAnalysis.compliance_impact.affected_standards.length}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      getImpactSeverityColor(impactAnalysis.compliance_impact.risk_level)
                    }`}>
                      {impactAnalysis.compliance_impact.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Performance Impact</h3>
                <span className="text-2xl">⚡</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Processing Time</span>
                    <span className="text-sm font-medium">
                      {impactAnalysis.performance_impact.processing_time_ms}ms
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium">
                      {impactAnalysis.performance_impact.memory_usage_mb}MB
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Impact Level</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      getImpactSeverityColor(impactAnalysis.performance_impact.impact_level)
                    }`}>
                      {impactAnalysis.performance_impact.impact_level}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Dependencies</h3>
                <span className="text-2xl">🔗</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Affected Rules</span>
                    <span className="text-sm font-medium">
                      {impactAnalysis.dependency_impact.affected_rules.length}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conflicts</span>
                    <span className="text-sm font-medium">
                      {impactAnalysis.dependency_impact.conflicts.length}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Impact Level</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      getImpactSeverityColor(impactAnalysis.dependency_impact.impact_level)
                    }`}>
                      {impactAnalysis.dependency_impact.impact_level}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Compliance Analysis</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Affected Standards</h4>
                    <div className="space-y-2">
                      {impactAnalysis.compliance_impact.affected_standards.map((standard, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                          <span className="text-sm">{standard}</span>
                          <span className="text-xs text-gray-500">Standard</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {impactAnalysis.compliance_impact.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {impactAnalysis.compliance_impact.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Performance Analysis</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <div className="text-lg font-medium">
                        {impactAnalysis.performance_impact.cpu_usage_percent}%
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Throughput</span>
                      <div className="text-lg font-medium">
                        {impactAnalysis.performance_impact.throughput_ops_sec} ops/sec
                      </div>
                    </div>
                  </div>
                  
                  {impactAnalysis.performance_impact.bottlenecks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Identified Bottlenecks</h4>
                      <ul className="space-y-1">
                        {impactAnalysis.performance_impact.bottlenecks.map((bottleneck, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-yellow-500 mr-2">⚠️</span>
                            {bottleneck}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dependencies and Conflicts */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Dependency Analysis</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Affected Rules</h4>
                  <div className="space-y-2">
                    {impactAnalysis.dependency_impact.affected_rules.map((rule, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{rule}</span>
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          View Rule
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Conflicts</h4>
                  {impactAnalysis.dependency_impact.conflicts.length > 0 ? (
                    <div className="space-y-2">
                      {impactAnalysis.dependency_impact.conflicts.map((conflict, index) => (
                        <div key={index} className="py-2 px-3 bg-red-50 border border-red-200 rounded">
                          <div className="text-sm font-medium text-red-800">{conflict}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No conflicts detected</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {impactAnalysis.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Overall Recommendations</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {impactAnalysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-500 mt-0.5">💡</span>
                      <div className="flex-1">
                        <p className="text-sm text-blue-900">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Available</h3>
            <p className="text-gray-500 mb-6">
              Run an impact analysis to understand how this rule affects your compliance and performance.
            </p>
            <button
              onClick={() => setShowAnalysisDialog(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Analysis
            </button>
          </div>
        </div>
      )}

      {/* Analysis Dialog */}
      {showAnalysisDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Run Impact Analysis
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Type
                </label>
                <select
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="comprehensive">Comprehensive Analysis</option>
                  <option value="compliance-only">Compliance Only</option>
                  <option value="performance-only">Performance Only</option>
                  <option value="dependencies-only">Dependencies Only</option>
                </select>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> This analysis will evaluate the impact of the current rule
                  configuration on compliance standards, system performance, and dependent rules.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAnalysisDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzeImpact.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {analyzeImpact.isPending ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 