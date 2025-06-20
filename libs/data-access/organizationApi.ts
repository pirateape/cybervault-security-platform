import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { Organization } from 'libs/types/src/organization';

const TABLE = 'organizations';

/**
 * Fetch all organizations for a given user (multi-tenant context).
 * @param userId User ID
 */
export function useOrganizations(userId?: string) {
  return useQuery<Organization[], Error>({
    queryKey: ['organizations', userId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Organization[];
    },
  });
}

/**
 * Fetch a single organization by orgId (tenant context).
 * @param orgId Organization (tenant) ID
 */
export function useOrganization(orgId: string) {
  return useQuery<Organization, Error>({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).select('*').eq('id', orgId).single();
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!orgId,
  });
}

/**
 * Create a new organization (tenant).
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation<Organization, Error, Partial<Organization>>({
    mutationFn: async (org) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).insert([org]).select().single();
      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/**
 * Update an organization (tenant context).
 * @param orgId Organization (tenant) ID
 */
export function useUpdateOrganization(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<Organization, Error, Partial<Organization>>({
    mutationFn: async (org) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).update(org).eq('id', orgId).select().single();
      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', orgId] });
    },
  });
}

/**
 * Delete an organization (tenant context).
 * @param orgId Organization (tenant) ID
 */
export function useDeleteOrganization(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase.from(TABLE).delete().eq('id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', orgId] });
    },
  });
}

export {}; 