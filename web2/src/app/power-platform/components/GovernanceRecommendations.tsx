'use client';

import React, { useState, useMemo } from 'react';
import {
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiSettings,
  FiUsers,
  FiLock,
  FiEye,
  FiTrendingUp,
  FiTarget,
  FiBookOpen,
  FiRefreshCw,
  FiDownload,
  FiPlay,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

interface GovernanceRecommendationsProps {
  orgId: string;
}

interface GovernanceRecommendation {
  id: string;
  title: string;
  category: 'security' | 'compliance' | 'governance' | 'performance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'dismissed';
  description: string;
  impact: string;
  implementation: {
    steps: string[];
    estimatedTime: string;
    resources: string[];
  };
  metrics: {
    riskReduction: number;
    complianceImprovement: number;
    effortRequired: number;
  };
  affectedResources: number;
  dueDate?: string;
  lastUpdated: string;
}

interface GovernanceMetrics {
  totalRecommendations: number;
  criticalOpen: number;
  implementationRate: number;
  riskReductionPotential: number;
}

export function GovernanceRecommendations({ orgId }: GovernanceRecommendationsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');

  // Mock loading state for now - replace with actual API call later
  const isLoading = false;
  const error = null;
  const refetch = () => console.log('Refreshing governance recommendations...');

  // Mock governance recommendations data
  const recommendations: GovernanceRecommendation[] = useMemo(() => [
    {
      id: 'gov-001',
      title: 'Implement Environment-Level Data Loss Prevention',
      category: 'security',
      priority: 'critical',
      status: 'pending',
      description: 'Configure DLP policies at the environment level to prevent sensitive data exposure across all Power Platform resources.',
      impact: 'Reduces data breach risk by 75% and ensures compliance with data protection regulations.',
      implementation: {
        steps: [
          'Audit current data flows and identify sensitive data types',
          'Create DLP policy templates for different data classifications',
          'Configure environment-specific DLP policies',
          'Test policies in development environment',
          'Deploy to production environments',
          'Monitor and adjust policy effectiveness'
        ],
        estimatedTime: '2-3 weeks',
        resources: ['Power Platform Admin', 'Security Team', 'Compliance Officer']
      },
      metrics: {
        riskReduction: 75,
        complianceImprovement: 85,
        effortRequired: 60
      },
      affectedResources: 45,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'gov-002',
      title: 'Establish Center of Excellence (CoE)',
      category: 'governance',
      priority: 'high',
      status: 'in-progress',
      description: 'Create a centralized governance structure to oversee Power Platform adoption and ensure best practices.',
      impact: 'Improves governance consistency by 90% and reduces shadow IT by 60%.',
      implementation: {
        steps: [
          'Define CoE charter and responsibilities',
          'Identify and train CoE team members',
          'Establish governance processes and workflows',
          'Create documentation and training materials',
          'Implement monitoring and reporting systems',
          'Launch CoE with pilot projects'
        ],
        estimatedTime: '4-6 weeks',
        resources: ['Executive Sponsor', 'IT Leadership', 'Power Platform Champions']
      },
      metrics: {
        riskReduction: 50,
        complianceImprovement: 90,
        effortRequired: 80
      },
      affectedResources: 120,
      lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'gov-003',
      title: 'Implement Connector Governance Policies',
      category: 'security',
      priority: 'high',
      status: 'pending',
      description: 'Control and monitor the use of connectors to prevent unauthorized data access and ensure security compliance.',
      impact: 'Reduces security incidents by 65% and improves data governance visibility.',
      implementation: {
        steps: [
          'Inventory all connectors currently in use',
          'Classify connectors by risk level',
          'Create connector approval workflows',
          'Implement connector usage monitoring',
          'Establish regular connector reviews',
          'Train users on secure connector practices'
        ],
        estimatedTime: '3-4 weeks',
        resources: ['Security Team', 'Power Platform Admin', 'Business Users']
      },
      metrics: {
        riskReduction: 65,
        complianceImprovement: 70,
        effortRequired: 50
      },
      affectedResources: 78,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'gov-004',
      title: 'Automate Environment Lifecycle Management',
      category: 'governance',
      priority: 'medium',
      status: 'pending',
      description: 'Implement automated processes for environment provisioning, configuration, and decommissioning.',
      impact: 'Reduces manual effort by 80% and ensures consistent environment configurations.',
      implementation: {
        steps: [
          'Define environment lifecycle policies',
          'Create environment templates',
          'Implement automation scripts',
          'Set up monitoring and alerting',
          'Test automation workflows',
          'Deploy automated lifecycle management'
        ],
        estimatedTime: '5-6 weeks',
        resources: ['DevOps Team', 'Power Platform Admin', 'IT Operations']
      },
      metrics: {
        riskReduction: 30,
        complianceImprovement: 60,
        effortRequired: 70
      },
      affectedResources: 25,
      lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'gov-005',
      title: 'Implement User Access Reviews',
      category: 'compliance',
      priority: 'high',
      status: 'pending',
      description: 'Establish regular access reviews to ensure users have appropriate permissions and remove unused access.',
      impact: 'Improves access governance by 85% and reduces security risk from over-privileged accounts.',
      implementation: {
        steps: [
          'Define access review schedule and scope',
          'Identify access reviewers and responsibilities',
          'Create access review workflows',
          'Implement automated access reporting',
          'Conduct pilot access review',
          'Roll out organization-wide access reviews'
        ],
        estimatedTime: '2-3 weeks',
        resources: ['Security Team', 'HR Team', 'Business Managers']
      },
      metrics: {
        riskReduction: 70,
        complianceImprovement: 85,
        effortRequired: 40
      },
      affectedResources: 156,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ], []);

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
      const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
      const statusMatch = selectedStatus === 'all' || rec.status === selectedStatus;
      return categoryMatch && priorityMatch && statusMatch;
    });
  }, [recommendations, selectedCategory, selectedPriority, selectedStatus]);

  const metrics: GovernanceMetrics = useMemo(() => {
    const totalRecommendations = recommendations.length;
    const criticalOpen = recommendations.filter(r => r.priority === 'critical' && r.status !== 'completed').length;
    const completed = recommendations.filter(r => r.status === 'completed').length;
    const implementationRate = Math.round((completed / totalRecommendations) * 100);
    const riskReductionPotential = Math.round(
      recommendations
        .filter(r => r.status !== 'completed')
        .reduce((sum, r) => sum + r.metrics.riskReduction, 0) / 
      recommendations.filter(r => r.status !== 'completed').length
    );

    return {
      totalRecommendations,
      criticalOpen,
      implementationRate,
      riskReductionPotential: riskReductionPotential || 0,
    };
  }, [recommendations]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'dismissed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return FiShield;
      case 'compliance': return FiCheckCircle;
      case 'governance': return FiSettings;
      case 'performance': return FiTrendingUp;
      default: return FiBookOpen;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading governance recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-400 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Recommendations</h3>
            <p className="text-red-600 text-sm">Failed to load governance recommendations. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Governance Recommendations</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Refresh recommendations"
            >
              <FiRefreshCw size={16} />
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <FiDownload size={14} className="mr-1" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.totalRecommendations}</div>
            <div className="text-sm text-gray-600">Total Recommendations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{metrics.criticalOpen}</div>
            <div className="text-sm text-gray-600">Critical Open</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.implementationRate}%</div>
            <div className="text-sm text-gray-600">Implementation Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{metrics.riskReductionPotential}%</div>
            <div className="text-sm text-gray-600">Risk Reduction Potential</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Category:</span>
            <div className="flex gap-1">
              {['all', 'security', 'governance', 'compliance', 'performance'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Priority:</span>
            <div className="flex gap-1">
              {['all', 'critical', 'high', 'medium'].map((priority) => (
                <button
                  key={priority}
                  onClick={() => setSelectedPriority(priority)}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    selectedPriority === priority
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <div className="flex gap-1">
              {['all', 'pending', 'in-progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    selectedStatus === status
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((recommendation) => {
          const CategoryIcon = getCategoryIcon(recommendation.category);
          return (
            <div key={recommendation.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <CategoryIcon size={20} className="text-blue-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-gray-900">{recommendation.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(recommendation.status)}`}>
                        {recommendation.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800 font-medium">📈 Expected Impact:</p>
                      <p className="text-sm text-blue-700">{recommendation.impact}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                    title="View details"
                  >
                    <FiEye size={14} />
                  </button>
                  {recommendation.status === 'pending' && (
                    <button
                      className="p-1.5 text-green-400 hover:text-green-600 rounded hover:bg-green-50"
                      title="Start implementation"
                    >
                      <FiPlay size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Implementation Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Implementation Steps:</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    {recommendation.implementation.steps.slice(0, 3).map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                    {recommendation.implementation.steps.length > 3 && (
                      <li className="text-gray-400 text-xs">
                        +{recommendation.implementation.steps.length - 3} more steps...
                      </li>
                    )}
                  </ol>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Required Resources:</h4>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.implementation.resources.map((resource, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metrics and Timeline */}
              <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <span>🎯 Risk Reduction: {recommendation.metrics.riskReduction}%</span>
                  <span>📊 Compliance: +{recommendation.metrics.complianceImprovement}%</span>
                  <span>⏱️ Effort: {recommendation.implementation.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>{recommendation.affectedResources} affected resources</span>
                  {recommendation.dueDate && (
                    <span className="text-orange-600">
                      Due {formatDistanceToNow(new Date(recommendation.dueDate))} from now
                    </span>
                  )}
                  <span>Updated {formatDistanceToNow(new Date(recommendation.lastUpdated))} ago</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiTarget size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recommendations match the selected filters</p>
        </div>
      )}
    </div>
  );
} 