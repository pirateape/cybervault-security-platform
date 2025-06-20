// NOTE: Monorepo import path for Supabase client
import { supabase } from 'libs/data-access/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface Rule {
  id: number;
  name: string;
  content: string;
}

function getSupabase() {
  if (!supabase) throw new Error('Supabase client not configured.');
  return supabase;
}

/**
 * useRules fetches the list of rules from Supabase.
 */
export function useRules() {
  return useQuery<Rule[]>({
    queryKey: ['rules'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('rules')
        .select('id, name, content');
      if (error) throw new Error(error.message);
      return data || [];
    },
    retry: 2,
  });
}

/**
 * useAddRule adds a new rule with optimistic update.
 */
export function useAddRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Omit<Rule, 'id'>) => {
      const { data, error } = await getSupabase()
        .from('rules')
        .insert([rule])
        .select();
      if (error) throw new Error(error.message);
      return data?.[0];
    },
    onMutate: async (newRule) => {
      await queryClient.cancelQueries({ queryKey: ['rules'] });
      const previousRules = queryClient.getQueryData<Rule[]>(['rules']);
      queryClient.setQueryData<Rule[]>(['rules'], (old = []) => [
        ...old,
        { ...newRule, id: Date.now() },
      ]);
      return { previousRules };
    },
    onError: (_err, _newRule, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(['rules'], context.previousRules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

/**
 * useUpdateRule updates a rule with optimistic update.
 */
export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Rule) => {
      const { data, error } = await getSupabase()
        .from('rules')
        .update(rule)
        .eq('id', rule.id)
        .select();
      if (error) throw new Error(error.message);
      return data?.[0];
    },
    onMutate: async (updatedRule) => {
      await queryClient.cancelQueries({ queryKey: ['rules'] });
      const previousRules = queryClient.getQueryData<Rule[]>(['rules']);
      queryClient.setQueryData<Rule[]>(['rules'], (old = []) =>
        old.map((r) => (r.id === updatedRule.id ? { ...r, ...updatedRule } : r))
      );
      return { previousRules };
    },
    onError: (_err, _updatedRule, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(['rules'], context.previousRules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

/**
 * useDeleteRule deletes a rule with optimistic update.
 */
export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await getSupabase().from('rules').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['rules'] });
      const previousRules = queryClient.getQueryData<Rule[]>(['rules']);
      queryClient.setQueryData<Rule[]>(['rules'], (old = []) =>
        old.filter((r) => r.id !== id)
      );
      return { previousRules };
    },
    onError: (_err, _id, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(['rules'], context.previousRules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
