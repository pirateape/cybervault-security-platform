// libs/data-access/reportApi.ts
// Mock report API for TenantReports widget

import { useQuery } from '@tanstack/react-query';

export interface Report {
  id: string;
  name: string;
  description: string;
  exportUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for development
const mockReports: Report[] = [
  {
    id: '1',
    name: 'Compliance Report',
    description: 'Monthly compliance status and recommendations',
    exportUrl: '/api/reports/compliance/export',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Security Assessment',
    description: 'Security posture analysis and risk assessment',
    exportUrl: '/api/reports/security/export',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
  },
  {
    id: '3',
    name: 'Audit Trail',
    description: 'Complete audit trail for the current period',
    exportUrl: '/api/reports/audit/export',
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T09:15:00Z',
  },
];

// Simulated API call
async function fetchTenantReports(orgId: string): Promise<Report[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, this would make an HTTP request
  // return fetch(`/api/organizations/${orgId}/reports`).then(res => res.json());
  
  // Return mock data
  return mockReports;
}

// React Query hook for fetching tenant reports
export function useTenantReports(orgId: string) {
  return useQuery({
    queryKey: ['tenantReports', orgId],
    queryFn: () => fetchTenantReports(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orgId,
  });
}


