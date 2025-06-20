import React from 'react';

export interface RuleListProps {
  rules: Array<{ id: number; name: string }>;
  selectedRuleId: number | null;
  onSelect: (id: number) => void;
  onDelete?: (id: number) => void;
  canDelete?: (rule: { id: number; name: string }) => boolean;
  loading?: boolean;
  deletingId?: number | null;
}

/**
 * RuleList displays a list of rules with selection and delete options.
 * @param rules List of rule objects
 * @param selectedRuleId Currently selected rule id
 * @param onSelect Callback for selecting a rule
 * @param onDelete Callback for deleting a rule
 * @param canDelete Function to determine if a rule can be deleted
 * @param loading Loading state
 * @param deletingId Id of rule being deleted
 */
export const RuleList: React.FC<RuleListProps> = ({
  rules,
  selectedRuleId,
  onSelect,
  onDelete,
  canDelete = () => false,
  loading = false,
  deletingId = null,
}) => (
  <ul className="space-y-2" role="listbox" aria-label="Rule List">
    {rules.map((rule) => (
      <li key={rule.id} className="flex items-center">
        <button
          className={`btn btn-block btn-sm flex-1 ${
            selectedRuleId === rule.id ? 'btn-primary' : 'btn-ghost'
          }`}
          onClick={() => onSelect(rule.id)}
          aria-current={selectedRuleId === rule.id}
          role="option"
          aria-selected={selectedRuleId === rule.id}
          tabIndex={0}
        >
          {rule.name}
        </button>
        {canDelete(rule) && onDelete && (
          <button
            className="btn btn-error btn-xs ml-2"
            aria-label="Delete Rule"
            onClick={() => onDelete(rule.id)}
            disabled={deletingId === rule.id || loading}
            aria-disabled={deletingId === rule.id || loading}
          >
            {deletingId === rule.id ? '...' : '🗑️'}
          </button>
        )}
      </li>
    ))}
    {loading && <li className="text-info">Loading...</li>}
    {rules.length === 0 && !loading && (
      <li className="text-base-content/60">No rules found.</li>
    )}
  </ul>
);

export default RuleList;
