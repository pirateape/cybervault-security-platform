/**
 * User Management API using standardized data access patterns
 * 
 * This module provides comprehensive user management capabilities:
 * - User CRUD operations with role-based access control
 * - Role and permission management
 * - Bulk operations for efficient admin workflows
 * - Password management and security features
 * - Audit logging for compliance
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
import { UserRole, Permission } from '../types/src';

// ====================
// TYPES & SCHEMAS
// ====================

export const UserStatusSchema = z.enum(['active', 'inactive', 'pending', 'suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  role: z.enum(['admin', 'user', 'auditor', 'viewer']),
  status: UserStatusSchema,
  is_disabled: z.boolean(),
  last_login: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  org_id: z.string().uuid(),
  avatar_url: z.string().url().nullable(),
  phone: z.string().nullable(),
  department: z.string().nullable(),
  job_title: z.string().nullable(),
  two_factor_enabled: z.boolean(),
  password_last_changed: z.string().datetime().nullable(),
  failed_login_attempts: z.number().int().min(0),
  locked_until: z.string().datetime().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'user', 'auditor', 'viewer']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().nullable(),
  job_title: z.string().nullable(),
  send_invitation: z.boolean().default(true),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = z.object({
  full_name: z.string().min(1).optional(),
  role: z.enum(['admin', 'user', 'auditor', 'viewer']).optional(),
  status: UserStatusSchema.optional(),
  department: z.string().nullable().optional(),
  job_title: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export const BulkUserOperationSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  operation: z.enum(['activate', 'deactivate', 'delete', 'update_role', 'reset_password']),
  data: z.record(z.any()).optional(), // Additional data for the operation
});

export type BulkUserOperation = z.infer<typeof BulkUserOperationSchema>;

export const UserSearchFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['admin', 'user', 'auditor', 'viewer']).optional(),
  status: UserStatusSchema.optional(),
  department: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  last_login_after: z.string().datetime().optional(),
  last_login_before: z.string().datetime().optional(),
  sort_by: z.enum(['email', 'full_name', 'created_at', 'last_login', 'role']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type UserSearchFilters = z.infer<typeof UserSearchFiltersSchema>;

export const UserStatsSchema = z.object({
  total_users: z.number().int(),
  active_users: z.number().int(),
  inactive_users: z.number().int(),
  pending_users: z.number().int(),
  suspended_users: z.number().int(),
  users_by_role: z.record(z.number().int()),
  recent_signups: z.number().int(),
  recent_logins: z.number().int(),
});

export type UserStats = z.infer<typeof UserStatsSchema>;

export const PasswordResetRequestSchema = z.object({
  user_email: z.string().email(),
  send_email: z.boolean().default(true),
});

export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

export const UserAuditLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: z.string(),
  target_user_id: z.string().uuid(),
  details: z.record(z.any()),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type UserAuditLog = z.infer<typeof UserAuditLogSchema>;

// ====================
// API ENDPOINTS
// ====================

const USERS_BASE = '/users';
const ADMIN_BASE = '/admin';

// Core user API functions
export async function fetchUsers(orgId: string, filters?: UserSearchFilters): Promise<{ users: User[]; total: number; page: number; limit: number }> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const queryString = params.toString();
  const url = queryString ? `${USERS_BASE}?${queryString}` : USERS_BASE;
  
  const data = await api.get<{ users: User[]; total: number; page: number; limit: number }>(url, orgId);
  return {
    users: data.users.map(user => UserSchema.parse(user)),
    total: data.total,
    page: data.page,
    limit: data.limit,
  };
}

export async function fetchUser(orgId: string, userId: string): Promise<User> {
  const data = await api.get<User>(`${USERS_BASE}/${userId}`, orgId);
  return UserSchema.parse(data);
}

export async function createUser(orgId: string, userData: CreateUserRequest): Promise<User> {
  const validatedData = CreateUserRequestSchema.parse(userData);
  const data = await api.post<User>(USERS_BASE, validatedData, orgId);
  return UserSchema.parse(data);
}

export async function updateUser(orgId: string, userId: string, userData: UpdateUserRequest): Promise<User> {
  const validatedData = UpdateUserRequestSchema.parse(userData);
  const data = await api.put<User>(`${USERS_BASE}/${userId}`, validatedData, orgId);
  return UserSchema.parse(data);
}

export async function deleteUser(orgId: string, userId: string): Promise<{ success: boolean; message: string }> {
  return await api.delete(`${USERS_BASE}/${userId}`, orgId);
}

export async function bulkUserOperation(orgId: string, operation: BulkUserOperation): Promise<{ success: number; failed: number; errors: string[] }> {
  const validatedOperation = BulkUserOperationSchema.parse(operation);
  return await api.post<{ success: number; failed: number; errors: string[] }>(`${USERS_BASE}/bulk`, validatedOperation, orgId);
}

export async function resetUserPassword(orgId: string, request: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
  const validatedRequest = PasswordResetRequestSchema.parse(request);
  return await api.post<{ success: boolean; message: string }>(`${ADMIN_BASE}/reset-password`, validatedRequest, orgId);
}

export async function fetchUserStats(orgId: string): Promise<UserStats> {
  const data = await api.get<UserStats>(`${USERS_BASE}/stats`, orgId);
  return UserStatsSchema.parse(data);
}

export async function fetchUserAuditLogs(orgId: string, userId: string, limit = 50): Promise<UserAuditLog[]> {
  const data = await api.get<UserAuditLog[]>(`${USERS_BASE}/${userId}/audit-logs?limit=${limit}`, orgId);
  return data.map(log => UserAuditLogSchema.parse(log));
}

export async function enableUser(orgId: string, userId: string): Promise<{ success: boolean; message: string }> {
  return await api.post<{ success: boolean; message: string }>(`${USERS_BASE}/${userId}/enable`, {}, orgId);
}

export async function disableUser(orgId: string, userId: string): Promise<{ success: boolean; message: string }> {
  return await api.post<{ success: boolean; message: string }>(`${USERS_BASE}/${userId}/disable`, {}, orgId);
}

export async function unlockUser(orgId: string, userId: string): Promise<{ success: boolean; message: string }> {
  return await api.post<{ success: boolean; message: string }>(`${USERS_BASE}/${userId}/unlock`, {}, orgId);
}

// ====================
// REACT QUERY HOOKS
// ====================

// Add user management keys to the query keys
declare module './queryHelpers' {
  interface QueryKeys {
    userManagement: {
      users: (orgId: string, filters?: UserSearchFilters) => readonly unknown[];
      user: (orgId: string, userId: string) => readonly unknown[];
      stats: (orgId: string) => readonly unknown[];
      auditLogs: (orgId: string, userId: string) => readonly unknown[];
    };
  }
}

// Update queryKeys to include user management
const userManagementKeys = {
  users: (orgId: string, filters?: UserSearchFilters) => ['userManagement', 'users', orgId, filters] as const,
  user: (orgId: string, userId: string) => ['userManagement', 'user', orgId, userId] as const,
  stats: (orgId: string) => ['userManagement', 'stats', orgId] as const,
  auditLogs: (orgId: string, userId: string) => ['userManagement', 'auditLogs', orgId, userId] as const,
};

// Extend queryKeys with user management keys
Object.assign(queryKeys, { userManagement: userManagementKeys });

/**
 * Hook to fetch paginated users with filtering and search
 */
export function useUsers(orgId: string, filters?: UserSearchFilters) {
  return useStandardQuery(
    userManagementKeys.users(orgId, filters),
    () => fetchUsers(orgId, filters),
    {
      ...queryConfig.default,
      enabled: !!orgId,
      placeholderData: (previousData) => previousData, // For pagination
    }
  );
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(orgId: string, userId: string) {
  return useStandardQuery(
    userManagementKeys.user(orgId, userId),
    () => fetchUser(orgId, userId),
    {
      ...queryConfig.default,
      enabled: !!orgId && !!userId,
    }
  );
}

/**
 * Hook to create a new user with optimistic updates
 */
export function useCreateUser(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (userData: CreateUserRequest) => createUser(orgId, userData),
    {
      onSuccess: (newUser) => {
        // Invalidate and refetch users list
        queryClient.invalidateQueries({ queryKey: userManagementKeys.users(orgId) });
        
        // Add the new user to the cache
        queryClient.setQueryData(
          userManagementKeys.user(orgId, newUser.id),
          newUser
        );
        
        // Update stats
        queryClient.invalidateQueries({ queryKey: userManagementKeys.stats(orgId) });
      },
    }
  );
}

/**
 * Hook to update a user with optimistic updates
 */
export function useUpdateUser(orgId: string, userId: string) {
  return useUpdateEntity<User, UpdateUserRequest>(
    'user',
    orgId,
    userId,
    `${USERS_BASE}/${userId}`,
    {
      onSuccess: () => {
        // Additional success actions specific to user updates
      },
    }
  );
}

/**
 * Hook to delete a user with cache cleanup
 */
export function useDeleteUser(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (userId: string) => deleteUser(orgId, userId),
    {
      onSuccess: (_, userId) => {
        // Remove user from cache
        queryClient.removeQueries({ queryKey: userManagementKeys.user(orgId, userId) });
        
        // Invalidate users list
        queryClient.invalidateQueries({ queryKey: userManagementKeys.users(orgId) });
        
        // Update stats
        queryClient.invalidateQueries({ queryKey: userManagementKeys.stats(orgId) });
      },
    }
  );
}

/**
 * Hook for bulk user operations
 */
export function useBulkUserOperation(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (operation: BulkUserOperation) => bulkUserOperation(orgId, operation),
    {
      onSuccess: () => {
        // Invalidate all user-related queries after bulk operations
        queryClient.invalidateQueries({ queryKey: ['userManagement', orgId] });
      },
    }
  );
}

/**
 * Hook to reset user password
 */
export function useResetUserPassword(orgId: string) {
  return useStandardMutation(
    (request: PasswordResetRequest) => resetUserPassword(orgId, request)
  );
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats(orgId: string) {
  return useStandardQuery(
    userManagementKeys.stats(orgId),
    () => fetchUserStats(orgId),
    {
      ...queryConfig.default,
      enabled: !!orgId,
    }
  );
}

/**
 * Hook to fetch user audit logs
 */
export function useUserAuditLogs(orgId: string, userId: string, limit = 50) {
  return useStandardQuery(
    userManagementKeys.auditLogs(orgId, userId),
    () => fetchUserAuditLogs(orgId, userId, limit),
    {
      ...queryConfig.default,
      enabled: !!orgId && !!userId,
    }
  );
}

/**
 * Hook to enable/disable users
 */
export function useToggleUserStatus(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    ({ userId, action }: { userId: string; action: 'enable' | 'disable' }) => {
      return action === 'enable' ? enableUser(orgId, userId) : disableUser(orgId, userId);
    },
    {
      onSuccess: (_, { userId }) => {
        // Invalidate specific user and users list
        queryClient.invalidateQueries({ queryKey: userManagementKeys.user(orgId, userId) });
        queryClient.invalidateQueries({ queryKey: userManagementKeys.users(orgId) });
        queryClient.invalidateQueries({ queryKey: userManagementKeys.stats(orgId) });
      },
    }
  );
}

/**
 * Hook to unlock a user account
 */
export function useUnlockUser(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    (userId: string) => unlockUser(orgId, userId),
    {
      onSuccess: (_, userId) => {
        // Invalidate specific user and users list
        queryClient.invalidateQueries({ queryKey: userManagementKeys.user(orgId, userId) });
        queryClient.invalidateQueries({ queryKey: userManagementKeys.users(orgId) });
      },
    }
  );
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Utility to check if a user can perform an action on another user
 */
export function canManageUser(currentUser: User, targetUser: User): boolean {
  // Users cannot manage themselves for certain actions
  if (currentUser.id === targetUser.id) return false;
  
  // Only admins can manage other users
  if (currentUser.role !== 'admin') return false;
  
  // Admins cannot delete the last admin
  // This check would need to be done with additional context
  return true;
}

/**
 * Utility to validate user permissions for bulk operations
 */
export function validateBulkOperation(currentUser: User, operation: BulkUserOperation): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (currentUser.role !== 'admin') {
    errors.push('Only administrators can perform bulk operations');
  }
  
  if (operation.user_ids.includes(currentUser.id)) {
    errors.push('Cannot perform bulk operations on your own account');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Types are already exported at their declarations above 