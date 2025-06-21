'use client';

import React, { useState } from 'react';
import { 
  Brain, 
  Code, 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Activity,
  FileText,
  Zap,
  Target,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

import { useAIAnalysis } from '@/libs/data-access/aiAnalysisApi';
import CodeAnalysisComponent from './components/CodeAnalysis';
import AIFeedbackComponent from './components/AIFeedback';
import RiskAnalysisComponent from './components/RiskAnalysis';
import VulnerabilityAssessmentComponent from './components/VulnerabilityAssessment';
import AnalysisHistoryComponent from './components/AnalysisHistory';
import AIModelMetricsComponent from './components/AIModelMetrics';

interface AnalysisStats {
  totalAnalyses: number;
  activeScans: number;
  criticalIssues: number;
  averageRiskScore: number;
  modelAccuracy: number;
  processingTime: number;
}

export default function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch AI analysis data
  const { data: healthStatus, isLoading: healthLoading } = useAIAnalysis.useHealthStatus();
  const { data: modelMetrics, isLoading: metricsLoading } = useAIAnalysis.useAIModelMetrics();
  const { data: codeAnalysisHistory } = useAIAnalysis.useCodeAnalysisHistory(10);
  const { data: riskAnalysisHistory } = useAIAnalysis.useRiskAnalysisHistory(10);
  const { data: vulnerabilityAssessments } = useAIAnalysis.useVulnerabilityAssessments(10);

  // Calculate statistics
  const stats: AnalysisStats = React.useMemo(() => {
    const totalAnalyses = (codeAnalysisHistory?.length || 0) + 
                         (riskAnalysisHistory?.length || 0) + 
                         (vulnerabilityAssessments?.length || 0);
    
    const criticalIssues = vulnerabilityAssessments?.reduce((acc, assessment) => 
      acc + assessment.summary.criticalCount, 0) || 0;
    
    const averageRiskScore = riskAnalysisHistory?.length ? 
      riskAnalysisHistory.reduce((acc, risk) => acc + risk.riskScore, 0) / riskAnalysisHistory.length : 0;
    
    const modelAccuracy = modelMetrics?.length ? 
      modelMetrics.reduce((acc, model) => acc + model.accuracy, 0) / modelMetrics.length : 0;
    
    const processingTime = modelMetrics?.length ? 
      modelMetrics.reduce((acc, model) => acc + model.processingTime, 0) / modelMetrics.length : 0;

    return {
      totalAnalyses,
      activeScans: 3, // Mock active scans
      criticalIssues,
      averageRiskScore,
      modelAccuracy,
      processingTime,
    };
  }, [codeAnalysisHistory, riskAnalysisHistory, vulnerabilityAssessments, modelMetrics]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getHealthStatusColor = (status: any) => {
    if (!status) return 'bg-gray-500';
    if (status.status === 'healthy') return 'bg-green-500';
    if (status.status === 'degraded') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskLevelColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50';
    if (score >= 6) return 'text-orange-600 bg-orange-50';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'code-analysis', label: 'Code Analysis', icon: Code },
    { id: 'ai-feedback', label: 'AI Feedback', icon: Brain },
    { id: 'risk-analysis', label: 'Risk Analysis', icon: Shield },
    { id: 'vulnerability', label: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Analysis Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive AI-powered security analysis and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getHealthStatusColor(healthStatus)}`} />
            <span className="text-sm text-gray-600">
              {healthLoading ? 'Checking...' : healthStatus?.status || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyses}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Scans</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeScans}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalIssues}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
              <p className={`text-2xl font-bold ${getRiskLevelColor(stats.averageRiskScore).split(' ')[0]}`}>
                {stats.averageRiskScore.toFixed(1)}
              </p>
            </div>
            <Target className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{(stats.modelAccuracy * 100).toFixed(1)}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.processingTime.toFixed(0)}ms</p>
            </div>
            <Clock className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* System Health Alert */}
      {healthStatus && healthStatus.status !== 'healthy' && (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <p className="text-orange-800">
              AI Analysis system is experiencing issues: {healthStatus.message || 'Performance degraded'}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Analysis Activity */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Analysis Activity
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Latest AI analysis results and trends
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {codeAnalysisHistory?.slice(0, 5).map((analysis, index) => (
                        <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Code className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="font-medium text-sm">{analysis.filename}</p>
                              <p className="text-xs text-gray-500">{analysis.language}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              analysis.issues.some(i => i.severity === 'critical') 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {analysis.issues.length} issues
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {analysis.complexity.toFixed(1)} complexity
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!codeAnalysisHistory || codeAnalysisHistory.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <Code className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No recent code analysis found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Model Performance */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      AI Model Performance
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Current AI model metrics and performance indicators
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {modelMetrics?.slice(0, 3).map((model) => (
                        <div key={model.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{model.modelName}</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {model.version}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Accuracy</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${model.accuracy * 100}%` }}
                                  ></div>
                                </div>
                                <span className="font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-600">Processing Time</p>
                              <p className="font-medium">{model.processingTime}ms</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!modelMetrics || modelMetrics.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No AI model metrics available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Distribution */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Distribution Overview
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Current risk levels across analyzed assets
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {['low', 'medium', 'high', 'critical'].map((level) => {
                      const count = riskAnalysisHistory?.filter(r => r.riskLevel === level).length || 0;
                      const percentage = riskAnalysisHistory?.length ? (count / riskAnalysisHistory.length) * 100 : 0;
                      
                      return (
                        <div key={level} className="text-center p-4 border rounded-lg">
                          <div className={`text-2xl font-bold ${getRiskLevelColor(
                            level === 'critical' ? 9 : level === 'high' ? 7 : level === 'medium' ? 5 : 2
                          ).split(' ')[0]}`}>
                            {count}
                          </div>
                          <p className="text-sm text-gray-600 capitalize">{level} Risk</p>
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code-analysis' && (
            <CodeAnalysisComponent key={`code-${refreshKey}`} />
          )}

          {activeTab === 'ai-feedback' && (
            <AIFeedbackComponent key={`feedback-${refreshKey}`} />
          )}

          {activeTab === 'risk-analysis' && (
            <RiskAnalysisComponent key={`risk-${refreshKey}`} />
          )}

          {activeTab === 'vulnerability' && (
            <VulnerabilityAssessmentComponent key={`vuln-${refreshKey}`} />
          )}

          {activeTab === 'history' && (
            <AnalysisHistoryComponent key={`history-${refreshKey}`} />
          )}
        </div>
      </div>
    </div>
  );
} 