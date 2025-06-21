import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from './apiClient';

// ============================================================================
// SCHEMAS & TYPES
// ============================================================================

// API Key Management Schemas
export const ApiKeySchema = z.object({
  id: z.string(),
  label: z.string(),
  key_hash: z.string(),
  org_id: z.string(),
  role: z.enum(['admin', 'editor', 'viewer', 'api_user']),
  is_active: z.boolean(),
  created_at: z.string(),
  last_used_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  usage_count: z.number(),
  rate_limit: z.number(),
  permissions: z.array(z.string()),
  description: z.string().optional(),
});

export const CreateApiKeySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  role: z.enum(['admin', 'editor', 'viewer', 'api_user']),
  expires_at: z.string().nullable(),
  rate_limit: z.number().min(1).max(10000),
  permissions: z.array(z.string()),
  description: z.string().optional(),
});

export const ApiKeyUsageSchema = z.object({
  api_key_id: z.string(),
  timestamp: z.string(),
  endpoint: z.string(),
  method: z.string(),
  status_code: z.number(),
  response_time_ms: z.number(),
  request_size_bytes: z.number(),
  response_size_bytes: z.number(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
});

// API Monitoring Schemas
export const ApiHealthSchema = z.object({
  endpoint: z.string(),
  status: z.enum(['healthy', 'degraded', 'down']),
  response_time_ms: z.number(),
  success_rate: z.number(),
  error_rate: z.number(),
  last_check: z.string(),
  uptime_percentage: z.number(),
});

export const ApiMetricsSchema = z.object({
  total_requests: z.number(),
  successful_requests: z.number(),
  failed_requests: z.number(),
  average_response_time: z.number(),
  p95_response_time: z.number(),
  p99_response_time: z.number(),
  requests_per_minute: z.number(),
  error_rate: z.number(),
  uptime_percentage: z.number(),
  timestamp: z.string(),
});

export const RateLimitStatusSchema = z.object({
  api_key_id: z.string(),
  current_usage: z.number(),
  limit: z.number(),
  reset_time: z.string(),
  remaining: z.number(),
  percentage_used: z.number(),
});

// API Usage Analytics Schemas
export const UsageStatsSchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month']),
  timestamp: z.string(),
  total_requests: z.number(),
  unique_api_keys: z.number(),
  total_data_transferred_mb: z.number(),
  top_endpoints: z.array(z.object({
    endpoint: z.string(),
    requests: z.number(),
    percentage: z.number(),
  })),
  top_api_keys: z.array(z.object({
    api_key_id: z.string(),
    label: z.string(),
    requests: z.number(),
    percentage: z.number(),
  })),
  error_breakdown: z.array(z.object({
    status_code: z.number(),
    count: z.number(),
    percentage: z.number(),
  })),
});

export const CostTrackingSchema = z.object({
  api_key_id: z.string(),
  period: z.string(),
  total_requests: z.number(),
  cost_per_request: z.number(),
  total_cost: z.number(),
  data_transfer_gb: z.number(),
  data_transfer_cost: z.number(),
  estimated_monthly_cost: z.number(),
});

// API Documentation Schemas
export const ApiEndpointSchema = z.object({
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  summary: z.string(),
  description: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
    example: z.any().optional(),
  })),
  responses: z.array(z.object({
    status_code: z.number(),
    description: z.string(),
    schema: z.any().optional(),
  })),
  examples: z.array(z.object({
    name: z.string(),
    request: z.any(),
    response: z.any(),
  })),
  rate_limit: z.number(),
  authentication_required: z.boolean(),
  permissions_required: z.array(z.string()),
});

export const ApiVersionSchema = z.object({
  version: z.string(),
  status: z.enum(['active', 'deprecated', 'retired']),
  release_date: z.string(),
  deprecation_date: z.string().nullable(),
  retirement_date: z.string().nullable(),
  changelog: z.array(z.string()),
  endpoints: z.array(ApiEndpointSchema),
});

// Type exports
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type ApiKeyUsage = z.infer<typeof ApiKeyUsageSchema>;
export type ApiHealth = z.infer<typeof ApiHealthSchema>;
export type ApiMetrics = z.infer<typeof ApiMetricsSchema>;
export type RateLimitStatus = z.infer<typeof RateLimitStatusSchema>;
export type UsageStats = z.infer<typeof UsageStatsSchema>;
export type CostTracking = z.infer<typeof CostTrackingSchema>;
export type ApiEndpoint = z.infer<typeof ApiEndpointSchema>;
export type ApiVersion = z.infer<typeof ApiVersionSchema>;

// ============================================================================
// API KEY MANAGEMENT HOOKS (Task 4.2.1)
// ============================================================================

export const useApiKeys = (orgId: string) => {
  return useQuery({
    queryKey: ['api-keys', orgId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/keys?org_id=${orgId}`);
      return z.array(ApiKeySchema).parse(response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useApiKey = (keyId: string) => {
  return useQuery({
    queryKey: ['api-key', keyId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/keys/${keyId}`);
      return ApiKeySchema.parse(response);
    },
    enabled: !!keyId,
  });
};

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateApiKey & { org_id: string }) => {
      const response = await apiClient.post('/api/keys', data);
      return ApiKeySchema.parse(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', variables.org_id] });
    },
  });
};

export const useUpdateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ keyId, data }: { keyId: string; data: Partial<CreateApiKey> }) => {
      const response = await apiClient.put(`/api/keys/${keyId}`, data);
      return ApiKeySchema.parse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-key', data.id] });
      queryClient.invalidateQueries({ queryKey: ['api-keys', data.org_id] });
    },
  });
};

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (keyId: string) => {
      await apiClient.delete(`/api/keys/${keyId}`);
    },
    onSuccess: (_, keyId) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      queryClient.removeQueries({ queryKey: ['api-key', keyId] });
    },
  });
};

export const useRotateApiKey = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (keyId: string) => {
      const response = await apiClient.post(`/api/keys/${keyId}/rotate`);
      return ApiKeySchema.parse(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-key', data.id] });
      queryClient.invalidateQueries({ queryKey: ['api-keys', data.org_id] });
    },
  });
};

export const useApiKeyUsage = (keyId: string, timeRange: string = '24h') => {
  return useQuery({
    queryKey: ['api-key-usage', keyId, timeRange],
    queryFn: async () => {
      const response = await apiClient.get(`/api/keys/${keyId}/usage?range=${timeRange}`);
      return z.array(ApiKeyUsageSchema).parse(response);
    },
    enabled: !!keyId,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// API MONITORING HOOKS (Task 4.2.2)
// ============================================================================

export const useApiHealth = () => {
  return useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await apiClient.get('/api/health/endpoints');
      return z.array(ApiHealthSchema).parse(response);
    },
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

export const useApiMetrics = (timeRange: string = '1h') => {
  return useQuery({
    queryKey: ['api-metrics', timeRange],
    queryFn: async () => {
      const response = await apiClient.get(`/api/metrics?range=${timeRange}`);
      return z.array(ApiMetricsSchema).parse(response);
    },
    refetchInterval: 60 * 1000, // 1 minute
  });
};

export const useRateLimitStatus = (orgId: string) => {
  return useQuery({
    queryKey: ['rate-limit-status', orgId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/rate-limits?org_id=${orgId}`);
      return z.array(RateLimitStatusSchema).parse(response);
    },
    refetchInterval: 30 * 1000, // 30 seconds
  });
};

export const useUpdateRateLimit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ keyId, limit }: { keyId: string; limit: number }) => {
      const response = await apiClient.put(`/api/keys/${keyId}/rate-limit`, { limit });
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['api-key', variables.keyId] });
      queryClient.invalidateQueries({ queryKey: ['rate-limit-status'] });
    },
  });
};

// ============================================================================
// API USAGE ANALYTICS HOOKS (Task 4.2.3)
// ============================================================================

export const useUsageStats = (orgId: string, period: 'hour' | 'day' | 'week' | 'month' = 'day') => {
  return useQuery({
    queryKey: ['usage-stats', orgId, period],
    queryFn: async () => {
      const response = await apiClient.get(`/api/usage/stats?org_id=${orgId}&period=${period}`);
      return z.array(UsageStatsSchema).parse(response.data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCostTracking = (orgId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['cost-tracking', orgId, period],
    queryFn: async () => {
      const response = await apiClient.get(`/api/usage/costs?org_id=${orgId}&period=${period}`);
      return z.array(CostTrackingSchema).parse(response.data);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUsageForecast = (orgId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['usage-forecast', orgId, days],
    queryFn: async () => {
      const response = await apiClient.get(`/api/usage/forecast?org_id=${orgId}&days=${days}`);
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useExportUsageReport = () => {
  return useMutation({
    mutationFn: async ({ orgId, format, dateRange }: { 
      orgId: string; 
      format: 'csv' | 'pdf' | 'excel'; 
      dateRange: { start: string; end: string } 
    }) => {
      const response = await apiClient.post('/api/usage/export', {
        org_id: orgId,
        format,
        date_range: dateRange,
      });
      return response.data;
    },
  });
};

// ============================================================================
// API DOCUMENTATION HOOKS (Task 4.2.4)
// ============================================================================

export const useApiVersions = () => {
  return useQuery({
    queryKey: ['api-versions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/docs/versions');
      return z.array(ApiVersionSchema).parse(response.data);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useApiDocumentation = (version: string = 'latest') => {
  return useQuery({
    queryKey: ['api-documentation', version],
    queryFn: async () => {
      const response = await apiClient.get(`/api/docs/${version}`);
      return ApiVersionSchema.parse(response.data);
    },
    enabled: !!version,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useTestApiEndpoint = () => {
  return useMutation({
    mutationFn: async ({ 
      endpoint, 
      method, 
      parameters, 
      headers 
    }: { 
      endpoint: string; 
      method: string; 
      parameters?: any; 
      headers?: Record<string, string> 
    }) => {
      const response = await apiClient.post('/api/docs/test', {
        endpoint,
        method,
        parameters,
        headers,
      });
      return response.data;
    },
  });
};

export const useGenerateCodeExample = () => {
  return useMutation({
    mutationFn: async ({ 
      endpoint, 
      method, 
      language 
    }: { 
      endpoint: string; 
      method: string; 
      language: 'javascript' | 'python' | 'curl' | 'php' | 'go' 
    }) => {
      const response = await apiClient.post('/api/docs/code-examples', {
        endpoint,
        method,
        language,
      });
      return response.data;
    },
  });
};

// ============================================================================
// COMBINED DASHBOARD HOOKS
// ============================================================================

export const useExternalApiDashboard = (orgId: string) => {
  const apiKeys = useApiKeys(orgId);
  const apiHealth = useApiHealth();
  const apiMetrics = useApiMetrics('24h');
  const usageStats = useUsageStats(orgId, 'day');
  const costTracking = useCostTracking(orgId, 'month');

  return {
    apiKeys,
    apiHealth,
    apiMetrics,
    usageStats,
    costTracking,
    isLoading: apiKeys.isLoading || apiHealth.isLoading || apiMetrics.isLoading,
    error: apiKeys.error || apiHealth.error || apiMetrics.error,
  };
}; 