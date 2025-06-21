import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';

// Enhanced schemas for advanced rule management
export const RuleVersionSchema = z.object({
  id: z.string(),
  rule_id: z.string(),
  version: z.number(),
  content: z.any(),
  created_at: z.string(),
  created_by: z.string().optional(),
  change_summary: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const RuleTestResultSchema = z.object({
  id: z.string(),
  rule_id: z.string(),
  test_data: z.any(),
  result: z.object({
    passed: z.boolean(),
    score: z.number().optional(),
    details: z.string().optional(),
    execution_time: z.number().optional(),
  }),
  created_at: z.string(),
});

export const RuleImpactAnalysisSchema = z.object({
  rule_id: z.string(),
  affected_systems: z.array(z.string()),
  impact_score: z.number(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  affected_users: z.number().optional(),
  compliance_frameworks: z.array(z.string()),
  recommendations: z.array(z.string()),
  estimated_effort: z.string().optional(),
});

export const RuleConfigurationSchema = z.object({
  id: z.string(),
  rule_id: z.string(),
  configuration: z.record(z.any()),
  dependencies: z.array(z.string()),
  validation_rules: z.array(z.object({
    field: z.string(),
    type: z.string(),
    required: z.boolean(),
    validation: z.string().optional(),
  })),
  metadata: z.record(z.any()).optional(),
});

export const RuleDependencySchema = z.object({
  id: z.string(),
  rule_id: z.string(),
  depends_on_rule_id: z.string(),
  dependency_type: z.enum(['prerequisite', 'conflict', 'enhancement']),
  description: z.string().optional(),
});

export type RuleVersion = z.infer<typeof RuleVersionSchema>;
export type RuleTestResult = z.infer<typeof RuleTestResultSchema>;
export type RuleImpactAnalysis = z.infer<typeof RuleImpactAnalysisSchema>;
export type RuleConfiguration = z.infer<typeof RuleConfigurationSchema>;
export type RuleDependency = z.infer<typeof RuleDependencySchema>;

// API endpoints
const ENHANCED_RULES_BASE = '/rules';

// Query keys factory
export const enhancedRulesQueryKeys = {
  all: ['enhanced-rules'] as const,
  versions: (orgId: string, ruleId: string) => [...enhancedRulesQueryKeys.all, 'versions', orgId, ruleId] as const,
  version: (orgId: string, ruleId: string, versionId: string) => [...enhancedRulesQueryKeys.versions(orgId, ruleId), versionId] as const,
  tests: (orgId: string, ruleId: string) => [...enhancedRulesQueryKeys.all, 'tests', orgId, ruleId] as const,
  impact: (orgId: string, ruleId: string) => [...enhancedRulesQueryKeys.all, 'impact', orgId, ruleId] as const,
  config: (orgId: string, ruleId: string) => [...enhancedRulesQueryKeys.all, 'config', orgId, ruleId] as const,
  dependencies: (orgId: string, ruleId: string) => [...enhancedRulesQueryKeys.all, 'dependencies', orgId, ruleId] as const,
};

/**
 * Get detailed version history for a rule with diff comparison
 */
export function useRuleVersionHistory(orgId: string, ruleId: string) {
  return useQuery({
    queryKey: enhancedRulesQueryKeys.versions(orgId, ruleId),
    queryFn: async () => {
      const response = await apiClient.get(`${ENHANCED_RULES_BASE}/${ruleId}/versions`, orgId);
      return z.array(RuleVersionSchema).parse(response);
    },
    enabled: !!orgId && !!ruleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get specific version details with content
 */
export function useRuleVersion(orgId: string, ruleId: string, versionId: string) {
  return useQuery({
    queryKey: enhancedRulesQueryKeys.version(orgId, ruleId, versionId),
    queryFn: async () => {
      const response = await apiClient.get(`${ENHANCED_RULES_BASE}/${ruleId}/versions/${versionId}`, orgId);
      return RuleVersionSchema.parse(response);
    },
    enabled: !!orgId && !!ruleId && !!versionId,
  });
}

/**
 * Compare two rule versions and get diff
 */
export function useCompareRuleVersions(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fromVersionId, toVersionId }: { fromVersionId: string; toVersionId: string }) => {
      const response = await apiClient.post(
        `${ENHANCED_RULES_BASE}/${ruleId}/versions/compare`,
        { from_version_id: fromVersionId, to_version_id: toVersionId },
        orgId
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.versions(orgId, ruleId),
      });
    },
  });
}

/**
 * Restore rule to a specific version
 */
export function useRestoreRuleToVersion(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ versionId, changeSummary }: { versionId: string; changeSummary?: string }) => {
      const response = await apiClient.post(
        `${ENHANCED_RULES_BASE}/${ruleId}/restore`,
        { version_id: versionId, change_summary: changeSummary },
        orgId
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.all,
      });
    },
  });
}

/**
 * Test rule with sample data
 */
export function useTestRule(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ testData, testType }: { testData: any; testType?: string }) => {
      const response = await apiClient.post(
        `${ENHANCED_RULES_BASE}/${ruleId}/test`,
        { test_data: testData, test_type: testType },
        orgId
      );
      return RuleTestResultSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.tests(orgId, ruleId),
      });
    },
  });
}

/**
 * Get rule test history
 */
export function useRuleTestHistory(orgId: string, ruleId: string) {
  return useQuery({
    queryKey: enhancedRulesQueryKeys.tests(orgId, ruleId),
    queryFn: async () => {
      const response = await apiClient.get(`${ENHANCED_RULES_BASE}/${ruleId}/tests`, orgId);
      return z.array(RuleTestResultSchema).parse(response);
    },
    enabled: !!orgId && !!ruleId,
  });
}

/**
 * Generate test data for rule
 */
export function useGenerateTestData(orgId: string, ruleId: string) {
  return useMutation({
    mutationFn: async ({ scenario, count }: { scenario: string; count?: number }) => {
      const response = await apiClient.post(
        `${ENHANCED_RULES_BASE}/${ruleId}/generate-test-data`,
        { scenario, count: count || 10 },
        orgId
      );
      return response;
    },
  });
}

/**
 * Analyze rule impact on systems and users
 */
export function useRuleImpactAnalysis(orgId: string, ruleId: string) {
  return useQuery({
    queryKey: enhancedRulesQueryKeys.impact(orgId, ruleId),
    queryFn: async () => {
      const response = await apiClient.get(`${ENHANCED_RULES_BASE}/${ruleId}/impact-analysis`, orgId);
      return RuleImpactAnalysisSchema.parse(response);
    },
    enabled: !!orgId && !!ruleId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Perform impact analysis for rule changes
 */
export function useAnalyzeRuleImpact(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ newContent, changeType }: { newContent: any; changeType: string }) => {
      const response = await apiClient.post(
        `${ENHANCED_RULES_BASE}/${ruleId}/analyze-impact`,
        { new_content: newContent, change_type: changeType },
        orgId
      );
      return RuleImpactAnalysisSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.impact(orgId, ruleId),
      });
    },
  });
}

/**
 * Get rule configuration schema
 */
export function useRuleConfiguration(orgId: string, ruleId: string) {
  return useQuery({
    queryKey: enhancedRulesQueryKeys.config(orgId, ruleId),
    queryFn: async () => {
      const response = await apiClient.get(`${ENHANCED_RULES_BASE}/${ruleId}/configuration`, orgId);
      return RuleConfigurationSchema.parse(response);
    },
    enabled: !!orgId && !!ruleId,
  });
}

/**
 * Update rule configuration
 */
export function useUpdateRuleConfiguration(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configuration: Partial<RuleConfiguration>) => {
      const response = await apiClient.put(
        `${ENHANCED_RULES_BASE}/${ruleId}/configuration`,
        configuration,
        orgId
      );
      return RuleConfigurationSchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.config(orgId, ruleId),
      });
    },
  });
}

/**
 * Validate rule configuration
 */
export function useValidateRuleConfiguration(orgId: string, ruleId: string) {
  return useMutation({
    mutationFn: async (configuration: any) => {
      const response = await apiClient.post(
        `${ENHANCED_RULES_BASE}/${ruleId}/validate-configuration`,
        { configuration },
        orgId
      );
      return response;
    },
  });
}

/**
 * Get rule dependencies
 */
export function useRuleDependencies(orgId: string, ruleId: string) {
  return useQuery({
    queryKey: enhancedRulesQueryKeys.dependencies(orgId, ruleId),
    queryFn: async () => {
      const response = await apiClient.get(`${ENHANCED_RULES_BASE}/${ruleId}/dependencies`, orgId);
      return z.array(RuleDependencySchema).parse(response);
    },
    enabled: !!orgId && !!ruleId,
  });
}

/**
 * Add rule dependency
 */
export function useAddRuleDependency(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependency: Omit<RuleDependency, 'id'>) => {
      const response = await apiClient.post(
        `${ENHANCED_RULES_BASE}/${ruleId}/dependencies`,
        dependency,
        orgId
      );
      return RuleDependencySchema.parse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.dependencies(orgId, ruleId),
      });
    },
  });
}

/**
 * Remove rule dependency
 */
export function useRemoveRuleDependency(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dependencyId: string) => {
      await apiClient.delete(`${ENHANCED_RULES_BASE}/${ruleId}/dependencies/${dependencyId}`, orgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.dependencies(orgId, ruleId),
      });
    },
  });
}

/**
 * Get rule templates for configuration wizard
 */
export function useRuleTemplates() {
  return useQuery({
    queryKey: ['rule-templates'],
    queryFn: async () => {
      const response = await apiClient.get('/rule-templates');
      return response;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Create rule from template
 */
export function useCreateRuleFromTemplate(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, customization }: { templateId: string; customization: any }) => {
      const response = await apiClient.post(
        '/rules/from-template',
        { template_id: templateId, customization },
        orgId
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.all,
      });
    },
  });
}

/**
 * Bulk operations for rules
 */
export function useBulkRuleOperations(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ operation, ruleIds, parameters }: { 
      operation: string; 
      ruleIds: string[]; 
      parameters?: any 
    }) => {
      const response = await apiClient.post(
        '/rules/bulk-operations',
        { operation, rule_ids: ruleIds, parameters },
        orgId
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: enhancedRulesQueryKeys.all,
      });
    },
  });
} 