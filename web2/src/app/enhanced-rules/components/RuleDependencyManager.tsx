'use client';

import React, { useState } from 'react';
import {
  useAddRuleDependency,
  useRemoveRuleDependency,
  useDetectRuleConflicts,
  type RuleDependency
} from '@/libs/data-access/enhancedRulesApi';

interface RuleDependencyManagerProps {
  ruleId: string;
  orgId: string;
  dependencies?: RuleDependency[];
  isLoading: boolean;
  onRuleSelect: (ruleId: string) => void;
}

export function RuleDependencyManager({
  ruleId,
  orgId,
  dependencies = [],
  isLoading,
  onRuleSelect
}: RuleDependencyManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDependency, setNewDependency] = useState({
    dependsOn: '',
    type: 'requires',
    description: ''
  });
  const [selectedDependency, setSelectedDependency] = useState<RuleDependency | null>(null);
  const [showConflictAnalysis, setShowConflictAnalysis] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  const addDependency = useAddRuleDependency(orgId, ruleId);
  const removeDependency = useRemoveRuleDependency(orgId, ruleId);
  const detectConflicts = useDetectRuleConflicts(orgId, ruleId);

  const handleAddDependency = async () => {
    if (!newDependency.dependsOn.trim()) {
      alert('Please specify the rule this depends on');
      return;
    }

    try {
      await addDependency.mutateAsync(newDependency);
      setNewDependency({ dependsOn: '', type: 'requires', description: '' });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to add dependency:', error);
      alert('Failed to add dependency. Please try again.');
    }
  };

  const handleRemoveDependency = async (dependency: RuleDependency) => {
    if (confirm(`Are you sure you want to remove the dependency on "${dependency.depends_on}"?`)) {
      try {
        await removeDependency.mutateAsync({ dependencyId: dependency.id });
      } catch (error) {
        console.error('Failed to remove dependency:', error);
        alert('Failed to remove dependency. Please try again.');
      }
    }
  };

  const handleDetectConflicts = async () => {
    try {
      const result = await detectConflicts.mutateAsync({});
      setConflicts(result as any[]);
      setShowConflictAnalysis(true);
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      alert('Failed to detect conflicts. Please try again.');
    }
  };

  const getDependencyTypeColor = (type: string) => {
    switch (type) {
      case 'requires':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocks':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'suggests':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'conflicts':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!ruleId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🔗</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dependency Manager</h3>
          <p className="text-gray-500 mb-6">
            Select a rule to manage its dependencies and relationships.
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
            <h2 className="text-xl font-semibold text-gray-900">Dependency Manager</h2>
            <p className="text-gray-600">Rule ID: {ruleId}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleDetectConflicts}
              disabled={detectConflicts.isPending}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {detectConflicts.isPending ? 'Analyzing...' : 'Detect Conflicts'}
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Dependency
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {dependencies.length}
            </div>
            <div className="text-sm text-gray-500">Total Dependencies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {dependencies.filter(d => d.type === 'requires').length}
            </div>
            <div className="text-sm text-gray-500">Required</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {dependencies.filter(d => d.type === 'blocks').length}
            </div>
            <div className="text-sm text-gray-500">Blocking</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {dependencies.filter(d => d.type === 'suggests').length}
            </div>
            <div className="text-sm text-gray-500">Suggested</div>
          </div>
        </div>
      </div>

      {/* Dependencies List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Rule Dependencies</h3>
          <p className="text-sm text-gray-500 mt-1">
            {dependencies.length} dependencies configured
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {dependencies.map((dependency) => (
            <div key={dependency.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      getDependencyTypeColor(dependency.type)
                    }`}>
                      {dependency.type}
                    </span>
                    
                    <button
                      onClick={() => onRuleSelect(dependency.depends_on)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {dependency.depends_on}
                    </button>
                    
                    <span className="text-sm text-gray-500">
                      {formatDate(dependency.created_at)}
                    </span>
                  </div>
                  
                  {dependency.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {dependency.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Status: {dependency.status || 'active'}</span>
                    {dependency.version && <span>Version: {dependency.version}</span>}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedDependency(dependency)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRemoveDependency(dependency)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {dependencies.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <span className="text-4xl block mb-2">🔗</span>
            No dependencies configured for this rule.
          </div>
        )}
      </div>

      {/* Dependency Graph Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dependency Graph</h3>
        
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <span className="text-6xl mb-4 block">📊</span>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Visual Dependency Graph</h4>
          <p className="text-gray-600 mb-4">
            Interactive dependency graph visualization would be rendered here using a library like D3.js or React Flow.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• Shows rule relationships and dependencies</p>
            <p>• Highlights potential conflicts and circular dependencies</p>
            <p>• Interactive nodes for navigation</p>
          </div>
        </div>
      </div>

      {/* Add Dependency Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Dependency
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depends On Rule ID
                </label>
                <input
                  type="text"
                  value={newDependency.dependsOn}
                  onChange={(e) => setNewDependency(prev => ({ ...prev, dependsOn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter rule ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dependency Type
                </label>
                <select
                  value={newDependency.type}
                  onChange={(e) => setNewDependency(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="requires">Requires - Must be executed before</option>
                  <option value="blocks">Blocks - Cannot run simultaneously</option>
                  <option value="suggests">Suggests - Recommended to run together</option>
                  <option value="conflicts">Conflicts - Should not be used together</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newDependency.description}
                  onChange={(e) => setNewDependency(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the relationship..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewDependency({ dependsOn: '', type: 'requires', description: '' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDependency}
                disabled={addDependency.isPending || !newDependency.dependsOn.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {addDependency.isPending ? 'Adding...' : 'Add Dependency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dependency Details Dialog */}
      {selectedDependency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Dependency Details
              </h3>
              <button
                onClick={() => setSelectedDependency(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${
                    getDependencyTypeColor(selectedDependency.type)
                  }`}>
                    {selectedDependency.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedDependency.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Depends On</label>
                  <button
                    onClick={() => onRuleSelect(selectedDependency.depends_on)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedDependency.depends_on}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="text-sm text-gray-900">{selectedDependency.status || 'active'}</p>
                </div>
              </div>

              {selectedDependency.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedDependency.description}
                  </p>
                </div>
              )}

              {selectedDependency.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                  <pre className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto max-h-32">
                    {JSON.stringify(selectedDependency.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conflict Analysis Dialog */}
      {showConflictAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Conflict Analysis Results
              </h3>
              <button
                onClick={() => setShowConflictAnalysis(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {conflicts.length > 0 ? (
                <div className="space-y-3">
                  {conflicts.map((conflict, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-red-500 mt-0.5">⚠️</span>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-800">
                            {conflict.type || 'Dependency Conflict'}
                          </h4>
                          <p className="text-sm text-red-700 mt-1">
                            {conflict.description || 'Conflict detected in rule dependencies'}
                          </p>
                          {conflict.affectedRules && (
                            <div className="mt-2">
                              <span className="text-xs text-red-600">Affected Rules: </span>
                              <span className="text-xs text-red-700">
                                {conflict.affectedRules.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-2">✅</span>
                  <h4 className="text-lg font-medium text-green-800 mb-2">No Conflicts Detected</h4>
                  <p className="text-green-700">
                    All rule dependencies are compatible and no conflicts were found.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 