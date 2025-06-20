import React from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';

/**
 * RuleVersionHistoryPanel displays version history for a rule, with view, compare, and restore actions.
 * @param versions Array of rule versions
 * @param loading Loading state
 * @param error Error message
 * @param viewVersion Currently viewed version
 * @param setViewVersion Setter for viewed version
 * @param onRestore Restore handler
 * @param restoring Restore loading state
 * @param restoreError Restore error message
 * @param canEdit Whether the user can restore versions
 * @param selectedRuleContent Current rule content for diff view
 */
export interface RuleVersion {
  id: number;
  rule_id: number;
  version: number;
  content: any;
  created_at: string;
  created_by?: string;
}

interface RuleVersionHistoryPanelProps {
  versions: RuleVersion[];
  loading?: boolean;
  error?: string | null;
  viewVersion: RuleVersion | null;
  setViewVersion: (v: RuleVersion | null) => void;
  onRestore: (v: RuleVersion) => void;
  restoring?: boolean;
  restoreError?: string | null;
  canEdit?: boolean;
  selectedRuleContent: string;
}

export const RuleVersionHistoryPanel: React.FC<
  RuleVersionHistoryPanelProps
> = ({
  versions,
  loading,
  error,
  viewVersion,
  setViewVersion,
  onRestore,
  restoring,
  restoreError,
  canEdit,
  selectedRuleContent,
}) => {
  return (
    <section
      className="w-full md:w-64 border-l border-base-300 bg-base-200 p-4 flex-shrink-0"
      aria-label="Version History"
      tabIndex={0}
    >
      <h2 className="font-bold text-lg mb-4">Version History</h2>
      {loading && <div className="text-info">Loading...</div>}
      {error && <div className="text-error">{error}</div>}
      {versions.length === 0 && !loading && (
        <div className="text-base-content/60">No versions found.</div>
      )}
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id}>
            <button
              className="btn btn-block btn-xs text-left"
              onClick={() => setViewVersion(v)}
              aria-label={`View version ${v.version}`}
            >
              v{v.version} — {new Date(v.created_at).toLocaleString()}
              {v.created_by && (
                <span className="ml-2 text-xs text-base-content/60">
                  by {v.created_by}
                </span>
              )}
            </button>
            {canEdit && (
              <button
                className="btn btn-xs btn-outline ml-2"
                onClick={() => onRestore(v)}
                disabled={restoring}
                aria-label={`Restore version ${v.version}`}
              >
                {restoring ? 'Restoring...' : 'Restore'}
              </button>
            )}
          </li>
        ))}
      </ul>
      {restoreError && <div className="text-error mt-2">{restoreError}</div>}
      {viewVersion && (
        <div className="mt-4 p-2 bg-base-300 rounded">
          <div className="font-bold mb-2">Version {viewVersion.version}</div>
          <DiffEditor
            height="200px"
            language="json"
            theme="vs-dark"
            original={JSON.stringify(viewVersion.content, null, 2)}
            modified={selectedRuleContent}
            options={{
              readOnly: true,
              renderSideBySide: true,
              minimap: { enabled: false },
            }}
          />
          <button
            className="btn btn-xs btn-ghost mt-2"
            onClick={() => setViewVersion(null)}
            aria-label="Close version diff"
          >
            Close
          </button>
        </div>
      )}
    </section>
  );
};

export default RuleVersionHistoryPanel;
