/**
 * Remediation Management API using standardized data access patterns
 * 
 * This module provides comprehensive remediation management capabilities:
 * - Remediation action CRUD operations with workflow management
 * - Kanban-style status transitions and validation
 * - SLA monitoring and compliance tracking
 * - Assignment automation and user management integration
 * - Evidence collection and verification processes
 * - Bulk operations for efficient admin workflows
 * - Advanced filtering and search capabilities
 */

import { z } from 'zod';
import { 
  useEntityList, 
  useEntity,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  useStandardQuery,
  useStandardMutation,
  queryKeys,
  queryConfig
} from './queryHelpers';
import { api, APIError } from './apiClient';
import { useQueryClient } from '@tanstack/react-query';

// ====================
// TYPES & SCHEMAS
// ====================

export const RemediationStatusSchema = z.enum([
  'open', 
  'assigned', 
  'in_progress', 
  'under_review', 
  'resolved', 
  'verified', 
  'closed', 
  'rejected', 
  'escalated', 
  'on_hold'
]);
export type RemediationStatus = z.infer<typeof RemediationStatusSchema>;

export const RemediationPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RemediationPriority = z.infer<typeof RemediationPrioritySchema>;

export const RemediationActionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: RemediationStatusSchema,
  priority: RemediationPrioritySchema,
  assigned_to: z.string().uuid().nullable(),
  assigned_by: z.string().uuid().nullable(),
  created_by: z.string().uuid(),
  org_id: z.string().uuid(),
  due_date: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  resolved_at: z.string().datetime().nullable(),
  verified_at: z.string().datetime().nullable(),
  closed_at: z.string().datetime().nullable(),
  
  // SLA and tracking
  sla_hours: z.number().int().min(1).nullable(),
  time_spent_minutes: z.number().int().min(0).default(0),
  estimated_effort_hours: z.number().nullable(),
  
  // Evidence and documentation
  evidence_required: z.boolean().default(false),
  evidence_collected: z.boolean().default(false),
  evidence_urls: z.array(z.string().url()).default([]),
  notes: z.string().default(''),
  
  // Classification and tagging
  category: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).nullable(),
  
  // Relationships
  parent_action_id: z.string().uuid().nullable(),
  related_finding_id: z.string().uuid().nullable(),
  compliance_framework: z.string().nullable(),
  
  // Workflow tracking
  status_history: z.array(z.object({
    status: RemediationStatusSchema,
    changed_by: z.string().uuid(),
    changed_at: z.string().datetime(),
    comment: z.string().optional(),
  })).default([]),
  
  // Assignment and user info (populated via joins)
  assignee_name: z.string().nullable().optional(),
  assignee_email: z.string().email().nullable().optional(),
  creator_name: z.string().optional(),
  creator_email: z.string().email().optional(),
});

export type RemediationAction = z.infer<typeof RemediationActionSchema>;

export const CreateRemediationActionRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: RemediationPrioritySchema,
  assigned_to: z.string().uuid().nullable(),
  due_date: z.string().datetime().nullable(),
  sla_hours: z.number().int().min(1).nullable(),
  estimated_effort_hours: z.number().nullable(),
  evidence_required: z.boolean().default(false),
  category: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).nullable(),
  parent_action_id: z.string().uuid().nullable(),
  related_finding_id: z.string().uuid().nullable(),
  compliance_framework: z.string().nullable(),
  notes: z.string().default(''),
});

export type CreateRemediationActionRequest = z.infer<typeof CreateRemediationActionRequestSchema>;

export const UpdateRemediationActionRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  priority: RemediationPrioritySchema.optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  sla_hours: z.number().int().min(1).nullable().optional(),
  estimated_effort_hours: z.number().nullable().optional(),
  evidence_required: z.boolean().optional(),
  evidence_collected: z.boolean().optional(),
  evidence_urls: z.array(z.string().url()).optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
  notes: z.string().optional(),
  time_spent_minutes: z.number().int().min(0).optional(),
});

export type UpdateRemediationActionRequest = z.infer<typeof UpdateRemediationActionRequestSchema>;

export const RemediationSearchFiltersSchema = z.object({
  search: z.string().optional(),
  status: RemediationStatusSchema.optional(),
  priority: RemediationPrioritySchema.optional(),
  assigned_to: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  category: z.string().optional(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  compliance_framework: z.string().optional(),
  due_before: z.string().datetime().optional(),
  due_after: z.string().datetime().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  overdue_only: z.boolean().optional(),
  evidence_required: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  sort_by: z.enum(['created_at', 'due_date', 'priority', 'status', 'title']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type RemediationSearchFilters = z.infer<typeof RemediationSearchFiltersSchema>;

export const BulkRemediationOperationSchema = z.object({
  action_ids: z.array(z.string().uuid()).min(1, 'At least one action ID is required'),
  operation: z.enum(['assign', 'update_status', 'update_priority', 'add_tag', 'remove_tag', 'delete']),
  data: z.record(z.any()).optional(), // Additional data for the operation
});

export type BulkRemediationOperation = z.infer<typeof BulkRemediationOperationSchema>;

export const RemediationStatsSchema = z.object({
  total_actions: z.number().int(),
  open_actions: z.number().int(),
  in_progress_actions: z.number().int(),
  resolved_actions: z.number().int(),
  overdue_actions: z.number().int(),
  actions_by_status: z.record(z.number().int()),
  actions_by_priority: z.record(z.number().int()),
  average_resolution_time_hours: z.number().nullable(),
  sla_compliance_rate: z.number().min(0).max(100),
  recent_assignments: z.number().int(),
  critical_overdue: z.number().int(),
});

export type RemediationStats = z.infer<typeof RemediationStatsSchema>;

// ====================
// API ENDPOINTS
// ====================

const REMEDIATION_BASE = '/remediation';

// Core remediation API functions
export async function fetchRemediationActions(
  orgId: string, 
  filters?: RemediationSearchFilters
): Promise<{ actions: RemediationAction[]; total: number; page: number; limit: number }> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, String(v)));
        } else {
          params.append(key, String(value));
        }
      }
    });
  }
  
  const queryString = params.toString();
  const url = queryString ? `${REMEDIATION_BASE}?${queryString}` : REMEDIATION_BASE;
  
  const data = await api.get<{ actions: RemediationAction[]; total: number; page: number; limit: number }>(url, orgId);
  return {
    actions: data.actions.map(action => RemediationActionSchema.parse(action)),
    total: data.total,
    page: data.page,
    limit: data.limit,
  };
}

export async function fetchRemediationAction(orgId: string, actionId: string): Promise<RemediationAction> {
  const data = await api.get<RemediationAction>(`${REMEDIATION_BASE}/${actionId}`, orgId);
  return RemediationActionSchema.parse(data);
}

export async function createRemediationAction(
  orgId: string, 
  actionData: CreateRemediationActionRequest
): Promise<RemediationAction> {
  const validatedData = CreateRemediationActionRequestSchema.parse(actionData);
  const data = await api.post<RemediationAction>(REMEDIATION_BASE, validatedData, orgId);
  return RemediationActionSchema.parse(data);
}

export async function updateRemediationAction(
  orgId: string, 
  actionId: string, 
  actionData: UpdateRemediationActionRequest
): Promise<RemediationAction> {
  const validatedData = UpdateRemediationActionRequestSchema.parse(actionData);
  const data = await api.put<RemediationAction>(`${REMEDIATION_BASE}/${actionId}`, validatedData, orgId);
  return RemediationActionSchema.parse(data);
}

export async function deleteRemediationAction(orgId: string, actionId: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${REMEDIATION_BASE}/${actionId}`, orgId);
}

export async function assignRemediationAction(
  orgId: string, 
  actionId: string, 
  assigneeId: string,
  comment?: string
): Promise<RemediationAction> {
  const data = await api.post<RemediationAction>(
    `${REMEDIATION_BASE}/${actionId}/assign`, 
    { assignee_id: assigneeId, comment }, 
    orgId
  );
  return RemediationActionSchema.parse(data);
}

export async function updateRemediationStatus(
  orgId: string, 
  actionId: string, 
  status: RemediationStatus,
  comment?: string
): Promise<RemediationAction> {
  const data = await api.post<RemediationAction>(
    `${REMEDIATION_BASE}/${actionId}/status`, 
    { status, comment }, 
    orgId
  );
  return RemediationActionSchema.parse(data);
}

export async function verifyRemediationAction(
  orgId: string, 
  actionId: string, 
  verified: boolean,
  comment?: string
): Promise<RemediationAction> {
  const data = await api.post<RemediationAction>(
    `${REMEDIATION_BASE}/${actionId}/verify`, 
    { verified, comment }, 
    orgId
  );
  return RemediationActionSchema.parse(data);
}

export async function bulkRemediationOperation(
  orgId: string, 
  operation: BulkRemediationOperation
): Promise<{ success: number; failed: number; errors: string[] }> {
  const validatedOperation = BulkRemediationOperationSchema.parse(operation);
  return await api.post<{ success: number; failed: number; errors: string[] }>(`${REMEDIATION_BASE}/bulk`, validatedOperation, orgId);
}

export async function fetchRemediationStats(orgId: string): Promise<RemediationStats> {
  const data = await api.get<RemediationStats>(`${REMEDIATION_BASE}/stats`, orgId);
  return RemediationStatsSchema.parse(data);
}

// ====================
// QUERY KEYS
// ====================

declare module './queryHelpers' {
  interface QueryKeys {
    remediation: {
      actions: (orgId: string, filters?: RemediationSearchFilters) => readonly unknown[];
      action: (orgId: string, actionId: string) => readonly unknown[];
      stats: (orgId: string) => readonly unknown[];
    };
  }
}

export const remediationKeys = {
  actions: (orgId: string, filters?: RemediationSearchFilters) => 
    ['remediation', 'actions', orgId, filters] as const,
  action: (orgId: string, actionId: string) => 
    ['remediation', 'action', orgId, actionId] as const,
  stats: (orgId: string) => 
    ['remediation', 'stats', orgId] as const,
};

// ====================
// REACT QUERY HOOKS
// ====================

export function useRemediationActions(orgId: string, filters?: RemediationSearchFilters) {
  return useStandardQuery(
    remediationKeys.actions(orgId, filters),
    () => fetchRemediationActions(orgId, filters),
    {
      ...queryConfig.default,
      enabled: !!orgId,
      staleTime: 30000, // 30 seconds
    }
  );
}

export function useRemediationAction(orgId: string, actionId: string) {
  return useStandardQuery(
    remediationKeys.action(orgId, actionId),
    () => fetchRemediationAction(orgId, actionId),
    {
      ...queryConfig.default,
      enabled: !!orgId && !!actionId,
    }
  );
}

export function useCreateRemediationAction(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (actionData: CreateRemediationActionRequest) => createRemediationAction(orgId, actionData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['remediation', 'actions', orgId] });
        queryClient.invalidateQueries({ queryKey: ['remediation', 'stats', orgId] });
      },
    }
  );
}

export function useUpdateRemediationAction(orgId: string, actionId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (actionData: UpdateRemediationActionRequest) => updateRemediationAction(orgId, actionId, actionData),
    {
      onSuccess: (updatedAction) => {
        queryClient.setQueryData(remediationKeys.action(orgId, actionId), updatedAction);
        queryClient.invalidateQueries({ queryKey: ['remediation', 'actions', orgId] });
        queryClient.invalidateQueries({ queryKey: ['remediation', 'stats', orgId] });
      },
    }
  );
}

export function useDeleteRemediationAction(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (actionId: string) => deleteRemediationAction(orgId, actionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['remediation', 'actions', orgId] });
        queryClient.invalidateQueries({ queryKey: ['remediation', 'stats', orgId] });
      },
    }
  );
}

export function useAssignRemediationAction(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    ({ actionId, assigneeId, comment }: { actionId: string; assigneeId: string; comment?: string }) => 
      assignRemediationAction(orgId, actionId, assigneeId, comment),
    {
      onSuccess: (updatedAction) => {
        queryClient.setQueryData(remediationKeys.action(orgId, updatedAction.id), updatedAction);
        queryClient.invalidateQueries({ queryKey: ['remediation', 'actions', orgId] });
        queryClient.invalidateQueries({ queryKey: ['remediation', 'stats', orgId] });
      },
    }
  );
}

export function useUpdateRemediationStatus(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    ({ actionId, status, comment }: { actionId: string; status: RemediationStatus; comment?: string }) => 
      updateRemediationStatus(orgId, actionId, status, comment),
    {
      onSuccess: (updatedAction) => {
        queryClient.setQueryData(remediationKeys.action(orgId, updatedAction.id), updatedAction);
        queryClient.invalidateQueries({ queryKey: ['remediation', 'actions', orgId] });
        queryClient.invalidateQueries({ queryKey: ['remediation', 'stats', orgId] });
      },
    }
  );
}

export function useVerifyRemediationAction(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    ({ actionId, verified, comment }: { actionId: string; verified: boolean; comment?: string }) => 
      verifyRemediationAction(orgId, actionId, verified, comment),
    {
      onSuccess: (updatedAction) => {
        queryClient.setQueryData(remediationKeys.action(orgId, updatedAction.id), updatedAction);
        queryClient.invalidateQueries({ queryKey: ['remediation', 'actions', orgId] });
        queryClient.invalidateQueries({ queryKey: ['remediation', 'stats', orgId] });
      },
    }
  );
}

export function useBulkRemediationOperation(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (operation: BulkRemediationOperation) => bulkRemediationOperation(orgId, operation),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['remediation', 'actions', orgId] });
        queryClient.invalidateQueries({ queryKey: ['remediation', 'stats', orgId] });
      },
    }
  );
}

export function useRemediationStats(orgId: string) {
  return useStandardQuery(
    remediationKeys.stats(orgId),
    () => fetchRemediationStats(orgId),
    {
      ...queryConfig.default,
      enabled: !!orgId,
      staleTime: 60000, // 1 minute
    }
  );
}

// ====================
// UTILITY FUNCTIONS
// ====================

export function getStatusColor(status: RemediationStatus): string {
  const colors = {
    open: 'bg-gray-100 text-gray-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    verified: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-800',
    escalated: 'bg-orange-100 text-orange-800',
    on_hold: 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: RemediationPriority): string {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function isOverdue(action: RemediationAction): boolean {
  if (!action.due_date || action.status === 'closed' || action.status === 'verified') {
    return false;
  }
  return new Date(action.due_date) < new Date();
}

export function calculateSLACompliance(action: RemediationAction): number | null {
  if (!action.sla_hours || !action.created_at) {
    return null;
  }
  
  const createdAt = new Date(action.created_at);
  const now = new Date();
  const resolvedAt = action.resolved_at ? new Date(action.resolved_at) : now;
  
  const actualHours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const complianceRate = Math.max(0, Math.min(100, (action.sla_hours / actualHours) * 100));
  
  return Math.round(complianceRate);
}

export function getValidStatusTransitions(currentStatus: RemediationStatus): RemediationStatus[] {
  const transitions: Record<RemediationStatus, RemediationStatus[]> = {
    open: ['assigned', 'in_progress', 'on_hold', 'rejected'],
    assigned: ['in_progress', 'open', 'on_hold', 'rejected'],
    in_progress: ['under_review', 'resolved', 'assigned', 'on_hold', 'escalated'],
    under_review: ['resolved', 'in_progress', 'rejected', 'escalated'],
    resolved: ['verified', 'under_review', 'rejected'],
    verified: ['closed'],
    closed: [], // Terminal state
    rejected: ['open', 'assigned'],
    escalated: ['in_progress', 'under_review', 'resolved'],
    on_hold: ['open', 'assigned', 'in_progress'],
  };
  
  return transitions[currentStatus] || [];
}

export function formatTimeSpent(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function getActionProgress(action: RemediationAction): number {
  const statusProgress = {
    open: 0,
    assigned: 10,
    in_progress: 40,
    under_review: 70,
    resolved: 85,
    verified: 95,
    closed: 100,
    rejected: 0,
    escalated: 30,
    on_hold: 20,
  };
  
  return statusProgress[action.status] || 0;
} 