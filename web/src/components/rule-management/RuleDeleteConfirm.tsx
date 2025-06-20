import React from 'react';

export interface RuleDeleteConfirmProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

/**
 * RuleDeleteConfirm displays a confirmation modal for rule deletion.
 * @param open Whether the modal is open
 * @param onConfirm Confirm callback
 * @param onCancel Cancel callback
 * @param message Confirmation message
 */
export const RuleDeleteConfirm: React.FC<RuleDeleteConfirmProps> = ({
  open,
  onConfirm,
  onCancel,
  message = 'Are you sure you want to delete this rule?',
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-base-100 p-6 rounded shadow-xl max-w-sm w-full">
        <div className="mb-4 text-base-content">{message}</div>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleDeleteConfirm;
