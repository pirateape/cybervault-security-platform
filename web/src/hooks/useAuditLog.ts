import { supabase } from 'libs/data-access/supabaseClient';
import { useQuery } from '@tanstack/react-query';

export interface AuditLogEntry {
  id: number;
  user_id: string;
  event_type: string;
  resource: string;
  outcome: string;
  metadata: any;
  created_at: string;
}

function getSupabase() {
  if (!supabase) throw new Error('Supabase client not configured.');
  return supabase;
}

/**
 * useAuditLog fetches the audit log for a rule.
 */
export function useAuditLog(ruleId: number | null) {
  return useQuery<AuditLogEntry[]>({
    queryKey: ['auditLog', ruleId],
    queryFn: async () => {
      if (!ruleId) return [];
      const { data, error } = await getSupabase()
        .from('audit_log')
        .select('*')
        .eq('resource_id', ruleId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!ruleId,
    retry: 2,
  });
}
