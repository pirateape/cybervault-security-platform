'use client';

import React, { useState, useMemo } from 'react';
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiSettings,
  FiTrendingUp,
  FiTrendingDown,
  FiEye,
  FiFileText,
  FiTarget,
  FiActivity,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

interface PowerPlatformComplianceProps {
  orgId: string;
}

interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'compliant' | 'non-compliant' | 'warning';
  description: string;
  remediation: string;
  affectedResources: number;
  lastChecked: string;
}

interface ComplianceScore {
  overall: number;
  categories: {
    security: number;
    governance: number;
    dataLoss: number;
    access: number;
  };
  trend: 'improving' | 'declining' | 'stable';
}

export function PowerPlatformCompliance({ orgId }: PowerPlatformComplianceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Mock loading state for now - replace with actual API call later
  const isLoading = false;
  const error = null;
  const refetch = () => console.log('Refreshing compliance data...');

  // Mock compliance data - replace with actual API data
  const complianceRules: ComplianceRule[] = useMemo(() => [
    {
      id: 'pp-001',
      name: 'Data Loss Prevention Policies',
      category: 'security',
      severity: 'critical',
      status: 'non-compliant',
      description: 'Apps without proper DLP policies configured',
      remediation: 'Configure DLP policies for all Power Apps containing sensitive data',
      affectedResources: 12,
      lastChecked: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'pp-002',
      name: 'Guest User Access',
      category: 'access',
      severity: 'high',
      status: 'warning',
      description: 'External users have access to Power Platform resources',
      remediation: 'Review and restrict guest user permissions',
      affectedResources: 5,
      lastChecked: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'pp-003',
      name: 'Environment Admin Rights',
      category: 'governance',
      severity: 'medium',
      status: 'compliant',
      description: 'Proper admin role assignment in environments',
      remediation: 'No action required',
      affectedResources: 0,
      lastChecked: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'pp-004',
      name: 'Connector Usage Governance',
      category: 'governance',
      severity: 'high',
      status: 'non-compliant',
      description: 'Unmanaged connectors in use',
      remediation: 'Implement connector governance policies',
      affectedResources: 8,
      lastChecked: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'pp-005',
      name: 'Flow Error Handling',
      category: 'security',
      severity: 'medium',
      status: 'warning',
      description: 'Flows without proper error handling',
      remediation: 'Add try-catch blocks and error notifications',
      affectedResources: 15,
      lastChecked: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ], []);

  const complianceScore: ComplianceScore = useMemo(() => {
    const totalRules = complianceRules.length;
    const compliantRules = complianceRules.filter(rule => rule.status === 'compliant').length;
    const overall = Math.round((compliantRules / totalRules) * 100);

    return {
      overall,
      categories: {
        security: 65,
        governance: 80,
        dataLoss: 45,
        access: 85,
      },
      trend: overall > 70 ? 'improving' : overall < 50 ? 'declining' : 'stable',
    };
  }, [complianceRules]);

  const filteredRules = useMemo(() => {
    return complianceRules.filter(rule => {
      const categoryMatch = selectedCategory === 'all' || rule.category === selectedCategory;
      const severityMatch = selectedSeverity === 'all' || rule.severity === selectedSeverity;
      return categoryMatch && severityMatch;
    });
  }, [complianceRules, selectedCategory, selectedSeverity]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'non-compliant': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return FiCheckCircle;
      case 'non-compliant': return FiXCircle;
      case 'warning': return FiAlertTriangle;
      default: return FiActivity;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading compliance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-400 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Compliance Data</h3>
            <p className="text-red-600 text-sm">Failed to load compliance data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Score Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Compliance Posture</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Refresh compliance data"
            >
              <FiRefreshCw size={16} />
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <FiSettings size={14} className="mr-1" />
              Configure
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(complianceScore.overall)}`}>
              {complianceScore.overall}%
            </div>
            <div className="text-sm text-gray-600">Overall Score</div>
            <div className="flex items-center justify-center mt-1">
              {complianceScore.trend === 'improving' && <FiTrendingUp className="text-green-500 mr-1" size={12} />}
              {complianceScore.trend === 'declining' && <FiTrendingDown className="text-red-500 mr-1" size={12} />}
              <span className="text-xs text-gray-500">{complianceScore.trend}</span>
            </div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(complianceScore.categories.security)}`}>
              {complianceScore.categories.security}%
            </div>
            <div className="text-sm text-gray-600">Security</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(complianceScore.categories.governance)}`}>
              {complianceScore.categories.governance}%
            </div>
            <div className="text-sm text-gray-600">Governance</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(complianceScore.categories.dataLoss)}`}>
              {complianceScore.categories.dataLoss}%
            </div>
            <div className="text-sm text-gray-600">Data Loss Prevention</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(complianceScore.categories.access)}`}>
              {complianceScore.categories.access}%
            </div>
            <div className="text-sm text-gray-600">Access Control</div>
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
              {['all', 'security', 'governance', 'access'].map((category) => (
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
            <span className="text-sm text-gray-600">Severity:</span>
            <div className="flex gap-1">
              {['all', 'critical', 'high'].map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSelectedSeverity(severity)}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    selectedSeverity === severity
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Rules */}
      <div className="space-y-3">
        {filteredRules.map((rule) => {
          const StatusIcon = getStatusIcon(rule.status);
          return (
            <div key={rule.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3 flex-1">
                  <StatusIcon 
                    size={20} 
                    className={rule.status === 'compliant' ? 'text-green-500' : 
                              rule.status === 'non-compliant' ? 'text-red-500' : 'text-orange-500'} 
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{rule.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(rule.severity)}`}>
                        {rule.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(rule.status)}`}>
                        {rule.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                    {rule.status !== 'compliant' && (
                      <p className="text-sm text-blue-600 font-medium">
                        💡 {rule.remediation}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{rule.affectedResources} affected resources</span>
                      <span>Last checked {formatDistanceToNow(new Date(rule.lastChecked))} ago</span>
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
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                    title="Generate report"
                  >
                    <FiFileText size={14} />
                  </button>
                  {rule.status !== 'compliant' && (
                    <button
                      className="p-1.5 text-blue-400 hover:text-blue-600 rounded hover:bg-blue-50"
                      title="Start remediation"
                    >
                      <FiTarget size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiShield size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No compliance rules match the selected filters</p>
        </div>
      )}
    </div>
  );
} 