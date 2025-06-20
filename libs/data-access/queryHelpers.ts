/**
 * Standardized Data Fetching Patterns and Query Helpers
 * 
 * This module provides:
 * - Consistent query key factories for predictable caching
 * - Standardized TanStack Query configurations
 * - Reusable hook patterns for common operations
 * - Multi-tenant context handling
 */

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  UseQueryOptions, 
  UseMutationOptions 
} from '@tanstack/react-query';
import { api, APIError } from './apiClient';

// ====================
// QUERY KEY FACTORIES
// ====================

/**
 * Standardized query key factory functions for consistent cache management
 */
export const queryKeys = {
  // Organization-level keys
  organizations: {
    all: ['organizations'] as const,
    byUser: (userId: string) => ['organizations', 'user', userId] as const,
    byId: (orgId: string) => ['organization', orgId] as const,
  },

  // Rules API keys
  rules: {
    all: (orgId: string) => ['rules', orgId] as const,
    byId: (orgId: string, ruleId: string) => ['rule', orgId, ruleId] as const,
    versions: (orgId: string, ruleId: string) => ['ruleVersions', orgId, ruleId] as const,
  },

  // Dashboard and reports keys
  dashboard: {
    all: (orgId: string) => ['dashboard', orgId] as const,
    reports: (orgId: string) => ['reports', orgId] as const,
    compliance: (orgId: string) => ['compliance', orgId] as const,
  },

  // User-related keys
  users: {
    all: (orgId: string) => ['users', orgId] as const,
    byId: (orgId: string, userId: string) => ['user', orgId, userId] as const,
    profile: (userId: string) => ['profile', userId] as const,
  },

  // Review API keys
  review: {
    queue: (orgId: string, filters?: unknown) => ['review', 'queue', orgId, filters] as const,
    detail: (orgId: string, resultId: string) => ['review', 'detail', orgId, resultId] as const,
  },

  // Generic entity factory
  entity: <T extends string>(type: T, orgId?: string, id?: string) => {
    const base = orgId ? [type, orgId] : [type];
    return id ? [...base, id] : base;
  },
} as const;

// ====================
// QUERY CONFIGURATIONS
// ====================

/**
 * Default query options for different types of data
 */
export const queryConfig = {
  // Fast-changing data (user sessions, notifications)
  realtime: {
    staleTime: 0,
    refetchInterval: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  },

  // Moderately changing data (dashboard, reports)
  dashboard: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },

  // Stable data (rules, configurations)
  stable: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  },

  // Static data (reference data, metadata)
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  },

  // Default configuration
  default: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
} as const;

// ====================
// STANDARDIZED HOOKS
// ====================

/**
 * Generic query hook with standardized patterns
 */
export function useStandardQuery<TData = unknown, TError = APIError>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...queryConfig.dashboard, // Default to dashboard config
    ...options,
  });
}

/**
 * Generic mutation hook with standardized error handling
 */
export function useStandardMutation<TData = unknown, TError = APIError, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });
}

/**
 * Hook for entity listing with org context
 */
export function useEntityList<T>(
  entityType: string,
  orgId: string,
  endpoint: string,
  options?: Omit<UseQueryOptions<T[], APIError>, 'queryKey' | 'queryFn'>
) {
  return useStandardQuery(
    queryKeys.entity(entityType, orgId),
    () => api.get<T[]>(endpoint, orgId),
    {
      enabled: !!orgId,
      ...options,
    }
  );
}

/**
 * Hook for single entity retrieval with org context
 */
export function useEntity<T>(
  entityType: string,
  orgId: string,
  entityId: string,
  endpoint: string,
  options?: Omit<UseQueryOptions<T, APIError>, 'queryKey' | 'queryFn'>
) {
  return useStandardQuery(
    queryKeys.entity(entityType, orgId, entityId),
    () => api.get<T>(endpoint, orgId),
    {
      enabled: !!orgId && !!entityId,
      ...options,
    }
  );
}

/**
 * Hook for entity creation with automatic cache invalidation
 */
export function useCreateEntity<T, TCreate = Partial<T>>(
  entityType: string,
  orgId: string,
  endpoint: string,
  options?: UseMutationOptions<T, APIError, TCreate>
) {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (data: TCreate) => api.post<T>(endpoint, data, orgId),
    {
      onSuccess: (newEntity, variables, context) => {
        // Invalidate list queries
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.entity(entityType, orgId) 
        });
        
        // Call custom onSuccess if provided
        options?.onSuccess?.(newEntity, variables, context);
      },
      ...options,
    }
  );
}

/**
 * Hook for entity updates with optimistic updates
 */
export function useUpdateEntity<T, TUpdate = Partial<T>>(
  entityType: string,
  orgId: string,
  entityId: string,
  endpoint: string,
  options?: UseMutationOptions<T, APIError, TUpdate>
) {
  const queryClient = useQueryClient();

  interface MutationContext {
    previousEntity: unknown;
    previousList: unknown;
    entityKey: readonly unknown[];
    listKey: readonly unknown[];
  }

  return useStandardMutation(
    (data: TUpdate) => api.put<T>(endpoint, data, orgId),
    {
      onMutate: async (newData): Promise<MutationContext> => {
        // Cancel outgoing refetches
        const entityKey = queryKeys.entity(entityType, orgId, entityId);
        const listKey = queryKeys.entity(entityType, orgId);
        
        await queryClient.cancelQueries({ queryKey: entityKey });
        await queryClient.cancelQueries({ queryKey: listKey });

        // Snapshot previous values
        const previousEntity = queryClient.getQueryData(entityKey);
        const previousList = queryClient.getQueryData(listKey);

        // Optimistically update the cache
        queryClient.setQueryData(entityKey, (old: T | undefined) => 
          old ? { ...old, ...newData } : old
        );

        // Return rollback function
        return { previousEntity, previousList, entityKey, listKey };
      },
      
      onError: (err, newData, context: MutationContext | undefined) => {
        // Rollback on error
        if (context) {
          queryClient.setQueryData(context.entityKey, context.previousEntity);
          queryClient.setQueryData(context.listKey, context.previousList);
        }
        
        options?.onError?.(err, newData, context);
      },
      
      onSettled: () => {
        // Refetch to ensure consistency
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.entity(entityType, orgId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.entity(entityType, orgId, entityId) 
        });
      },
      
      ...options,
    }
  );
}

/**
 * Hook for entity deletion with cache cleanup
 */
export function useDeleteEntity<T = void>(
  entityType: string,
  orgId: string,
  entityId: string,
  endpoint: string,
  options?: UseMutationOptions<T, APIError, void>
) {
  const queryClient = useQueryClient();

  return useStandardMutation(
    () => api.delete<T>(endpoint, orgId),
    {
      onSuccess: (data, variables, context) => {
        // Remove from cache
        queryClient.removeQueries({ 
          queryKey: queryKeys.entity(entityType, orgId, entityId) 
        });
        
        // Invalidate list queries
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.entity(entityType, orgId) 
        });
        
        options?.onSuccess?.(data, variables, context);
      },
      ...options,
    }
  );
}

// ====================
// SPECIALIZED HOOKS
// ====================

/**
 * Hook for paginated data with cursor-based pagination
 */
export function usePaginatedQuery<T>(
  queryKey: readonly unknown[],
  endpoint: string,
  orgId: string,
  limit: number = 20,
  options?: Omit<UseQueryOptions<T[], APIError>, 'queryKey' | 'queryFn'>
) {
  return useStandardQuery(
    [...queryKey, 'paginated', limit],
    () => api.get<T[]>(`${endpoint}?limit=${limit}`, orgId),
    {
      ...queryConfig.dashboard,
      ...options,
    }
  );
}

/**
 * Hook for search queries with debouncing support
 */
export function useSearchQuery<T>(
  entityType: string,
  orgId: string,
  searchTerm: string,
  endpoint: string,
  debounceMs: number = 300,
  options?: Omit<UseQueryOptions<T[], APIError>, 'queryKey' | 'queryFn'>
) {
  return useStandardQuery(
    queryKeys.entity(`${entityType}_search`, orgId, searchTerm),
    () => api.get<T[]>(`${endpoint}?search=${encodeURIComponent(searchTerm)}`, orgId),
    {
      enabled: !!orgId && searchTerm.length >= 2,
      staleTime: 5 * 60 * 1000, // 5 minutes for search results
      ...options,
    }
  );
}

/**
 * Hook for bulk operations
 */
export function useBulkOperation<T, TBulkData>(
  entityType: string,
  orgId: string,
  endpoint: string,
  options?: UseMutationOptions<T, APIError, TBulkData>
) {
  const queryClient = useQueryClient();

  return useStandardMutation(
    (data: TBulkData) => api.post<T>(endpoint, data, orgId),
    {
      onSuccess: (result, variables, context) => {
        // Invalidate all related queries
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.entity(entityType, orgId) 
        });
        
        options?.onSuccess?.(result, variables, context);
      },
      ...options,
    }
  );
}

// ====================
// UTILITY FUNCTIONS
// ====================

/**
 * Prefetch data for better UX
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchEntity = <T>(
    entityType: string,
    orgId: string,
    entityId: string,
    endpoint: string
  ) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.entity(entityType, orgId, entityId),
      queryFn: () => api.get<T>(endpoint, orgId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  const prefetchList = <T>(
    entityType: string,
    orgId: string,
    endpoint: string
  ) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.entity(entityType, orgId),
      queryFn: () => api.get<T[]>(endpoint, orgId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  return { prefetchEntity, prefetchList };
}

/**
 * Cache management utilities
 */
export function useCacheManagement() {
  const queryClient = useQueryClient();

  const invalidateOrg = (orgId: string) => {
    return queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key.includes(orgId);
      }
    });
  };

  const clearOrgCache = (orgId: string) => {
    return queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key.includes(orgId);
      }
    });
  };

  return { invalidateOrg, clearOrgCache };
} 