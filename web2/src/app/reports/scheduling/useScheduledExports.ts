import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { ScheduledExportJob, ScheduledExportJobInput } from '@/libs/types/scheduledExport';

// TODO: Define ScheduledExportJob and ScheduledExportJobInput types

const API_BASE = '/api/scheduled-exports';

export function useScheduledExports() {
  // Fetch all scheduled jobs for the current user
  const query = useQuery({
    queryKey: ['scheduled-exports'],
    queryFn: async () => {
      // TODO: Replace with real API call
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch scheduled exports');
      return res.json();
    },
  });
  return query;
}

export function useCreateScheduledExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data /*: ScheduledExportJobInput */) => {
      // TODO: Replace with real API call
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create scheduled export');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-exports'] });
    },
  });
}

export function useUpdateScheduledExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // TODO: Replace with real API call
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update scheduled export');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-exports'] });
    },
  });
}

export function useDeleteScheduledExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id /*: string */) => {
      // TODO: Replace with real API call
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete scheduled export');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-exports'] });
    },
  });
} 