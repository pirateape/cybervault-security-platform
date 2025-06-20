// NOTE: Monorepo import path for Supabase client
import { supabase } from 'libs/data-access/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface RuleVersion {
  id: number;
  rule_id: number;
  version: number;
  content: any;
  created_at: string;
  created_by?: string;
}

function getSupabase() {
  if (!supabase) throw new Error('Supabase client not configured.');
  return supabase;
}

/**
 * useRuleVersions fetches version history for a rule.
 */
export function useRuleVersions(ruleId: number | null) {
  return useQuery<RuleVersion[]>({
    queryKey: ['ruleVersions', ruleId],
    queryFn: async () => {
      if (!ruleId) return [];
      const { data, error } = await getSupabase().rpc('get_rule_versions', {
        rule_id: ruleId,
      });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!ruleId,
    retry: 2,
  });
}

/**
 * useRestoreRuleVersion restores a previous version of a rule.
 */
export function useRestoreRuleVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ruleId,
      versionId,
    }: {
      ruleId: number;
      versionId: number;
    }) => {
      const { error } = await getSupabase().rpc('restore_rule_version', {
        rule_id: ruleId,
        version_id: versionId,
      });
      if (error) throw new Error(error.message);
      return { ruleId, versionId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['ruleVersions', variables.ruleId],
      });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
