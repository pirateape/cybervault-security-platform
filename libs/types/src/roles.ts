// libs/types/src/roles.ts

// Define all roles in the system
export type UserRole =
  | 'owner'
  | 'admin'
  | 'security_team'
  | 'compliance_officer'
  | 'developer'
  | 'member'
  | 'viewer'
  | string;

// Define all possible permissions (widget/action-level granularity)
export type Permission =
  | 'view_dashboard'
  | 'manage_organization'
  | 'manage_team_members'
  | 'manage_credentials'
  | 'view_audit_logs'
  | 'export_audit_logs'
  | 'manage_rules'
  | 'view_reports'
  | 'export_reports'
  | 'customize_layout'
  | 'switch_theme'
  | 'admin_all'
  | string;

// Map roles to permissions (can be extended or fetched from backend)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'admin_all',
    'view_dashboard',
    'manage_organization',
    'manage_team_members',
    'manage_credentials',
    'view_audit_logs',
    'export_audit_logs',
    'manage_rules',
    'view_reports',
    'export_reports',
    'customize_layout',
    'switch_theme',
  ],
  admin: [
    'view_dashboard',
    'manage_organization',
    'manage_team_members',
    'manage_credentials',
    'view_audit_logs',
    'export_audit_logs',
    'manage_rules',
    'view_reports',
    'export_reports',
    'customize_layout',
    'switch_theme',
  ],
  security_team: [
    'view_dashboard',
    'view_audit_logs',
    'manage_rules',
    'view_reports',
    'export_reports',
  ],
  compliance_officer: [
    'view_dashboard',
    'view_audit_logs',
    'view_reports',
    'export_reports',
  ],
  developer: [
    'view_dashboard',
    'manage_rules',
    'view_reports',
  ],
  member: [
    'view_dashboard',
    'view_reports',
  ],
  viewer: [
    'view_dashboard',
    'view_reports',
  ],
};

export type UserPermissions = Permission[]; 