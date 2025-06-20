/**
 * Re-export standardized Rules API hooks
 * 
 * This file maintains backwards compatibility while redirecting to the new
 * standardized data access patterns implemented in libs/data-access/rulesApi.ts
 */

// Re-export all hooks from the standardized implementation
export {
  useRules,
  useRule,
  useCreateRule,
  useUpdateRule,
  useDeleteRule,
  useRuleVersions,
  useRestoreRuleVersion,
  useBulkRuleOperations,
  useSearchRules,
  useRuleMetrics,
  usePrefetchRules,
} from '../data-access/rulesApi';

// Re-export types for backwards compatibility
export type {
  CreateRuleData,
  UpdateRuleData,
} from '../data-access/rulesApi';

// Re-export schema types from original source
export { RuleSchema, type RuleZ } from 'libs/types/src/rule';
