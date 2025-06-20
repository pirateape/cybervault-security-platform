import { useEffect, useRef } from 'react';
import { supabase } from 'libs/data-access/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';

/**
 * useSupabaseRealtime subscribes to Supabase Realtime changes for rules and audit_log tables.
 * On relevant events, it invalidates the React Query cache for rules and auditLog.
 * @param ruleId Optional ruleId to scope audit log updates
 */
export function useSupabaseRealtime(ruleId?: number | null) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!supabase) return;
    // Subscribe to rules table changes
    const rulesChannel = supabase
      .channel('rules-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rules' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['rules'] });
        }
      )
      .subscribe();
    // Subscribe to audit_log table changes (optionally scoped by ruleId)
    let auditChannel: any = null;
    if (ruleId) {
      auditChannel = supabase
        .channel('auditlog-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'audit', table: 'audit_log' },
          (payload) => {
            const newResourceId =
              payload.new && typeof payload.new === 'object'
                ? (payload.new as any).resource_id
                : undefined;
            const oldResourceId =
              payload.old && typeof payload.old === 'object'
                ? (payload.old as any).resource_id
                : undefined;
            if (newResourceId === ruleId || oldResourceId === ruleId) {
              queryClient.invalidateQueries({ queryKey: ['auditLog', ruleId] });
            }
          }
        )
        .subscribe();
    }
    // Cleanup
    return () => {
      if (supabase && rulesChannel) supabase.removeChannel(rulesChannel);
      if (supabase && auditChannel) supabase.removeChannel(auditChannel);
    };
  }, [supabase, queryClient, ruleId]);
}
