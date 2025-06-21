'use client';

import React, { useState } from 'react';
import {
  useTestRule,
  useGenerateTestData,
  type RuleTestResult
} from '@/libs/data-access/enhancedRulesApi';

interface RuleTestingEnvironmentProps {
  ruleId: string;
  orgId: string;
  testHistory?: RuleTestResult[];
  isLoading: boolean;
  onRuleSelect: (ruleId: string) => void;
}

export function RuleTestingEnvironment({
  ruleId,
  orgId,
  testHistory = [],
  isLoading,
  onRuleSelect
}: RuleTestingEnvironmentProps) {
  const [testData, setTestData] = useState('');
  const [testType, setTestType] = useState('manual');
  const [scenario, setScenario] = useState('normal');
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<RuleTestResult | null>(null);

  const testRule = useTestRule(orgId, ruleId);
  const generateTestData = useGenerateTestData(orgId, ruleId);

  const handleRunTest = async () => {
    if (!testData.trim()) {
      alert('Please provide test data');
      return;
    }

    try {
      const parsedData = JSON.parse(testData);
      await testRule.mutateAsync({
        testData: parsedData,
        testType
      });
      setTestData('');
      setShowTestDialog(false);
    } catch (error) {
      console.error('Failed to run test:', error);
      alert('Failed to run test. Please check your test data format.');
    }
  };

  const handleGenerateTestData = async () => {
    try {
      const result = await generateTestData.mutateAsync({
        scenario,
        count: 5
      });
      setTestData(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Failed to generate test data:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTestResultBadge = (result: RuleTestResult) => {
    if (result.result.passed) {
      return { text: 'Passed', color: 'bg-green-100 text-green-800' };
    } else {
      return { text: 'Failed', color: 'bg-red-100 text-red-800' };
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!ruleId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🧪</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Testing Environment</h3>
          <p className="text-gray-500 mb-6">
            Select a rule to test its functionality with sample data.
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
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Testing Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Testing Environment</h2>
            <p className="text-gray-600">Rule ID: {ruleId}</p>
          </div>
          <button
            onClick={() => setShowTestDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Run New Test
          </button>
        </div>

        {/* Quick Test Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">🎯 Normal Scenario</h3>
            <p className="text-sm text-gray-600 mb-3">
              Test with typical data that should pass validation
            </p>
            <button
              onClick={() => {
                setScenario('normal');
                handleGenerateTestData();
                setShowTestDialog(true);
              }}
              disabled={generateTestData.isPending}
              className="w-full bg-green-100 text-green-800 px-3 py-2 rounded text-sm hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {generateTestData.isPending ? 'Generating...' : 'Quick Test'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">⚠️ Edge Cases</h3>
            <p className="text-sm text-gray-600 mb-3">
              Test with boundary conditions and edge cases
            </p>
            <button
              onClick={() => {
                setScenario('edge-case');
                handleGenerateTestData();
                setShowTestDialog(true);
              }}
              disabled={generateTestData.isPending}
              className="w-full bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm hover:bg-yellow-200 transition-colors disabled:opacity-50"
            >
              {generateTestData.isPending ? 'Generating...' : 'Test Edge Cases'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">❌ Failure Cases</h3>
            <p className="text-sm text-gray-600 mb-3">
              Test with data that should fail validation
            </p>
            <button
              onClick={() => {
                setScenario('failure');
                handleGenerateTestData();
                setShowTestDialog(true);
              }}
              disabled={generateTestData.isPending}
              className="w-full bg-red-100 text-red-800 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {generateTestData.isPending ? 'Generating...' : 'Test Failures'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Results Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Results Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {testHistory.length}
            </div>
            <div className="text-sm text-gray-500">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {testHistory.filter(t => t.result.passed).length}
            </div>
            <div className="text-sm text-gray-500">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {testHistory.filter(t => !t.result.passed).length}
            </div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {testHistory.length > 0 
                ? Math.round((testHistory.filter(t => t.result.passed).length / testHistory.length) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Test History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Test History</h3>
          <p className="text-sm text-gray-500 mt-1">
            {testHistory.length} tests executed
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {testHistory.map((test) => {
            const badge = getTestResultBadge(test);
            
            return (
              <div
                key={test.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedTest(test)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                      
                      {test.result.score && (
                        <span className={`text-sm font-medium ${getScoreColor(test.result.score)}`}>
                          Score: {test.result.score}%
                        </span>
                      )}
                      
                      <span className="text-sm text-gray-500">
                        {formatDate(test.created_at)}
                      </span>
                      
                      {test.result.execution_time && (
                        <span className="text-sm text-gray-500">
                          {test.result.execution_time}ms
                        </span>
                      )}
                    </div>
                    
                    {test.result.details && (
                      <p className="text-sm text-gray-600 mb-2">
                        {test.result.details}
                      </p>
                    )}
                    
                    <details className="text-xs">
                      <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                        View test data
                      </summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(test.test_data, null, 2)}
                      </pre>
                    </details>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {testHistory.length === 0 && !isLoading && (
          <div className="p-6 text-center text-gray-500">
            <span className="text-4xl block mb-2">🧪</span>
            No tests have been run for this rule yet.
          </div>
        )}
      </div>

      {/* Test Dialog */}
      {showTestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Run Test
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="manual">Manual Test</option>
                  <option value="automated">Automated Test</option>
                  <option value="performance">Performance Test</option>
                  <option value="security">Security Test</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Test Data (JSON)
                  </label>
                  <button
                    onClick={handleGenerateTestData}
                    disabled={generateTestData.isPending}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                  >
                    {generateTestData.isPending ? 'Generating...' : 'Generate Sample Data'}
                  </button>
                </div>
                <textarea
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  placeholder="Enter test data in JSON format..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  rows={12}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTestDialog(false);
                  setTestData('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRunTest}
                disabled={testRule.isPending || !testData.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testRule.isPending ? 'Running Test...' : 'Run Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Details Dialog */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Test Details
              </h3>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    getTestResultBadge(selectedTest).color
                  }`}>
                    {getTestResultBadge(selectedTest).text}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Executed</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedTest.created_at)}</p>
                </div>
                {selectedTest.result.score && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Score</label>
                    <p className={`text-sm font-medium ${getScoreColor(selectedTest.result.score)}`}>
                      {selectedTest.result.score}%
                    </p>
                  </div>
                )}
                {selectedTest.result.execution_time && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Execution Time</label>
                    <p className="text-sm text-gray-900">{selectedTest.result.execution_time}ms</p>
                  </div>
                )}
              </div>

              {selectedTest.result.details && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedTest.result.details}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Data</label>
                <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(selectedTest.test_data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 