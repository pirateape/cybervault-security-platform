// Common types for the Security Compliance Tool

export interface User {
  id: string;
  email: string;
  org_id: string;
  role: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScanResult {
  id: string;
  scan_id: string;
  finding: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance_framework: string;
  org_id: string;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ScanMetadata {
  [key: string]: unknown;
}

export interface TriggerScanParams {
  orgId: string;
  userId: string;
  scanType: string;
  target?: string;
  metadata?: ScanMetadata;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// React event types
export type FormEvent = React.FormEvent<HTMLFormElement>;
export type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type MouseEvent = React.MouseEvent<HTMLButtonElement>;
