/**
 * Standardized Rules API using unified data access patterns
 * 
 * This module replaces the old useRulesApi.ts with:
 * - Unified API client with authentication
 * - Standardized error handling
 * - Consistent query key patterns
 * - Optimistic updates and proper cache management
 */

import { RuleSchema, RuleZ } from 'libs/types/src/rule';
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
import { api } from './apiClient';
import { useQueryClient } from '@tanstack/react-query';

// API endpoints
const RULES_BASE = '/rules';

// Types for rule operations
export interface CreateRuleData extends Omit<RuleZ, 'id'> {}
export interface UpdateRuleData extends Partial<RuleZ> {}

// ====================
// STANDARDIZED HOOKS
// ====================

/**
 * Fetch all rules for an organization
 */
export function useRules(orgId: string) {
  return useEntityList<RuleZ>(
    'rules',
    orgId,
    RULES_BASE,
    {
      ...queryConfig.stable, // Rules are relatively stable
      select: (data) => z.array(RuleSchema).parse(data), // Validate response
    }
  );
}

/**
 * Fetch a single rule by ID
 */
export function useRule(orgId: string, ruleId: string) {
  return useEntity<RuleZ>(
    'rule',
    orgId,
    ruleId,
    `${RULES_BASE}/${ruleId}`,
    {
      ...queryConfig.stable,
      select: (data) => RuleSchema.parse(data), // Validate response
    }
  );
}

/**
 * Create a new rule with optimistic updates
 */
export function useCreateRule(orgId: string) {
  return useCreateEntity<RuleZ, CreateRuleData>(
    'rules',
    orgId,
    RULES_BASE,
    {
      onSuccess: (newRule) => {
        console.log('Rule created successfully:', newRule.id);
      },
      onError: (error) => {
        console.error('Failed to create rule:', error.message);
      },
    }
  );
}

/**
 * Update an existing rule with optimistic updates
 */
export function useUpdateRule(orgId: string, ruleId: string) {
  return useUpdateEntity<RuleZ, UpdateRuleData>(
    'rule',
    orgId,
    ruleId,
    `${RULES_BASE}/${ruleId}`,
    {
      onSuccess: (updatedRule) => {
        console.log('Rule updated successfully:', updatedRule.id);
      },
      onError: (error) => {
        console.error('Failed to update rule:', error.message);
      },
    }
  );
}

/**
 * Delete a rule with cache cleanup
 */
export function useDeleteRule(orgId: string, ruleId: string) {
  return useDeleteEntity(
    'rule',
    orgId,
    ruleId,
    `${RULES_BASE}/${ruleId}`,
    {
      onSuccess: () => {
        console.log('Rule deleted successfully');
      },
      onError: (error) => {
        console.error('Failed to delete rule:', error.message);
      },
    }
  );
}

// ====================
// SPECIALIZED HOOKS
// ====================

/**
 * Fetch rule version history
 */
export function useRuleVersions(orgId: string, ruleId: string) {
  return useStandardQuery(
    queryKeys.rules.versions(orgId, ruleId),
    () => api.get<any[]>(`${RULES_BASE}/${ruleId}/versions`, orgId),
    {
      enabled: !!orgId && !!ruleId,
      ...queryConfig.stable,
    }
  );
}

/**
 * Restore a rule to a previous version
 */
export function useRestoreRuleVersion(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useStandardMutation(
    ({ versionId }: { versionId: string }) => 
      api.post(`${RULES_BASE}/${ruleId}/restore`, { version_id: versionId }, orgId),
    {
      onSuccess: () => {
        // Invalidate all rule-related queries
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.rules.all(orgId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.rules.byId(orgId, ruleId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.rules.versions(orgId, ruleId) 
        });
        
        console.log('Rule version restored successfully');
      },
      onError: (error) => {
        console.error('Failed to restore rule version:', error.message);
      },
    }
  );
}

/**
 * Bulk operations for rules
 */
export function useBulkRuleOperations(orgId: string) {
  const queryClient = useQueryClient();

  const bulkDelete = useStandardMutation(
    (ruleIds: string[]) => 
      api.post(`${RULES_BASE}/bulk-delete`, { rule_ids: ruleIds }, orgId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.rules.all(orgId) 
        });
        console.log('Bulk delete completed successfully');
      },
      onError: (error) => {
        console.error('Failed to bulk delete rules:', error.message);
      },
    }
  );

  const bulkUpdate = useStandardMutation(
    (updates: { rule_id: string; data: UpdateRuleData }[]) => 
      api.post(`${RULES_BASE}/bulk-update`, { updates }, orgId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.rules.all(orgId) 
        });
        console.log('Bulk update completed successfully');
      },
      onError: (error) => {
        console.error('Failed to bulk update rules:', error.message);
      },
    }
  );

  return { bulkDelete, bulkUpdate };
}

/**
 * Search rules with debounced queries
 */
export function useSearchRules(orgId: string, searchTerm: string) {
  return useStandardQuery(
    queryKeys.entity('rules_search', orgId, searchTerm),
    () => api.get<RuleZ[]>(`${RULES_BASE}/search?q=${encodeURIComponent(searchTerm)}`, orgId),
    {
      enabled: !!orgId && searchTerm.length >= 2,
      staleTime: 5 * 60 * 1000, // 5 minutes for search results
      select: (data) => z.array(RuleSchema).parse(data),
    }
  );
}

/**
 * Get rule statistics and metrics
 */
export function useRuleMetrics(orgId: string) {
  return useStandardQuery(
    queryKeys.entity('rule_metrics', orgId),
    () => api.get<{
      total: number;
      active: number;
      inactive: number;
      lastUpdated: string;
    }>(`${RULES_BASE}/metrics`, orgId),
    {
      enabled: !!orgId,
      ...queryConfig.dashboard, // Metrics change moderately
    }
  );
}

// ====================
// CACHE UTILITIES
// ====================

/**
 * Prefetch rules for better UX
 */
export function usePrefetchRules() {
  const queryClient = useQueryClient();

  const prefetchRules = (orgId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.rules.all(orgId),
      queryFn: () => api.get<RuleZ[]>(RULES_BASE, orgId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchRule = (orgId: string, ruleId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.rules.byId(orgId, ruleId),
      queryFn: () => api.get<RuleZ>(`${RULES_BASE}/${ruleId}`, orgId),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { prefetchRules, prefetchRule };
} 