'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useRuleVersionHistory,
  useRuleTestHistory,
  useRuleImpactAnalysis,
  useRuleConfiguration,
  useRuleDependencies,
  useRuleTemplates,
  useBulkRuleOperations,
  type RuleVersion,
  type RuleTestResult,
  type RuleImpactAnalysis as RuleImpactAnalysisType,
  type RuleConfiguration as RuleConfigurationType,
  type RuleDependency
} from '@/libs/data-access/enhancedRulesApi';

// Import components
import { RuleVersionControl } from './components/RuleVersionControl';
import { RuleTestingEnvironment } from './components/RuleTestingEnvironment';
import { RuleImpactAnalysis } from './components/RuleImpactAnalysis';
import { RuleConfigurationWizard } from './components/RuleConfigurationWizard';
import { RuleDependencyManager } from './components/RuleDependencyManager';

interface EnhancedRulesPageProps {
  searchParams?: {
    ruleId?: string;
    tab?: string;
    orgId?: string;
  };
}

export default function EnhancedRulesPage({ searchParams }: EnhancedRulesPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(searchParams?.tab || 'overview');
  const [selectedRuleId, setSelectedRuleId] = useState(searchParams?.ruleId || '');
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [orgId] = useState(searchParams?.orgId || 'default-org');

  // API hooks - only fetch when rule is selected
  const { data: versionHistory, isLoading: versionsLoading } = useRuleVersionHistory(
    orgId, 
    selectedRuleId
  );
  
  const { data: testHistory, isLoading: testsLoading } = useRuleTestHistory(
    orgId, 
    selectedRuleId
  );
  
  const { data: impactAnalysis, isLoading: impactLoading } = useRuleImpactAnalysis(
    orgId, 
    selectedRuleId
  );
  
  const { data: configuration, isLoading: configLoading } = useRuleConfiguration(
    orgId, 
    selectedRuleId
  );
  
  const { data: dependencies, isLoading: depsLoading } = useRuleDependencies(
    orgId, 
    selectedRuleId
  );

  const { data: ruleTemplates } = useRuleTemplates();
  const bulkOperations = useBulkRuleOperations(orgId);

  // Update URL when tab changes
  useEffect(() => {
    if (searchParams?.tab !== activeTab || searchParams?.ruleId !== selectedRuleId) {
      const params = new URLSearchParams();
      if (selectedRuleId) params.set('ruleId', selectedRuleId);
      if (activeTab !== 'overview') params.set('tab', activeTab);
      if (orgId !== 'default-org') params.set('orgId', orgId);
      
      const newUrl = `/enhanced-rules${params.toString() ? `?${params.toString()}` : ''}`;
      router.push(newUrl, { scroll: false });
    }
  }, [activeTab, selectedRuleId, orgId, searchParams, router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleRuleSelect = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setActiveTab('overview');
  };

  const handleBulkOperation = async (operation: string, parameters?: any) => {
    if (selectedRuleIds.length === 0) {
      alert('Please select rules first');
      return;
    }

    try {
      await bulkOperations.mutateAsync({
        operation,
        ruleIds: selectedRuleIds,
        parameters
      });
      
      // Reset selection after successful operation
      setSelectedRuleIds([]);
      alert(`Bulk ${operation} completed successfully`);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      alert(`Bulk ${operation} failed. Please try again.`);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'versions', name: 'Version Control', icon: '🔄' },
    { id: 'testing', name: 'Testing Environment', icon: '🧪' },
    { id: 'impact', name: 'Impact Analysis', icon: '⚡' },
    { id: 'configuration', name: 'Configuration Wizard', icon: '⚙️' },
    { id: 'dependencies', name: 'Dependency Manager', icon: '🔗' },
  ];

  const isLoading = versionsLoading || testsLoading || impactLoading || configLoading || depsLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enhanced Rules Management</h1>
              <p className="mt-2 text-gray-600">
                Advanced rule management with version control, testing, and impact analysis
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => handleTabChange('configuration')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Rule
              </button>
              
              {selectedRuleIds.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkOperation('export')}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Export ({selectedRuleIds.length})
                  </button>
                  <button
                    onClick={() => handleBulkOperation('test')}
                    className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Test All
                  </button>
                  <button
                    onClick={() => handleBulkOperation('analyze')}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Analyze Impact
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rule Selection */}
        {!selectedRuleId && activeTab !== 'overview' && activeTab !== 'configuration' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Rule Selection Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Please select a rule to view {tabs.find(t => t.id === activeTab)?.name.toLowerCase()}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && selectedRuleId && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading rule data...</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Rules</p>
                    <p className="text-2xl font-semibold text-gray-900">156</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Rules</p>
                    <p className="text-2xl font-semibold text-gray-900">142</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🧪</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tests Run Today</p>
                    <p className="text-2xl font-semibold text-gray-900">47</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">High Impact Rules</p>
                    <p className="text-2xl font-semibold text-gray-900">23</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { action: 'Rule Updated', rule: 'Data Encryption Policy', time: '2 hours ago', user: 'John Doe' },
                    { action: 'Test Completed', rule: 'Access Control Rule', time: '4 hours ago', user: 'Jane Smith' },
                    { action: 'Impact Analysis', rule: 'Backup Verification', time: '6 hours ago', user: 'Mike Johnson' },
                    { action: 'Version Restored', rule: 'Network Security', time: '1 day ago', user: 'Sarah Wilson' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">
                            {activity.user.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action}: <span className="text-blue-600">{activity.rule}</span>
                          </p>
                          <p className="text-xs text-gray-500">by {activity.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <RuleVersionControl
            ruleId={selectedRuleId}
            orgId={orgId}
            versionHistory={versionHistory}
            isLoading={versionsLoading}
            onRuleSelect={handleRuleSelect}
          />
        )}

        {activeTab === 'testing' && (
          <RuleTestingEnvironment
            ruleId={selectedRuleId}
            orgId={orgId}
            testHistory={testHistory}
            isLoading={testsLoading}
            onRuleSelect={handleRuleSelect}
          />
        )}

        {activeTab === 'impact' && (
          <RuleImpactAnalysis
            ruleId={selectedRuleId}
            orgId={orgId}
            impactAnalysis={impactAnalysis}
            isLoading={impactLoading}
            onRuleSelect={handleRuleSelect}
          />
        )}

        {activeTab === 'configuration' && (
          <RuleConfigurationWizard
            ruleId={selectedRuleId}
            orgId={orgId}
            configuration={configuration}
            templates={ruleTemplates}
            isLoading={configLoading}
            onRuleSelect={handleRuleSelect}
            onRuleCreated={handleRuleSelect}
          />
        )}

        {activeTab === 'dependencies' && (
          <RuleDependencyManager
            ruleId={selectedRuleId}
            orgId={orgId}
            dependencies={dependencies}
            isLoading={depsLoading}
            onRuleSelect={handleRuleSelect}
          />
        )}
      </div>
    </div>
  );
} 