import * as React from 'react';
import { Card, Button, IconButton } from '../../primitives';
import {
  FiPlus,
  FiBarChart2,
  FiActivity,
  FiCheckCircle,
  FiShield,
  FiList,
  FiDownload,
  FiFileText,
} from 'react-icons/fi';
import { useHasPermission } from '../../../hooks/authProvider';

interface WidgetLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: string) => void;
}

const widgetTypes = [
  {
    type: 'kpi',
    name: 'KPI Widget',
    icon: <FiActivity className="w-6 h-6 text-blue-500" />,
    description:
      'Key Performance Indicator (KPI) for compliance score or metrics.',
    preview: (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow text-center">
        92%
      </div>
    ),
  },
  {
    type: 'chart',
    name: 'Chart Widget',
    icon: <FiBarChart2 className="w-6 h-6 text-green-500" />,
    description: 'Line or pie chart for compliance trends or breakdowns.',
    preview: (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow text-center">
        📈
      </div>
    ),
  },
  {
    type: 'remediation_progress',
    name: 'Remediation Progress',
    icon: <FiCheckCircle className="w-6 h-6 text-purple-500" />,
    description: 'Animated progress bar for remediation status.',
    preview: (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow text-center">
        72% Complete
      </div>
    ),
  },
  {
    type: 'compliance_status',
    name: 'Compliance Status',
    icon: <FiShield className="w-6 h-6 text-blue-600" />,
    description: 'Visualize the latest compliance score, status, and trend.',
    preview: (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow text-center">
        92% Good
      </div>
    ),
  },
  {
    type: 'audit_log',
    name: 'Audit Log',
    icon: <FiList className="w-6 h-6 text-orange-600" />,
    description:
      'View a detailed, filterable, and secure audit log of all user actions.',
    preview: (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-xs">
        User login
        <br />
        Scan triggered
        <br />
        Rule updated
      </div>
    ),
  },
  // New widgets below
  {
    type: 'scorecard',
    name: 'Scorecard Widget',
    icon: <FiShield className="w-6 h-6 text-green-600" />,
    description:
      'Visualize compliance scores, risk levels, and key metrics in a beautiful, animated card.',
    preview: (
      <div className="bg-green-100 rounded-lg p-4 shadow text-center text-green-700 font-bold">
        98%
        <br />
        LOW RISK
      </div>
    ),
  },
  {
    type: 'export',
    name: 'Export Widget',
    icon: <FiDownload className="w-6 h-6 text-blue-700" />,
    description:
      'Export dashboard or report data as PDF, CSV, or Excel. Shows export status and download links.',
    preview: (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-blue-700">
        PDF | CSV | Excel
      </div>
    ),
  },
  {
    type: 'custom_report',
    name: 'Custom Report Widget',
    icon: <FiFileText className="w-6 h-6 text-indigo-600" />,
    description:
      'Generate, filter, and view custom compliance reports in a beautiful, accessible card.',
    preview: (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-indigo-700">
        Custom Report
      </div>
    ),
  },
  // Advanced widgets below
  {
    type: 'credential_manager',
    name: 'Credential Manager',
    icon: <FiShield className="w-6 h-6 text-emerald-600" />,
    description: 'Manage organization credentials securely with vault abstraction and RBAC.',
    preview: (
      <div className="bg-emerald-50 dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-emerald-700 font-bold">
        + Add Credential
      </div>
    ),
    rbac: 'manage_credentials', // Only admins/owners
  },
  {
    type: 'org_switcher',
    name: 'Organization Switcher',
    icon: <FiList className="w-6 h-6 text-cyan-600" />,
    description: 'Switch between organizations in a multi-tenant environment.',
    preview: (
      <div className="bg-cyan-50 dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-cyan-700 font-bold">
        Select Organization
      </div>
    ),
    rbac: 'view_organizations',
  },
  {
    type: 'organization_list',
    name: 'Organization List',
    icon: <FiList className="w-6 h-6 text-indigo-600" />,
    description: 'View and manage organizations you belong to.',
    preview: (
      <div className="bg-indigo-50 dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-indigo-700 font-bold">
        Org 1, Org 2, Org 3
      </div>
    ),
    rbac: 'view_organizations',
  },
  {
    type: 'team_members',
    name: 'Team Members',
    icon: <FiList className="w-6 h-6 text-pink-600" />,
    description: 'Manage team members, roles, and invitations for your organization.',
    preview: (
      <div className="bg-pink-50 dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-pink-700 font-bold">
        + Invite Member
      </div>
    ),
    rbac: 'manage_team',
  },
  {
    type: 'tenant_reports',
    name: 'Tenant Reports',
    icon: <FiFileText className="w-6 h-6 text-yellow-600" />,
    description: 'View and export reports scoped to your organization.',
    preview: (
      <div className="bg-yellow-50 dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-yellow-700 font-bold">
        Export Report
      </div>
    ),
    rbac: 'view_reports',
  },
  {
    type: 'rule_list',
    name: 'Rule List',
    icon: <FiList className="w-6 h-6 text-lime-600" />,
    description: 'View, create, and manage compliance rules for your organization.',
    preview: (
      <div className="bg-lime-50 dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-lime-700 font-bold">
        + New Rule
      </div>
    ),
    rbac: 'manage_rules',
  },
  {
    type: 'monaco_editor',
    name: 'Monaco Editor',
    icon: <FiFileText className="w-6 h-6 text-fuchsia-600" />,
    description: 'Advanced code editor for custom rules and scripts (Monaco).',
    preview: (
      <div className="bg-fuchsia-50 dark:bg-zinc-900 rounded-lg p-4 shadow text-center text-fuchsia-700 font-bold">
        Monaco Editor
      </div>
    ),
    rbac: 'manage_rules',
  },
  // Add more widget types as needed
];

function WidgetCard({ w, onAddWidget }: { w: any; onAddWidget: (type: string) => void }) {
  return (
    <Card
      as="button"
      tabIndex={0}
      ariaLabel={w.name}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'box-shadow 0.15s', outline: 'none', marginBottom: 8 }}
      onClick={() => onAddWidget(w.type)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onAddWidget(w.type); }}
      title={w.description}
    >
      <span style={{ marginBottom: 8 }} aria-hidden="true">{w.icon}</span>
      <span style={{ fontWeight: 600, fontSize: 16, color: '#1e293b', marginBottom: 4 }}>{w.name}</span>
      <span style={{ fontSize: 12, color: '#64748b', marginBottom: 8, textAlign: 'center' }}>{w.description}</span>
      <span style={{ marginBottom: 8 }}>{w.preview}</span>
      {w.rbac && (
        <span style={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 10, padding: '2px 6px', marginBottom: 4 }} title={`RBAC: ${w.rbac}`}>{w.rbac.replace('_', ' ').toUpperCase()}</span>
      )}
      <Button
        variant="solid"
        colorScheme="brand"
        size="sm"
        aria-label={`Add ${w.name}`}
        leftIcon={<FiPlus style={{ width: 16, height: 16 }} />}
        onClick={e => { e.stopPropagation(); onAddWidget(w.type); }}
        style={{ marginTop: 8 }}
      >
        Add
      </Button>
    </Card>
  );
}

export function WidgetLibraryPanel({
  isOpen,
  onClose,
  onAddWidget,
}: WidgetLibraryPanelProps) {
  if (!isOpen) return null;

  // RBAC: Only show widgets the user has permission to view
  const canViewAuditLogs = useHasPermission('view_audit_logs');
  const canViewReports = useHasPermission('view_reports');
  const canExportReports = useHasPermission('export_reports');
  // Add more as needed for other widgets

  // Filter widgetTypes based on permissions
  const filteredWidgetTypes = widgetTypes.filter((w) => {
    if (w.type === 'audit_log') return canViewAuditLogs;
    if (w.type === 'custom_report') return canViewReports;
    if (w.type === 'export') return canExportReports;
    if (w.rbac === 'manage_credentials') return useHasPermission('manage_credentials');
    if (w.rbac === 'view_organizations') return useHasPermission('view_organizations');
    if (w.rbac === 'manage_team') return useHasPermission('manage_team');
    if (w.rbac === 'view_reports') return useHasPermission('view_reports');
    if (w.rbac === 'manage_rules') return useHasPermission('manage_rules');
    return true;
  });

  // Skeleton loader for loading state (if needed in future)
  // function WidgetLibrarySkeleton() {
  //   return <div className="animate-pulse bg-base-200 rounded-lg p-6 w-full h-40 flex items-center justify-center"><span className="text-base-content/40">Loading widgets...</span></div>;
  // }

  return (
    <aside
      style={{ position: 'fixed', top: 0, right: 0, zIndex: 50, width: '100%', maxWidth: 400, height: '100%', background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s' }}
      role="dialog"
      aria-modal="true"
      aria-label="Widget Library"
      tabIndex={-1}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Add Widget</span>
        <IconButton
          icon="×"
          ariaLabel="Close widget library"
          variant="ghost"
          size="sm"
          onClick={onClose}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {filteredWidgetTypes.map((w) => (
          <WidgetCard key={w.type} w={w} onAddWidget={onAddWidget} />
        ))}
      </div>
      {/* TODO: Add extensibility and Storybook/test coverage hooks */}
    </aside>
  );
}
