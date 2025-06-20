import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabaseClient';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  event_type: string;
  resource?: string;
  resource_id?: string;
  outcome?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  hash?: string;
  prev_hash?: string;
  metadata?: any;
  created_at: string;
}

export interface AuditLogFilter {
  event_type?: string;
  user_id?: string;
  resource?: string;
  outcome?: string;
  from?: string; // ISO date
  to?: string; // ISO date
  limit?: number;
  offset?: number;
}

export function useAuditLogs(filter: AuditLogFilter = {}) {
  return useQuery<AuditLogEntry[], Error>({
    queryKey: ['auditLogs', filter],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      let query = supabase.from('audit_log').select('*');
      if (filter.event_type) query = query.eq('event_type', filter.event_type);
      if (filter.user_id) query = query.eq('user_id', filter.user_id);
      if (filter.resource) query = query.eq('resource', filter.resource);
      if (filter.from) query = query.gte('timestamp', filter.from);
      if (filter.to) query = query.lte('timestamp', filter.to);
      if (filter.limit) query = query.limit(filter.limit);
      if (filter.offset)
        query = query.range(
          filter.offset,
          (filter.offset || 0) + (filter.limit || 20) - 1
        );
      query = query.order('timestamp', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLogEntry[];
    },
  });
}

export async function logAuditEvent(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash' | 'prev_hash'>
) {
  if (!supabase) throw new Error('Supabase client not initialized');
  // timestamp, id, hash, prev_hash are handled by DB/trigger
  const { error } = await supabase.from('audit_log').insert([entry]);
  if (error) throw error;
}
