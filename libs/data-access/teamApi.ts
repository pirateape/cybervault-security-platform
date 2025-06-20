import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabaseClient';
import { TeamMember } from 'libs/types/src/organization';

const TABLE = 'organization_memberships';

// List team members by org_id
export function useTeamMembers(orgId: string) {
  return useQuery<TeamMember[], Error>({
    queryKey: ['teamMembers', orgId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).select('*').eq('org_id', orgId);
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!orgId,
  });
}

// Invite team member
export function useInviteTeamMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation<TeamMember, Error, Partial<TeamMember>>({
    mutationFn: async (member) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).insert([{ ...member, org_id: orgId }]).select().single();
      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', orgId] });
    },
  });
}

// Update team member (role, status, etc.)
export function useUpdateTeamMember(orgId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation<TeamMember, Error, Partial<TeamMember>>({
    mutationFn: async (member) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data, error } = await supabase.from(TABLE).update(member).eq('id', memberId).eq('org_id', orgId).select().single();
      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', orgId] });
    },
  });
}

// Remove team member
export function useRemoveTeamMember(orgId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { error } = await supabase.from(TABLE).delete().eq('id', memberId).eq('org_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers', orgId] });
    },
  });
} 