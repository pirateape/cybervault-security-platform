'use client';

import React, { useState, useEffect } from 'react';
import {
  useCompareRuleVersions,
  useRestoreRuleToVersion,
  type RuleVersion
} from '@/libs/data-access/enhancedRulesApi';

interface RuleVersionControlProps {
  ruleId: string;
  orgId: string;
  versionHistory?: RuleVersion[];
  isLoading: boolean;
  onRuleSelect: (ruleId: string) => void;
}

export function RuleVersionControl({
  ruleId,
  orgId,
  versionHistory = [],
  isLoading,
  onRuleSelect
}: RuleVersionControlProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState<string | null>(null);
  const [changeSummary, setChangeSummary] = useState('');

  const compareVersions = useCompareRuleVersions(orgId, ruleId);
  const restoreVersion = useRestoreRuleToVersion(orgId, ruleId);

  const handleVersionSelect = (versionId: string) => {
    if (compareMode) {
      setSelectedVersions(prev => {
        if (prev.includes(versionId)) {
          return prev.filter(id => id !== versionId);
        } else if (prev.length < 2) {
          return [...prev, versionId];
        } else {
          return [prev[1], versionId]; // Replace first with new selection
        }
      });
    }
  };

  const handleCompareVersions = async () => {
    if (selectedVersions.length === 2) {
      try {
        await compareVersions.mutateAsync({
          fromVersionId: selectedVersions[0],
          toVersionId: selectedVersions[1]
        });
      } catch (error) {
        console.error('Failed to compare versions:', error);
      }
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await restoreVersion.mutateAsync({
        versionId,
        changeSummary: changeSummary || `Restored to version ${versionId}`
      });
      setShowRestoreDialog(null);
      setChangeSummary('');
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getVersionBadge = (version: RuleVersion, index: number) => {
    if (index === 0) return { text: 'Current', color: 'bg-green-100 text-green-800' };
    if (version.metadata?.isStable) return { text: 'Stable', color: 'bg-blue-100 text-blue-800' };
    return { text: `v${version.version}`, color: 'bg-gray-100 text-gray-800' };
  };

  if (!ruleId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🔄</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Version Control</h3>
          <p className="text-gray-500 mb-6">
            Select a rule to view its version history and manage versions.
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
            {[...Array(5)].map((_, i) => (
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
            <h2 className="text-xl font-semibold text-gray-900">Version Control</h2>
            <p className="text-gray-600">Rule ID: {ruleId}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedVersions([]);
              }}
              className={`px-4 py-2 rounded-lg transition-colors ${
                compareMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {compareMode ? 'Exit Compare' : 'Compare Versions'}
            </button>
            
            {compareMode && selectedVersions.length === 2 && (
              <button
                onClick={handleCompareVersions}
                disabled={compareVersions.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {compareVersions.isPending ? 'Comparing...' : 'Compare Selected'}
              </button>
            )}
          </div>
        </div>

        {compareMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Compare Mode:</strong> Select up to 2 versions to compare.
              {selectedVersions.length > 0 && (
                <span className="ml-2">
                  Selected: {selectedVersions.length}/2
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Version History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Version History</h3>
          <p className="text-sm text-gray-500 mt-1">
            {versionHistory.length} versions found
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {versionHistory.map((version, index) => {
            const badge = getVersionBadge(version, index);
            const isSelected = selectedVersions.includes(version.id);
            
            return (
              <div
                key={version.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                } ${compareMode ? 'cursor-pointer' : ''}`}
                onClick={() => compareMode && handleVersionSelect(version.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                      
                      {compareMode && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleVersionSelect(version.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </div>
                      )}
                      
                      <span className="text-sm text-gray-500">
                        {formatDate(version.created_at)}
                      </span>
                      
                      {version.created_by && (
                        <span className="text-sm text-gray-500">
                          by {version.created_by}
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        Version {version.version}
                      </p>
                      {version.change_summary && (
                        <p className="text-sm text-gray-600 mt-1">
                          {version.change_summary}
                        </p>
                      )}
                    </div>

                    {/* Version Metadata */}
                    {version.metadata && Object.keys(version.metadata).length > 0 && (
                      <div className="mt-2">
                        <details className="text-xs">
                          <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                            View metadata
                          </summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(version.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!compareMode && index > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowRestoreDialog(version.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Restore
                      </button>
                      <button className="text-gray-400 hover:text-gray-600 text-sm">
                        View Diff
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {versionHistory.length === 0 && !isLoading && (
          <div className="p-6 text-center text-gray-500">
            <span className="text-4xl block mb-2">📝</span>
            No version history found for this rule.
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Restore Version
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to restore to this version? This will create a new version
              with the restored content.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Summary (Optional)
              </label>
              <textarea
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Describe why you're restoring this version..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRestoreDialog(null);
                  setChangeSummary('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestoreVersion(showRestoreDialog)}
                disabled={restoreVersion.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {restoreVersion.isPending ? 'Restoring...' : 'Restore Version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {compareVersions.data && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Version Comparison</h3>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(compareVersions.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 