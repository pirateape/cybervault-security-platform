import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RuleSchema, RuleZ } from 'libs/types/src/rule';
import { z } from 'zod';

const API_BASE = '/api/rules';

// List all rules
export function useRules(orgId: string) {
  return useQuery<RuleZ[], Error>({
    queryKey: ['rules', orgId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/?org_id=${orgId}`);
      if (!res.ok) throw new Error('Failed to fetch rules');
      const data = await res.json();
      return z.array(RuleSchema).parse(data);
    },
  });
}

// Get a single rule
export function useRule(orgId: string, ruleId: string) {
  return useQuery<RuleZ, Error>({
    queryKey: ['rule', orgId, ruleId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${ruleId}?org_id=${orgId}`);
      if (!res.ok) throw new Error('Failed to fetch rule');
      const data = await res.json();
      return RuleSchema.parse(data);
    },
    enabled: !!orgId && !!ruleId,
  });
}

// Create a rule
export function useCreateRule(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<RuleZ, Error, Omit<RuleZ, 'id'>>({
    mutationFn: async (rule) => {
      const res = await fetch(`${API_BASE}/?org_id=${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (!res.ok) throw new Error('Failed to create rule');
      const data = await res.json();
      return RuleSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', orgId] });
    },
  });
}

// Update a rule
export function useUpdateRule(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();
  return useMutation<RuleZ, Error, RuleZ>({
    mutationFn: async (rule) => {
      const res = await fetch(`${API_BASE}/${ruleId}?org_id=${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      if (!res.ok) throw new Error('Failed to update rule');
      const data = await res.json();
      return RuleSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rule', orgId, ruleId] });
    },
  });
}

// Delete a rule
export function useDeleteRule(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/${ruleId}?org_id=${orgId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete rule');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rule', orgId, ruleId] });
    },
  });
}

/**
 * Fetches the version history for a rule.
 * @param orgId Organization ID
 * @param ruleId Rule ID
 */
export function useRuleVersions(orgId: string, ruleId: string) {
  return useQuery<any[], Error>({
    queryKey: ['ruleVersions', orgId, ruleId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${ruleId}/versions?org_id=${orgId}`);
      if (!res.ok) throw new Error('Failed to fetch rule versions');
      return await res.json();
    },
    enabled: !!orgId && !!ruleId,
  });
}

/**
 * Restores a rule to a previous version.
 * @param orgId Organization ID
 * @param ruleId Rule ID
 */
export function useRestoreRuleVersion(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { versionId: string }>({
    mutationFn: async ({ versionId }) => {
      const res = await fetch(`${API_BASE}/${ruleId}/restore?org_id=${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionId }),
      });
      if (!res.ok) throw new Error('Failed to restore rule version');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules', orgId] });
      queryClient.invalidateQueries({ queryKey: ['rule', orgId, ruleId] });
      queryClient.invalidateQueries({
        queryKey: ['ruleVersions', orgId, ruleId],
      });
    },
  });
}
