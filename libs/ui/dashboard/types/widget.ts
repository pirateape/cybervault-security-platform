// Widget and dashboard type definitions

export interface DashboardWidget {
  id: string;
  type:
    | 'kpi'
    | 'chart'
    | 'nivo_chart'
    | 'risk'
    | 'remediation'
    | 'custom'
    | 'remediation_progress'
    | 'compliance_status'
    | 'audit_log'
    | 'scorecard'
    | 'export'
    | 'custom_report'
    | 'credential_manager'
    | 'org_switcher'
    | 'organization_list'
    | 'team_members'
    | 'tenant_reports'
    | 'rule_list'
    | 'monaco_editor';
  title: string;
  description?: string;
  layout: WidgetLayout;
  data?: any;
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface KPIWidgetData {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export interface ChartWidgetData {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any;
  options?: any;
}

export interface RemediationProgressBarData {
  label: string;
  progress: number;
  status?: 'in-progress' | 'complete' | 'blocked';
}

export interface AuditLogWidgetData {
  columns?: string[];
  filters?: {
    event_type?: string;
    user_id?: string;
    resource?: string;
    from?: string;
    to?: string;
  };
  view?: 'table' | 'timeline';
  pageSize?: number;
}
