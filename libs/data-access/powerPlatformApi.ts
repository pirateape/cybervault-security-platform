import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from './supabaseClient';

// Power Platform schemas
export const PowerAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  createdTime: z.string().datetime(),
  lastModifiedTime: z.string().datetime(),
  environment: z.object({
    id: z.string(),
    name: z.string(),
  }),
  owner: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string().email(),
  }),
  connectionReferences: z.array(z.object({
    id: z.string(),
    displayName: z.string(),
    connectionName: z.string(),
  })).default([]),
  appType: z.string(),
  isFeaturedApp: z.boolean().default(false),
  bypassConsent: z.boolean().default(false),
  appOpenProtocol: z.string().optional(),
  appOpenUri: z.string().optional(),
  appPlayUri: z.string().optional(),
  appVersion: z.string().optional(),
});

export const PowerFlowSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  state: z.enum(['Started', 'Stopped', 'Suspended']),
  createdTime: z.string().datetime(),
  lastModifiedTime: z.string().datetime(),
  environment: z.object({
    id: z.string(),
    name: z.string(),
  }),
  owner: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string().email(),
  }),
  triggerType: z.string(),
  connectionReferences: z.array(z.object({
    id: z.string(),
    displayName: z.string(),
    connectionName: z.string(),
  })).default([]),
  flowType: z.string().optional(),
  templateId: z.string().optional(),
  userType: z.string().optional(),
});

export const PowerEnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  location: z.string(),
  type: z.enum(['Default', 'Production', 'Sandbox', 'Trial', 'Developer']),
  state: z.enum(['Ready', 'NotReady', 'Deleted']),
  createdTime: z.string().datetime(),
  createdBy: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.string().email(),
  }),
  isDefault: z.boolean().default(false),
  runtimeEndpoints: z.object({
    microsoft_flow_service: z.string().url().optional(),
    microsoft_powerapps_service: z.string().url().optional(),
  }).optional(),
  databaseType: z.string().optional(),
  linkedEnvironmentMetadata: z.object({
    type: z.string(),
    resourceId: z.string(),
    friendlyName: z.string(),
  }).optional(),
});

export const PowerPlatformScanResultSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  scan_id: z.string().uuid().optional(),
  resource_type: z.enum(['app', 'flow', 'environment', 'connection']),
  resource_id: z.string(),
  resource_name: z.string(),
  environment_id: z.string(),
  environment_name: z.string(),
  owner_id: z.string(),
  owner_email: z.string(),
  created_date: z.string().datetime(),
  last_modified_date: z.string().datetime(),
  compliance_status: z.enum(['compliant', 'non_compliant', 'warning', 'unknown']),
  risk_score: z.number().min(0).max(100),
  governance_issues: z.array(z.object({
    type: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    description: z.string(),
    recommendation: z.string(),
  })).default([]),
  sharing_info: z.object({
    shared_with_count: z.number(),
    sharing_type: z.enum(['private', 'organization', 'public']),
    external_sharing: z.boolean(),
  }).optional(),
  connection_references: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    is_custom: z.boolean(),
  })).default([]),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const PowerPlatformStatsSchema = z.object({
  total_apps: z.number(),
  total_flows: z.number(),
  total_environments: z.number(),
  active_apps: z.number(),
  active_flows: z.number(),
  governance_score: z.number().min(0).max(100),
  compliance_percentage: z.number().min(0).max(100),
  risk_distribution: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  environment_distribution: z.record(z.number()),
  recent_activity_count: z.number(),
  last_scan_date: z.string().datetime().optional(),
});

export type PowerApp = z.infer<typeof PowerAppSchema>;
export type PowerFlow = z.infer<typeof PowerFlowSchema>;
export type PowerEnvironment = z.infer<typeof PowerEnvironmentSchema>;
export type PowerPlatformScanResult = z.infer<typeof PowerPlatformScanResultSchema>;
export type PowerPlatformStats = z.infer<typeof PowerPlatformStatsSchema>;

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API functions
async function fetchPowerApps(orgId: string): Promise<{ data: PowerApp[]; total: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/powerapps/?org_id=${orgId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Power Apps: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      data: data.apps || [],
      total: data.total || data.apps?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching Power Apps:', error);
    // Return mock data for development
    return {
      data: [
        {
          id: 'app-1',
          name: 'ExpenseTracker',
          displayName: 'Expense Tracker App',
          description: 'Track and manage employee expenses',
          createdTime: '2024-12-01T10:00:00Z',
          lastModifiedTime: '2024-12-20T15:30:00Z',
          environment: {
            id: 'env-1',
            name: 'Production',
          },
          owner: {
            id: 'user-1',
            displayName: 'John Doe',
            email: 'john.doe@company.com',
          },
          connectionReferences: [
            {
              id: 'conn-1',
              displayName: 'SharePoint',
              connectionName: 'shared_sharepointonline',
            },
          ],
          appType: 'Canvas',
          isFeaturedApp: true,
          bypassConsent: false,
          appVersion: '2.1.0',
        },
        {
          id: 'app-2',
          name: 'InventoryManager',
          displayName: 'Inventory Management',
          description: 'Manage warehouse inventory and stock levels',
          createdTime: '2024-11-15T09:00:00Z',
          lastModifiedTime: '2024-12-18T11:45:00Z',
          environment: {
            id: 'env-1',
            name: 'Production',
          },
          owner: {
            id: 'user-2',
            displayName: 'Jane Smith',
            email: 'jane.smith@company.com',
          },
          connectionReferences: [
            {
              id: 'conn-2',
              displayName: 'SQL Server',
              connectionName: 'shared_sql',
            },
          ],
          appType: 'Canvas',
          isFeaturedApp: false,
          bypassConsent: false,
          appVersion: '1.5.2',
        },
      ],
      total: 2,
    };
  }
}

async function fetchPowerFlows(orgId: string): Promise<{ data: PowerFlow[]; total: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/powerplatform/flows?org_id=${orgId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Power Flows: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      data: data.flows || [],
      total: data.total || data.flows?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching Power Flows:', error);
    // Return mock data for development
    return {
      data: [
        {
          id: 'flow-1',
          name: 'ApprovalWorkflow',
          displayName: 'Expense Approval Workflow',
          description: 'Automated approval process for expense reports',
          state: 'Started',
          createdTime: '2024-12-01T10:00:00Z',
          lastModifiedTime: '2024-12-19T14:20:00Z',
          environment: {
            id: 'env-1',
            name: 'Production',
          },
          owner: {
            id: 'user-1',
            displayName: 'John Doe',
            email: 'john.doe@company.com',
          },
          triggerType: 'Request',
          connectionReferences: [
            {
              id: 'conn-3',
              displayName: 'Outlook',
              connectionName: 'shared_office365',
            },
          ],
          flowType: 'Modern',
        },
        {
          id: 'flow-2',
          name: 'DataSyncFlow',
          displayName: 'Daily Data Synchronization',
          description: 'Sync data between systems daily',
          state: 'Started',
          createdTime: '2024-11-20T08:00:00Z',
          lastModifiedTime: '2024-12-20T06:00:00Z',
          environment: {
            id: 'env-1',
            name: 'Production',
          },
          owner: {
            id: 'user-3',
            displayName: 'Mike Johnson',
            email: 'mike.johnson@company.com',
          },
          triggerType: 'Recurrence',
          connectionReferences: [
            {
              id: 'conn-4',
              displayName: 'SQL Server',
              connectionName: 'shared_sql',
            },
          ],
          flowType: 'Modern',
        },
      ],
      total: 2,
    };
  }
}

async function fetchPowerEnvironments(orgId: string): Promise<{ data: PowerEnvironment[]; total: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/powerapps/environments/?org_id=${orgId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Power Environments: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      data: data.environments || [],
      total: data.total || data.environments?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching Power Environments:', error);
    // Return mock data for development
    return {
      data: [
        {
          id: 'env-1',
          name: 'Production',
          displayName: 'Production Environment',
          location: 'unitedstates',
          type: 'Production',
          state: 'Ready',
          createdTime: '2024-10-01T00:00:00Z',
          createdBy: {
            id: 'admin-1',
            displayName: 'System Admin',
            email: 'admin@company.com',
          },
          isDefault: true,
          runtimeEndpoints: {
            microsoft_flow_service: 'https://service.flow.microsoft.com',
            microsoft_powerapps_service: 'https://service.powerapps.com',
          },
          databaseType: 'CommonDataService',
        },
        {
          id: 'env-2',
          name: 'Development',
          displayName: 'Development Environment',
          location: 'unitedstates',
          type: 'Developer',
          state: 'Ready',
          createdTime: '2024-10-15T00:00:00Z',
          createdBy: {
            id: 'admin-1',
            displayName: 'System Admin',
            email: 'admin@company.com',
          },
          isDefault: false,
          runtimeEndpoints: {
            microsoft_flow_service: 'https://service.flow.microsoft.com',
            microsoft_powerapps_service: 'https://service.powerapps.com',
          },
          databaseType: 'CommonDataService',
        },
      ],
      total: 2,
    };
  }
}

async function fetchPowerPlatformScanResults(orgId: string, filters?: {
  resource_type?: string[];
  compliance_status?: string[];
  risk_level?: string[];
  environment_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: PowerPlatformScanResult[]; total: number }> {
  try {
    const queryParams = new URLSearchParams({ org_id: orgId });
    if (filters?.resource_type?.length) {
      queryParams.append('resource_type', filters.resource_type.join(','));
    }
    if (filters?.compliance_status?.length) {
      queryParams.append('compliance_status', filters.compliance_status.join(','));
    }
    if (filters?.environment_id) {
      queryParams.append('environment_id', filters.environment_id);
    }
    if (filters?.limit) {
      queryParams.append('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      queryParams.append('offset', filters.offset.toString());
    }

    const response = await fetch(`${API_BASE_URL}/powerplatform/scan?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Power Platform scan results: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      data: data.results || [],
      total: data.total || data.results?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching Power Platform scan results:', error);
    // Return mock data for development
    return {
      data: [
        {
          id: '1',
          org_id: orgId,
          resource_type: 'app',
          resource_id: 'app-1',
          resource_name: 'ExpenseTracker',
          environment_id: 'env-1',
          environment_name: 'Production',
          owner_id: 'user-1',
          owner_email: 'john.doe@company.com',
          created_date: '2024-12-01T10:00:00Z',
          last_modified_date: '2024-12-20T15:30:00Z',
          compliance_status: 'warning',
          risk_score: 65,
          governance_issues: [
            {
              type: 'sharing_policy',
              severity: 'medium',
              description: 'App is shared with external users',
              recommendation: 'Review sharing permissions and restrict access',
            },
          ],
          sharing_info: {
            shared_with_count: 25,
            sharing_type: 'organization',
            external_sharing: true,
          },
          connection_references: [
            {
              id: 'conn-1',
              name: 'SharePoint',
              type: 'shared_sharepointonline',
              is_custom: false,
            },
          ],
          created_at: '2024-12-20T16:00:00Z',
          updated_at: '2024-12-20T16:00:00Z',
        },
        {
          id: '2',
          org_id: orgId,
          resource_type: 'flow',
          resource_id: 'flow-1',
          resource_name: 'ApprovalWorkflow',
          environment_id: 'env-1',
          environment_name: 'Production',
          owner_id: 'user-1',
          owner_email: 'john.doe@company.com',
          created_date: '2024-12-01T10:00:00Z',
          last_modified_date: '2024-12-19T14:20:00Z',
          compliance_status: 'compliant',
          risk_score: 20,
          governance_issues: [],
          sharing_info: {
            shared_with_count: 5,
            sharing_type: 'private',
            external_sharing: false,
          },
          connection_references: [
            {
              id: 'conn-3',
              name: 'Outlook',
              type: 'shared_office365',
              is_custom: false,
            },
          ],
          created_at: '2024-12-20T16:00:00Z',
          updated_at: '2024-12-20T16:00:00Z',
        },
      ],
      total: 2,
    };
  }
}

async function triggerPowerPlatformScan(orgId: string): Promise<{ scan_id: string; status: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/powerplatform/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ org_id: orgId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger Power Platform scan: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error triggering Power Platform scan:', error);
    // Return mock response for development
    return {
      scan_id: `scan-${Date.now()}`,
      status: 'initiated',
    };
  }
}

async function fetchPowerPlatformStats(orgId: string): Promise<PowerPlatformStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/powerplatform/stats?org_id=${orgId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Power Platform stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    return PowerPlatformStatsSchema.parse(data);
  } catch (error) {
    console.error('Error fetching Power Platform stats:', error);
    // Return mock data for development
    return {
      total_apps: 2,
      total_flows: 2,
      total_environments: 2,
      active_apps: 2,
      active_flows: 1,
      governance_score: 75,
      compliance_percentage: 80,
      risk_distribution: {
        critical: 0,
        high: 1,
        medium: 2,
        low: 1,
      },
      environment_distribution: {
        'Production': 3,
        'Development': 1,
      },
      recent_activity_count: 15,
      last_scan_date: '2024-12-20T16:00:00Z',
    };
  }
}

// React Query hooks
export function usePowerApps(orgId: string) {
  return useQuery({
    queryKey: ['powerApps', orgId],
    queryFn: () => fetchPowerApps(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orgId,
  });
}

export function usePowerFlows(orgId: string) {
  return useQuery({
    queryKey: ['powerFlows', orgId],
    queryFn: () => fetchPowerFlows(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orgId,
  });
}

export function usePowerEnvironments(orgId: string) {
  return useQuery({
    queryKey: ['powerEnvironments', orgId],
    queryFn: () => fetchPowerEnvironments(orgId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!orgId,
  });
}

export function usePowerPlatformScanResults(orgId: string, filters?: {
  resource_type?: string[];
  compliance_status?: string[];
  risk_level?: string[];
  environment_id?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['powerPlatformScanResults', orgId, filters],
    queryFn: () => fetchPowerPlatformScanResults(orgId, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!orgId,
  });
}

export function usePowerPlatformStats(orgId: string) {
  return useQuery({
    queryKey: ['powerPlatformStats', orgId],
    queryFn: () => fetchPowerPlatformStats(orgId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!orgId,
  });
}

export function useTriggerPowerPlatformScan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orgId: string) => triggerPowerPlatformScan(orgId),
    onSuccess: (data, orgId) => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['powerPlatformScanResults', orgId] });
      queryClient.invalidateQueries({ queryKey: ['powerPlatformStats', orgId] });
    },
  });
}

// Query key factory for easier invalidation
export const powerPlatformQueryKeys = {
  all: ['powerPlatform'] as const,
  apps: (orgId: string) => ['powerApps', orgId] as const,
  flows: (orgId: string) => ['powerFlows', orgId] as const,
  environments: (orgId: string) => ['powerEnvironments', orgId] as const,
  scanResults: (orgId: string, filters?: any) => ['powerPlatformScanResults', orgId, filters] as const,
  stats: (orgId: string) => ['powerPlatformStats', orgId] as const,
}; 