import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { supabase } from 'libs/data-access/supabaseClient';
import type { DashboardWidget } from '../types/widget';

interface UseDashboardLayoutPersistenceOptions {
  orgId: string;
  userId: string;
  initialWidgets: DashboardWidget[];
}

const LOCAL_STORAGE_KEY = (orgId: string, userId: string) => `dashboard_layout_${orgId}_${userId}`;

/**
 * Best-practice hook for dashboard layout persistence (Supabase + localStorage + react-query)
 * @param orgId Organization ID (tenant)
 * @param userId User ID
 * @param initialWidgets Initial widget state (fallback)
 */
export function useDashboardLayoutPersistence({ orgId, userId, initialWidgets }: UseDashboardLayoutPersistenceOptions) {
  const queryClient = useQueryClient();

  // Fetch layout from Supabase or localStorage
  const {
    data: widgets,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardWidget[], Error>({
    queryKey: ['dashboardLayout', orgId, userId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('layout')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found
      if (data && data.layout) return data.layout as DashboardWidget[];
      // Fallback to localStorage
      const local = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY(orgId, userId)) : null;
      if (local) return JSON.parse(local);
      return initialWidgets;
    },
  });

  // Save layout to Supabase and localStorage
  const mutation = useMutation({
    mutationFn: async (newWidgets: DashboardWidget[]) => {
      if (!supabase) throw new Error('Supabase not initialized');
      // Upsert layout
      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          org_id: orgId,
          user_id: userId,
          layout: newWidgets,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      // LocalStorage for instant UX
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY(orgId, userId), JSON.stringify(newWidgets));
      }
      // Invalidate query
      queryClient.invalidateQueries({ queryKey: ['dashboardLayout', orgId, userId] });
    },
  });

  // Set widgets (update state and persist)
  const setWidgets = useCallback(
    (newWidgets: DashboardWidget[]) => {
      mutation.mutate(newWidgets);
    },
    [mutation]
  );

  // On mount, ensure localStorage is hydrated if Supabase is empty
  useEffect(() => {
    if (widgets && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY(orgId, userId), JSON.stringify(widgets));
    }
  }, [widgets, orgId, userId]);

  return {
    widgets: widgets ?? initialWidgets,
    setWidgets,
    saveLayout: mutation.mutate,
    isLoading: isLoading || mutation.isPending,
    error,
    refetch,
  };
} 