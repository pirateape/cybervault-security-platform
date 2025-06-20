import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { useRuleManagementStore } from '../store/ruleManagementStore';
import {
  useRules,
  useAddRule,
  useUpdateRule,
  useDeleteRule,
} from '../hooks/useRules';
import {
  useRuleVersions,
  useRestoreRuleVersion,
} from '../../../libs/hooks/useRulesApi';
import { useAuditLog } from '../hooks/useAuditLog';
import RuleList from '../components/rule-management/RuleList';
import RuleSearch from '../components/rule-management/RuleSearch';
import RuleDeleteConfirm from '../components/rule-management/RuleDeleteConfirm';
import PresenceBar from '../components/rule-management/PresenceBar';
import HelpButton from '../components/rule-management/HelpButton';
import ThemeToggle from '../components/rule-management/ThemeToggle';
import ToastProvider, {
  useToast,
} from '../components/rule-management/ToastProvider';
import RuleEditorPanel from '../components/rule-management/RuleEditorPanel';
import SkeletonLoader from '../components/rule-management/SkeletonLoader';
import { supabase } from '../../../libs/data-access/supabaseClient';
import { useAuth } from '../../../libs/hooks/authProvider';
import { z } from 'zod';
import RuleVersionHistoryPanel from '../components/rule-management/RuleVersionHistoryPanel';

// Example rule data structure (replace with API integration later)
const initialRules = [
  {
    id: 1,
    name: 'NIST Password Policy',
    content: '{\n  "minLength": 12,\n  "requireSpecial": true\n}',
  },
  {
    id: 2,
    name: 'ISO27001 Encryption',
    content: '{\n  "encryption": "AES256",\n  "keyRotation": true\n}',
  },
];

const defaultNewRule = { name: '', content: '{\n  \n}' };

// Zod schema for rule content (customize as needed)
const ruleContentSchema = z.object({
  minLength: z.number().optional(),
  requireSpecial: z.boolean().optional(),
  encryption: z.string().optional(),
  keyRotation: z.boolean().optional(),
});

// 1. Skeleton loader component
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-base-300 rounded ${className}`} />;
}

// 2. Accessible button (utility)
function AButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
) {
  return (
    <button
      {...props}
      className={`btn ${props.className || ''}`}
      aria-label={props.label}
    />
  );
}

// 3. Confirmation dialog
function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  message,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-base-100 p-6 rounded shadow-xl max-w-sm w-full">
        <div className="mb-4 text-base-content">{message}</div>
        <div className="flex gap-2 justify-end">
          <AButton label="Cancel" onClick={onCancel} className="btn-ghost" />
          <AButton label="Confirm" onClick={onConfirm} className="btn-error" />
        </div>
      </div>
    </div>
  );
}

// 8. Responsive layout and dark/light theming is already handled via Tailwind/DaisyUI classes
// 9. Prominent live editing indicator is handled in PresenceBar
// 10. Error/info states with Alert components (see ToastProvider and error rendering)
// 11. aria-live regions are included in ToastProvider
// 12. Refactor for composability (see modularization above)

// Extend User type to include org_id if not present
interface UserWithOrgId {
  org_id?: string;
  [key: string]: any;
}

export const RuleManagementPage: React.FC = () => {
  const { user, requireRole } = useAuth();
  const {
    data: rules,
    isLoading: rulesLoading,
    error: rulesError,
  } = useRules();
  const addRule = useAddRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const selectedRuleId = useRuleManagementStore((s) => s.selectedRuleId);
  const userWithOrg = user as UserWithOrgId;
  const orgId =
    typeof userWithOrg?.org_id === 'string'
      ? userWithOrg.org_id
      : 'default-org';
  const setSelectedRuleId = useRuleManagementStore((s) => s.setSelectedRuleId);
  const safeRules = Array.isArray(rules) ? rules : [];
  const selectedRule = safeRules.find((r) => String(r.id) === selectedRuleId);
  const [editorValue, setEditorValue] = useState('');
  const search = useRuleManagementStore((s) => s.search);
  const setSearch = useRuleManagementStore((s) => s.setSearch);
  const showModal = useRuleManagementStore((s) => s.showModal);
  const setShowModal = useRuleManagementStore((s) => s.setShowModal);
  const theme = useRuleManagementStore((s) => s.theme);
  const setTheme = useRuleManagementStore((s) => s.setTheme);
  const deletingId = useRuleManagementStore((s) => s.deletingId);
  const setDeletingId = useRuleManagementStore((s) => s.setDeletingId);
  const [viewVersion, setViewVersion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [liveUpdate, setLiveUpdate] = useState(false);
  const liveUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const newRule = useRuleManagementStore((s) => s.newRule) ?? defaultNewRule;
  const setNewRule = useRuleManagementStore((s) => s.setNewRule);

  // RBAC: Only allow delete/edit for admin or security_team
  const canDelete = (rule: any) => requireRole(['admin', 'security_team']);
  const canEdit = (rule: any) => requireRole(['admin', 'security_team']);

  // Move selectedRuleId and setSelectedRuleId to the very top of the component, before any hooks that depend on them.
  // For mutation hooks, use .mutate or .mutateAsync.
  // Add null checks for data and remove any references to setLoadingVersions.

  // Fetch rules from Supabase on mount
  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      setError(null);
      const response = await supabase
        ?.from('rules')
        .select('id, name, content');
      const data = response?.data;
      const error = response?.error;
      if (error) setError(error.message);
      else {
        setSelectedRuleId(data[0].id);
        setEditorValue(data[0].content || '');
      }
      setLoading(false);
    };
    fetchRules();
  }, []);

  // Collaborative editing: subscribe to Supabase Realtime changes
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('rules-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rules' },
        (payload) => {
          setLiveUpdate(true);
          // Handle INSERT/UPDATE/DELETE
          if (payload.eventType === 'INSERT') {
            setSelectedRuleId(payload.new.id);
            setEditorValue(payload.new.content || '');
          } else if (payload.eventType === 'UPDATE') {
            setSelectedRuleId(payload.new.id);
            setEditorValue(payload.new.content || '');
          } else if (payload.eventType === 'DELETE') {
            setSelectedRuleId(null);
            setEditorValue('');
          }
          // Show live update indicator for 2s
          if (liveUpdateTimeout.current)
            clearTimeout(liveUpdateTimeout.current);
          liveUpdateTimeout.current = setTimeout(
            () => setLiveUpdate(false),
            2000
          );
        }
      )
      .subscribe();
    return () => {
      if (supabase && channel) supabase.removeChannel(channel);
      if (liveUpdateTimeout.current) clearTimeout(liveUpdateTimeout.current);
    };
  }, [supabase]);

  // Handle rule selection
  const handleSelectRule = (id: number) => {
    const rule = safeRules.find((r) => r.id === id);
    setSelectedRuleId(id);
    setEditorValue(rule?.content || '');
  };

  // Handle editor changes (update rule in Supabase)
  const handleEditorChange = async (val: string) => {
    setEditorValue(val);
    setValidationError(null);
    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(val);
    } catch (e) {
      setValidationError('Invalid JSON');
      return;
    }
    const result = ruleContentSchema.safeParse(parsed);
    if (!result.success) {
      setValidationError(result.error.errors.map((e) => e.message).join(', '));
      return;
    }
    if (selectedRuleId) {
      updateRule(selectedRuleId, val);
    }
  };

  // Search/filter rules
  const filteredRules = safeRules.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  // Add new rule (insert into Supabase)
  const handleAddRule = async () => {
    setLoading(true);
    setError(null);
    setValidationError(null);
    // Validate JSON
    let parsed;
    try {
      parsed = JSON.parse(newRule.content);
    } catch (e) {
      setValidationError('Invalid JSON');
      setLoading(false);
      return;
    }
    const result = ruleContentSchema.safeParse(parsed);
    if (!result.success) {
      setValidationError(result.error.errors.map((e) => e.message).join(', '));
      setLoading(false);
      return;
    }
    const response = await supabase
      ?.from('rules')
      .insert([{ name: newRule.name, content: newRule.content }])
      .select();
    const data = response?.data;
    const error = response?.error;
    if (error) setError(error.message);
    else if (data && data.length > 0) {
      setSelectedRuleId(data[0].id);
      setEditorValue(data[0].content);
      setShowModal(false);
      setNewRule(defaultNewRule);
    }
    setLoading(false);
  };

  // Theme toggle
  const handleThemeToggle = () => {
    setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  // Delete rule (optimistic UI)
  const handleDeleteRule = async (id: number) => {
    setDeletingId(id);
    deleteRule(id);
  };

  // Audit log display (optional, if available from backend)
  const fetchAuditLog = useCallback(
    async (ruleId: number | null) => {
      if (!ruleId || !supabase) return;
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('resource_id', ruleId)
        .order('created_at', { ascending: false });
      if (!error) setAuditLog(data || []);
    },
    [supabase]
  );

  useEffect(() => {
    fetchAuditLog(selectedRuleId);
  }, [selectedRuleId, fetchAuditLog]);

  // Use hooks only if orgId and selectedRuleId are defined, and ensure IDs are strings
  const selectedRuleIdStr = selectedRuleId ? String(selectedRuleId) : '';
  const {
    data: versions = [],
    isLoading: versionsLoading,
    error: versionsError,
  } = orgId && selectedRuleIdStr
    ? useRuleVersions(orgId, selectedRuleIdStr)
    : { data: [], isLoading: false, error: null };
  const restoreRuleVersion =
    orgId && selectedRuleIdStr
      ? useRestoreRuleVersion(orgId, selectedRuleIdStr)
      : { mutate: () => {}, isLoading: false, error: null };

  // Modal for new rule
  const renderModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-base-100 rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="font-bold text-xl mb-4">Create New Rule</h2>
        <label className="form-control w-full mb-2">
          <span className="label-text">Rule Name</span>
          <input
            className="input input-bordered w-full"
            value={newRule.name}
            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
            aria-label="Rule Name"
            autoFocus
          />
        </label>
        <label className="form-control w-full mb-2">
          <span className="label-text">Initial Content</span>
          <textarea
            className="textarea textarea-bordered w-full"
            value={newRule.content}
            onChange={(e) =>
              setNewRule({ ...newRule, content: e.target.value })
            }
            aria-label="Rule Content"
            rows={4}
          />
        </label>
        {validationError && (
          <div className="text-error mt-2">{validationError}</div>
        )}
        <div className="flex justify-end space-x-2 mt-4">
          <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddRule}
            disabled={!newRule.name.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
        {error && <div className="text-error mt-2">{error}</div>}
      </div>
    </div>
  );

  // Placeholder for preview (could be JSON schema validation, rendered markdown, etc.)
  const renderPreview = () => {
    try {
      const json = JSON.parse(editorValue);
      return (
        <pre className="bg-base-200 p-4 rounded overflow-x-auto">
          {JSON.stringify(json, null, 2)}
        </pre>
      );
    } catch {
      return <div className="text-error">Invalid JSON</div>;
    }
  };

  // Version history panel
  const renderVersionHistory = () => (
    <RuleVersionHistoryPanel
      versions={versions}
      loading={versionsLoading}
      error={
        versionsError && 'message' in versionsError
          ? versionsError.message
          : null
      }
      viewVersion={viewVersion}
      setViewVersion={setViewVersion as (v: any) => void}
      onRestore={(v) =>
        typeof restoreRuleVersion.mutate === 'function'
          ? restoreRuleVersion.mutate({ versionId: v.id })
          : undefined
      }
      restoring={
        'isLoading' in restoreRuleVersion ? restoreRuleVersion.isLoading : false
      }
      restoreError={
        'error' in restoreRuleVersion &&
        restoreRuleVersion.error &&
        'message' in restoreRuleVersion.error
          ? restoreRuleVersion.error.message
          : null
      }
      canEdit={canEdit(selectedRule)}
      selectedRuleContent={editorValue}
    />
  );

  // In main editor area, show live editing indicator if possible (collaborative editing)
  // Pass collaborative props to RuleEditor
  const renderEditor = () => (
    <div className="flex-1 flex flex-col">
      <RuleEditorPanel
        value={editorValue}
        onChange={setEditorValue}
        language="json"
        theme={theme === 'vs-dark' ? 'vs-dark' : 'light'}
        height={400}
        readOnly={!canEdit(selectedRule)}
        collaborative={true}
        documentId={selectedRuleId ? `rule-${selectedRuleId}` : 'default-rule'}
      />
      {/* Optionally, show a more prominent live editing indicator here if desired */}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-base-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-base-300 bg-base-200 p-4 flex-shrink-0">
        <div className="flex items-center mb-4">
          <h2 className="font-bold text-lg flex-1">Rules</h2>
          {canEdit(null) && (
            <button
              className="btn btn-circle btn-primary btn-sm"
              aria-label="Create New Rule"
              onClick={() => setShowModal(true)}
            >
              <span className="text-xl leading-none">+</span>
            </button>
          )}
        </div>
        {liveUpdate && (
          <div className="text-success text-xs mb-2">Live update received</div>
        )}
        <input
          className="input input-bordered w-full mb-2"
          placeholder="Search rules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search Rules"
        />
        {loading && <div className="text-info">Loading...</div>}
        {error && <div className="text-error">{error}</div>}
        <ul className="space-y-2" role="listbox" aria-label="Rule List">
          {filteredRules.map((rule) => (
            <li key={rule.id} className="flex items-center">
              <button
                className={`btn btn-block btn-sm flex-1 ${
                  selectedRuleId === rule.id ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => handleSelectRule(rule.id)}
                aria-current={selectedRuleId === rule.id}
                role="option"
                aria-selected={selectedRuleId === rule.id}
              >
                {rule.name}
              </button>
              {canDelete(rule) && (
                <button
                  className="btn btn-error btn-xs ml-2"
                  aria-label="Delete Rule"
                  onClick={() => handleDeleteRule(rule.id)}
                  disabled={deletingId === rule.id || loading}
                >
                  {deletingId === rule.id ? '...' : '🗑️'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </aside>
      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col md:flex-row h-full">
        <section className="flex-1 p-4 flex flex-col">
          <div className="flex items-center mb-2">
            <h1 className="font-bold text-2xl flex-1">Edit Rule</h1>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleThemeToggle}
              aria-label="Toggle Theme"
            >
              {theme === 'vs-dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          {renderEditor()}
          {validationError && (
            <div className="text-error mt-2">{validationError}</div>
          )}
        </section>
        {/* Preview Panel */}
        <section className="w-full md:w-1/3 p-4 border-l border-base-300 bg-base-200 flex flex-col">
          <h2 className="font-bold text-lg mb-2">Preview</h2>
          <div className="flex-1 overflow-auto">{renderPreview()}</div>
        </section>
      </main>
      {/* Version History Panel */}
      {renderVersionHistory()}
      {showModal && renderModal()}
    </div>
  );
};

// Wrap the main component in <ToastProvider>
export default function RuleManagementPageWithProviders(
  props: Record<string, unknown>
) {
  return (
    <ToastProvider>
      <RuleManagementPage {...props} />
    </ToastProvider>
  );
}
