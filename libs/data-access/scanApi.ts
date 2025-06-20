import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from './supabaseClient';

// Scan-related schemas
export const ScanStatus = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'paused']);
export const ScanType = z.enum(['compliance', 'security', 'vulnerability', 'configuration', 'custom']);
export const ScanPriority = z.enum(['low', 'medium', 'high', 'critical']);

export const ScanTargetSchema = z.object({
  type: z.enum(['domain', 'ip_range', 'url', 'file', 'repository']),
  value: z.string(),
  description: z.string().optional(),
});

export const ScanConfigSchema = z.object({
  scan_type: ScanType,
  targets: z.array(ScanTargetSchema),
  priority: ScanPriority.default('medium'),
  schedule: z.object({
    enabled: z.boolean().default(false),
    cron_expression: z.string().optional(),
    timezone: z.string().default('UTC'),
  }).optional(),
  options: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const ScanSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  scan_type: ScanType,
  status: ScanStatus,
  priority: ScanPriority,
  config: ScanConfigSchema,
  progress: z.number().min(0).max(100).default(0),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  duration_seconds: z.number().nullable(),
  results_count: z.number().default(0),
  findings_count: z.number().default(0),
  critical_findings: z.number().default(0),
  high_findings: z.number().default(0),
  medium_findings: z.number().default(0),
  low_findings: z.number().default(0),
  error_message: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ScanResultSchema = z.object({
  id: z.string().uuid(),
  scan_id: z.string().uuid(),
  finding_id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
  category: z.string(),
  target: z.string(),
  evidence: z.record(z.any()).optional(),
  remediation: z.string().optional(),
  references: z.array(z.string()).default([]),
  compliance_frameworks: z.array(z.string()).default([]),
  status: z.enum(['open', 'acknowledged', 'resolved', 'false_positive']).default('open'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ScanTemplateSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  config: ScanConfigSchema,
  is_default: z.boolean().default(false),
  usage_count: z.number().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Scan = z.infer<typeof ScanSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;
export type ScanTemplate = z.infer<typeof ScanTemplateSchema>;
export type ScanConfig = z.infer<typeof ScanConfigSchema>;
export type ScanTarget = z.infer<typeof ScanTargetSchema>;

// Enhanced progress tracking and analytics schemas
export const ScanProgressSchema = z.object({
  id: z.string().uuid(),
  scan_id: z.string().uuid(),
  progress: z.number().min(0).max(100),
  current_stage: z.string(),
  stages_completed: z.number(),
  total_stages: z.number(),
  estimated_remaining_seconds: z.number().nullable(),
  throughput_per_second: z.number().nullable(),
  last_update: z.string().datetime(),
  error_count: z.number().default(0),
  warning_count: z.number().default(0),
});

export const ScanHistoryAnalyticsSchema = z.object({
  scan_id: z.string().uuid(),
  scan_type: ScanType,
  duration_seconds: z.number(),
  success_rate: z.number().min(0).max(1),
  findings_count: z.number(),
  resource_usage: z.object({
    cpu_avg: z.number(),
    memory_avg: z.number(),
    disk_io: z.number(),
    network_io: z.number(),
  }),
  completed_at: z.string().datetime(),
  week_of_year: z.number(),
  month: z.number(),
  quarter: z.number(),
});

export const ScanTrendAnalysisSchema = z.object({
  scan_type: ScanType,
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  trend_data: z.array(z.object({
    date: z.string().datetime(),
    avg_duration: z.number(),
    success_rate: z.number(),
    findings_count: z.number(),
    scan_volume: z.number(),
  })),
  forecast: z.array(z.object({
    date: z.string().datetime(),
    predicted_duration: z.number(),
    confidence_interval: z.tuple([z.number(), z.number()]),
  })),
});

export const ScanOptimizationRecommendationSchema = z.object({
  id: z.string().uuid(),
  scan_type: ScanType,
  category: z.enum(['performance', 'reliability', 'resource_optimization', 'scheduling']),
  title: z.string(),
  description: z.string(),
  impact_score: z.number().min(1).max(10),
  effort_level: z.enum(['low', 'medium', 'high']),
  estimated_improvement: z.string(),
  implementation_steps: z.array(z.string()),
  based_on_data: z.object({
    scans_analyzed: z.number(),
    date_range: z.tuple([z.string().datetime(), z.string().datetime()]),
    key_metrics: z.record(z.any()),
  }),
  created_at: z.string().datetime(),
});

export type ScanProgress = z.infer<typeof ScanProgressSchema>;
export type ScanHistoryAnalytics = z.infer<typeof ScanHistoryAnalyticsSchema>;
export type ScanTrendAnalysis = z.infer<typeof ScanTrendAnalysisSchema>;
export type ScanOptimizationRecommendation = z.infer<typeof ScanOptimizationRecommendationSchema>;

// API functions
async function fetchScans(orgId: string, filters?: {
  status?: string[];
  scan_type?: string[];
  priority?: string[];
  limit?: number;
  offset?: number;
}): Promise<{ data: Scan[]; total: number }> {
  if (!supabase) {
    // Mock data for development
    const mockScans: Scan[] = [
      {
        id: '1',
        org_id: orgId,
        user_id: '1',
        name: 'Weekly Compliance Scan',
        description: 'Automated compliance scan for SOC 2 requirements',
        scan_type: 'compliance',
        status: 'completed',
        priority: 'high',
        config: {
          scan_type: 'compliance',
          targets: [{ type: 'domain', value: 'example.com' }],
          priority: 'high',
        },
        progress: 100,
        started_at: '2024-12-20T10:00:00Z',
        completed_at: '2024-12-20T10:30:00Z',
        duration_seconds: 1800,
        results_count: 25,
        findings_count: 8,
        critical_findings: 1,
        high_findings: 2,
        medium_findings: 3,
        low_findings: 2,
        error_message: null,
        created_at: '2024-12-20T09:55:00Z',
        updated_at: '2024-12-20T10:30:00Z',
      },
      {
        id: '2',
        org_id: orgId,
        user_id: '1',
        name: 'Security Vulnerability Assessment',
        description: 'Comprehensive security scan of web applications',
        scan_type: 'security',
        status: 'running',
        priority: 'critical',
        config: {
          scan_type: 'security',
          targets: [
            { type: 'url', value: 'https://app.example.com' },
            { type: 'url', value: 'https://api.example.com' },
          ],
          priority: 'critical',
        },
        progress: 65,
        started_at: '2024-12-20T11:00:00Z',
        completed_at: null,
        duration_seconds: null,
        results_count: 0,
        findings_count: 0,
        critical_findings: 0,
        high_findings: 0,
        medium_findings: 0,
        low_findings: 0,
        error_message: null,
        created_at: '2024-12-20T10:55:00Z',
        updated_at: '2024-12-20T11:15:00Z',
      },
      {
        id: '3',
        org_id: orgId,
        user_id: '2',
        name: 'Infrastructure Configuration Review',
        description: 'Review of cloud infrastructure configurations',
        scan_type: 'configuration',
        status: 'pending',
        priority: 'medium',
        config: {
          scan_type: 'configuration',
          targets: [{ type: 'domain', value: 'infrastructure.example.com' }],
          priority: 'medium',
        },
        progress: 0,
        started_at: null,
        completed_at: null,
        duration_seconds: null,
        results_count: 0,
        findings_count: 0,
        critical_findings: 0,
        high_findings: 0,
        medium_findings: 0,
        low_findings: 0,
        error_message: null,
        created_at: '2024-12-20T12:00:00Z',
        updated_at: '2024-12-20T12:00:00Z',
      },
    ];

    let filteredScans = mockScans;
    
    if (filters?.status?.length) {
      filteredScans = filteredScans.filter(scan => filters.status!.includes(scan.status));
    }
    
    if (filters?.scan_type?.length) {
      filteredScans = filteredScans.filter(scan => filters.scan_type!.includes(scan.scan_type));
    }
    
    if (filters?.priority?.length) {
      filteredScans = filteredScans.filter(scan => filters.priority!.includes(scan.priority));
    }

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paginatedScans = filteredScans.slice(offset, offset + limit);

    return { data: paginatedScans, total: filteredScans.length };
  }

  let query = supabase.from('scans').select('*', { count: 'exact' }).eq('org_id', orgId);
  
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  
  if (filters?.scan_type?.length) {
    query = query.in('scan_type', filters.scan_type);
  }
  
  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return { data: data as Scan[], total: count || 0 };
}

async function fetchScan(scanId: string): Promise<Scan> {
  if (!supabase) {
    // Mock data
    return {
      id: scanId,
      org_id: '1',
      user_id: '1',
      name: 'Sample Scan',
      description: 'Sample scan for testing',
      scan_type: 'compliance',
      status: 'completed',
      priority: 'medium',
      config: {
        scan_type: 'compliance',
        targets: [{ type: 'domain', value: 'example.com' }],
        priority: 'medium',
      },
      progress: 100,
      started_at: '2024-12-20T10:00:00Z',
      completed_at: '2024-12-20T10:30:00Z',
      duration_seconds: 1800,
      results_count: 15,
      findings_count: 5,
      critical_findings: 0,
      high_findings: 1,
      medium_findings: 2,
      low_findings: 2,
      error_message: null,
      created_at: '2024-12-20T09:55:00Z',
      updated_at: '2024-12-20T10:30:00Z',
    };
  }

  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .single();
  
  if (error) throw error;
  
  return data as Scan;
}

async function fetchScanResults(scanId: string, filters?: {
  severity?: string[];
  status?: string[];
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: ScanResult[]; total: number }> {
  if (!supabase) {
    // Mock data
    const mockResults: ScanResult[] = [
      {
        id: '1',
        scan_id: scanId,
        finding_id: 'SEC-001',
        title: 'Unencrypted HTTP Traffic',
        description: 'Application is accessible over unencrypted HTTP protocol',
        severity: 'high',
        category: 'Transport Security',
        target: 'http://example.com',
        evidence: { url: 'http://example.com', response_code: 200 },
        remediation: 'Configure HTTPS redirect and implement HSTS headers',
        references: ['https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration'],
        compliance_frameworks: ['SOC 2', 'ISO 27001'],
        status: 'open',
        created_at: '2024-12-20T10:15:00Z',
        updated_at: '2024-12-20T10:15:00Z',
      },
      {
        id: '2',
        scan_id: scanId,
        finding_id: 'SEC-002',
        title: 'Missing Security Headers',
        description: 'Application lacks essential security headers',
        severity: 'medium',
        category: 'Security Headers',
        target: 'https://example.com',
        evidence: { missing_headers: ['X-Frame-Options', 'X-Content-Type-Options'] },
        remediation: 'Implement security headers in web server configuration',
        references: ['https://owasp.org/www-project-secure-headers/'],
        compliance_frameworks: ['OWASP'],
        status: 'open',
        created_at: '2024-12-20T10:20:00Z',
        updated_at: '2024-12-20T10:20:00Z',
      },
    ];

    let filteredResults = mockResults;
    
    if (filters?.severity?.length) {
      filteredResults = filteredResults.filter(result => filters.severity!.includes(result.severity));
    }
    
    if (filters?.status?.length) {
      filteredResults = filteredResults.filter(result => filters.status!.includes(result.status));
    }
    
    if (filters?.category) {
      filteredResults = filteredResults.filter(result => 
        result.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paginatedResults = filteredResults.slice(offset, offset + limit);

    return { data: paginatedResults, total: filteredResults.length };
  }

  let query = supabase.from('scan_results').select('*', { count: 'exact' }).eq('scan_id', scanId);
  
  if (filters?.severity?.length) {
    query = query.in('severity', filters.severity);
  }
  
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  
  if (filters?.category) {
    query = query.ilike('category', `%${filters.category}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  query = query.order('severity', { ascending: false }).order('created_at', { ascending: false });

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return { data: data as ScanResult[], total: count || 0 };
}

async function createScan(scanData: {
  org_id: string;
  user_id: string;
  name: string;
  description?: string;
  config: ScanConfig;
}): Promise<Scan> {
  if (!supabase) {
    // Mock response
    const newScan: Scan = {
      id: Math.random().toString(36).substr(2, 9),
      org_id: scanData.org_id,
      user_id: scanData.user_id,
      name: scanData.name,
      description: scanData.description,
      scan_type: scanData.config.scan_type,
      status: 'pending',
      priority: scanData.config.priority,
      config: scanData.config,
      progress: 0,
      started_at: null,
      completed_at: null,
      duration_seconds: null,
      results_count: 0,
      findings_count: 0,
      critical_findings: 0,
      high_findings: 0,
      medium_findings: 0,
      low_findings: 0,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return newScan;
  }

  const { data, error } = await supabase
    .from('scans')
    .insert([{
      org_id: scanData.org_id,
      user_id: scanData.user_id,
      name: scanData.name,
      description: scanData.description,
      scan_type: scanData.config.scan_type,
      status: 'pending',
      priority: scanData.config.priority,
      config: scanData.config,
      progress: 0,
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data as Scan;
}

async function updateScanStatus(scanId: string, status: z.infer<typeof ScanStatus>): Promise<Scan> {
  if (!supabase) {
    // Mock response
    return await fetchScan(scanId);
  }

  const { data, error } = await supabase
    .from('scans')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', scanId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data as Scan;
}

async function deleteScan(scanId: string): Promise<void> {
  if (!supabase) {
    // Mock response
    return;
  }

  const { error } = await supabase
    .from('scans')
    .delete()
    .eq('id', scanId);
  
  if (error) throw error;
}

async function fetchScanTemplates(orgId: string): Promise<ScanTemplate[]> {
  if (!supabase) {
    // Mock templates
    return [
      {
        id: '1',
        org_id: orgId,
        name: 'Standard Compliance Scan',
        description: 'Basic compliance scan template for SOC 2 requirements',
        config: {
          scan_type: 'compliance',
          targets: [],
          priority: 'medium',
          options: {
            frameworks: ['SOC 2', 'ISO 27001'],
            depth: 'standard',
          },
        },
        is_default: true,
        usage_count: 15,
        created_at: '2024-12-01T00:00:00Z',
        updated_at: '2024-12-01T00:00:00Z',
      },
      {
        id: '2',
        org_id: orgId,
        name: 'Security Vulnerability Scan',
        description: 'Comprehensive security vulnerability assessment template',
        config: {
          scan_type: 'security',
          targets: [],
          priority: 'high',
          options: {
            scan_types: ['web_app', 'network', 'infrastructure'],
            depth: 'comprehensive',
          },
        },
        is_default: false,
        usage_count: 8,
        created_at: '2024-12-05T00:00:00Z',
        updated_at: '2024-12-05T00:00:00Z',
      },
    ];
  }

  const { data, error } = await supabase
    .from('scan_templates')
    .select('*')
    .eq('org_id', orgId)
    .order('is_default', { ascending: false })
    .order('usage_count', { ascending: false });
  
  if (error) throw error;
  
  return data as ScanTemplate[];
}

// Enhanced API functions for progress tracking and analytics
async function fetchScanProgress(scanId: string): Promise<ScanProgress> {
  if (!supabase) {
    // Mock enhanced progress data
    return {
      id: 'progress-1',
      scan_id: scanId,
      progress: 67,
      current_stage: 'Vulnerability Assessment',
      stages_completed: 4,
      total_stages: 6,
      estimated_remaining_seconds: 1200,
      throughput_per_second: 2.5,
      last_update: new Date().toISOString(),
      error_count: 2,
      warning_count: 5,
    };
  }

  const { data, error } = await supabase
    .from('scan_progress')
    .select('*')
    .eq('scan_id', scanId)
    .order('last_update', { ascending: false })
    .limit(1)
    .single();
  
  if (error) throw error;
  return data as ScanProgress;
}

async function fetchScanHistoryAnalytics(orgId: string, filters?: {
  scan_type?: string[];
  date_range?: [string, string];
  limit?: number;
}): Promise<ScanHistoryAnalytics[]> {
  if (!supabase) {
    // Mock historical analytics data
    const mockData: ScanHistoryAnalytics[] = [];
    const scanTypes = ['compliance', 'security', 'vulnerability'] as const;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockData.push({
        scan_id: `scan-${i}`,
        scan_type: scanTypes[i % 3],
        duration_seconds: 1200 + Math.random() * 1800,
        success_rate: 0.85 + Math.random() * 0.15,
        findings_count: Math.floor(Math.random() * 50),
        resource_usage: {
          cpu_avg: 30 + Math.random() * 40,
          memory_avg: 2 + Math.random() * 4,
          disk_io: Math.random() * 100,
          network_io: Math.random() * 50,
        },
        completed_at: date.toISOString(),
        week_of_year: Math.floor(i / 7) + 1,
        month: date.getMonth() + 1,
        quarter: Math.floor(date.getMonth() / 3) + 1,
      });
    }
    
    return mockData;
  }

  let query = supabase
    .from('scan_history_analytics')
    .select('*')
    .eq('org_id', orgId);

  if (filters?.scan_type?.length) {
    query = query.in('scan_type', filters.scan_type);
  }

  if (filters?.date_range) {
    query = query
      .gte('completed_at', filters.date_range[0])
      .lte('completed_at', filters.date_range[1]);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order('completed_at', { ascending: false });
  
  if (error) throw error;
  return data as ScanHistoryAnalytics[];
}

async function fetchScanTrendAnalysis(orgId: string, scanType: string, period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<ScanTrendAnalysis> {
  if (!supabase) {
    // Mock trend analysis data
    const trendData = [];
    const forecast = [];
    const now = new Date();
    
    // Generate trend data for the last 12 periods
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'daily') date.setDate(date.getDate() - i);
      else if (period === 'weekly') date.setDate(date.getDate() - i * 7);
      else if (period === 'monthly') date.setMonth(date.getMonth() - i);
      else date.setMonth(date.getMonth() - i * 3);

      trendData.push({
        date: date.toISOString(),
        avg_duration: 1800 + Math.random() * 600 - 300,
        success_rate: 0.85 + Math.random() * 0.15,
        findings_count: Math.floor(20 + Math.random() * 30),
        scan_volume: Math.floor(10 + Math.random() * 20),
      });
    }

    // Generate forecast for next 6 periods
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now);
      if (period === 'daily') date.setDate(date.getDate() + i);
      else if (period === 'weekly') date.setDate(date.getDate() + i * 7);
      else if (period === 'monthly') date.setMonth(date.getMonth() + i);
      else date.setMonth(date.getMonth() + i * 3);

      const lastTrend = trendData[trendData.length - 1];
      const predicted = lastTrend.avg_duration * (0.9 + Math.random() * 0.2);
      
      forecast.push({
        date: date.toISOString(),
        predicted_duration: predicted,
        confidence_interval: [predicted * 0.8, predicted * 1.2] as [number, number],
      });
    }

    return {
      scan_type: scanType as any,
      period,
      trend_data: trendData,
      forecast,
    };
  }

  // Real implementation would analyze historical data and generate trends
  // This is a placeholder for the actual implementation
  throw new Error('Trend analysis not implemented for production database');
}

async function fetchScanOptimizationRecommendations(orgId: string): Promise<ScanOptimizationRecommendation[]> {
  if (!supabase) {
    // Mock optimization recommendations
    return [
      {
        id: 'rec-1',
        scan_type: 'security',
        category: 'performance',
        title: 'Optimize scan scheduling during low-traffic hours',
        description: 'Analysis shows 23% faster scan completion during 2-6 AM time window',
        impact_score: 8,
        effort_level: 'low',
        estimated_improvement: '20-25% reduction in scan duration',
        implementation_steps: [
          'Configure scan scheduler to prefer 2-6 AM time slots',
          'Set up automated scan queue management',
          'Monitor performance improvements over 2 weeks',
        ],
        based_on_data: {
          scans_analyzed: 145,
          date_range: [
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            new Date().toISOString(),
          ] as [string, string],
          key_metrics: {
            avg_duration_peak: 2100,
            avg_duration_off_peak: 1620,
            resource_contention_reduction: 0.35,
          },
        },
        created_at: new Date().toISOString(),
      },
      {
        id: 'rec-2',
        scan_type: 'compliance',
        category: 'reliability',
        title: 'Implement checkpoint-based scan resumption',
        description: 'Reduce scan restart overhead by 40% with checkpoint mechanism',
        impact_score: 9,
        effort_level: 'medium',
        estimated_improvement: '40% reduction in re-scan time after interruptions',
        implementation_steps: [
          'Design checkpoint data structure',
          'Implement state persistence layer',
          'Add resumption logic to scan engine',
          'Test with various interruption scenarios',
        ],
        based_on_data: {
          scans_analyzed: 89,
          date_range: [
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            new Date().toISOString(),
          ] as [string, string],
          key_metrics: {
            interruption_rate: 0.12,
            avg_restart_time: 1800,
            potential_savings: 720,
          },
        },
        created_at: new Date().toISOString(),
      },
    ];
  }

  // Real implementation would analyze scan data and generate recommendations
  const { data, error } = await supabase
    .from('scan_optimization_recommendations')
    .select('*')
    .eq('org_id', orgId)
    .order('impact_score', { ascending: false });
  
  if (error) throw error;
  return data as ScanOptimizationRecommendation[];
}

// Enhanced React Query hooks for progress tracking and analytics
export function useScanProgress(scanId: string) {
  return useQuery({
    queryKey: ['scanProgress', scanId],
    queryFn: () => fetchScanProgress(scanId),
    enabled: !!scanId,
    refetchInterval: 2000, // Update every 2 seconds for real-time progress
    staleTime: 0,
  });
}

export function useScanHistoryAnalytics(orgId: string, filters?: {
  scan_type?: string[];
  date_range?: [string, string];
  limit?: number;
}) {
  return useQuery({
    queryKey: ['scanHistoryAnalytics', orgId, filters],
    queryFn: () => fetchScanHistoryAnalytics(orgId, filters),
    enabled: !!orgId,
    staleTime: 300000, // 5 minutes
  });
}

export function useScanTrendAnalysis(orgId: string, scanType: string, period: 'daily' | 'weekly' | 'monthly' | 'quarterly') {
  return useQuery({
    queryKey: ['scanTrendAnalysis', orgId, scanType, period],
    queryFn: () => fetchScanTrendAnalysis(orgId, scanType, period),
    enabled: !!orgId && !!scanType,
    staleTime: 900000, // 15 minutes
  });
}

export function useScanOptimizationRecommendations(orgId: string) {
  return useQuery({
    queryKey: ['scanOptimizationRecommendations', orgId],
    queryFn: () => fetchScanOptimizationRecommendations(orgId),
    enabled: !!orgId,
    staleTime: 3600000, // 1 hour
  });
}

// Enhanced utility hooks
export function useScanProgressStats(orgId: string) {
  const { data: runningScans } = useRunningScanProgress(orgId);
  
  return useQuery({
    queryKey: ['scanProgressStats', orgId, runningScans],
    queryFn: () => {
      if (!runningScans) return null;
      
      const stats = {
        total_running: runningScans.length,
        avg_progress: runningScans.reduce((acc, scan) => acc + scan.progress, 0) / runningScans.length || 0,
        fastest_eta: runningScans
          .filter(s => s.estimated_completion)
          .sort((a, b) => new Date(a.estimated_completion!).getTime() - new Date(b.estimated_completion!).getTime())[0]?.estimated_completion || null,
        slowest_eta: runningScans
          .filter(s => s.estimated_completion)
          .sort((a, b) => new Date(b.estimated_completion!).getTime() - new Date(a.estimated_completion!).getTime())[0]?.estimated_completion || null,
        scans_over_50_percent: runningScans.filter(s => s.progress > 50).length,
        scans_under_25_percent: runningScans.filter(s => s.progress < 25).length,
      };
      
      return stats;
    },
    enabled: !!runningScans,
    staleTime: 10000, // 10 seconds
  });
}

// React Query hooks
export function useScans(orgId: string, filters?: {
  status?: string[];
  scan_type?: string[];
  priority?: string[];
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['scans', orgId, filters],
    queryFn: () => fetchScans(orgId, filters),
    enabled: !!orgId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute for real-time updates
  });
}

export function useScan(scanId: string) {
  return useQuery({
    queryKey: ['scan', scanId],
    queryFn: () => fetchScan(scanId),
    enabled: !!scanId,
    staleTime: 10000, // 10 seconds
    refetchInterval: (data) => {
      // Refetch more frequently for running scans
      if (data?.status === 'running' || data?.status === 'pending') {
        return 5000; // 5 seconds
      }
      return 30000; // 30 seconds for completed scans
    },
  });
}

export function useScanResults(scanId: string, filters?: {
  severity?: string[];
  status?: string[];
  category?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['scanResults', scanId, filters],
    queryFn: () => fetchScanResults(scanId, filters),
    enabled: !!scanId,
    staleTime: 60000, // 1 minute
  });
}

export function useInfiniteScanResults(scanId: string, filters?: {
  severity?: string[];
  status?: string[];
  category?: string;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey: ['infiniteScanResults', scanId, filters],
    queryFn: ({ pageParam = 0 }) => 
      fetchScanResults(scanId, { ...filters, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0,
    enabled: !!scanId,
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createScan,
    onSuccess: (newScan) => {
      // Invalidate and refetch scans list
      queryClient.invalidateQueries({ queryKey: ['scans', newScan.org_id] });
      // Add the new scan to the cache
      queryClient.setQueryData(['scan', newScan.id], newScan);
    },
  });
}

export function useUpdateScanStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ scanId, status }: { scanId: string; status: z.infer<typeof ScanStatus> }) =>
      updateScanStatus(scanId, status),
    onSuccess: (updatedScan) => {
      // Update the specific scan in cache
      queryClient.setQueryData(['scan', updatedScan.id], updatedScan);
      // Invalidate scans list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['scans', updatedScan.org_id] });
    },
  });
}

export function useDeleteScan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteScan,
    onSuccess: (_, scanId) => {
      // Remove the scan from cache
      queryClient.removeQueries({ queryKey: ['scan', scanId] });
      // Invalidate scans list
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useScanTemplates(orgId: string) {
  return useQuery({
    queryKey: ['scanTemplates', orgId],
    queryFn: () => fetchScanTemplates(orgId),
    enabled: !!orgId,
    staleTime: 300000, // 5 minutes
  });
}

// Utility hooks
export function useScanStats(orgId: string) {
  const { data: scansData } = useScans(orgId);
  
  return useQuery({
    queryKey: ['scanStats', orgId, scansData],
    queryFn: () => {
      if (!scansData?.data) return null;
      
      const scans = scansData.data;
      const stats = {
        total: scans.length,
        running: scans.filter(s => s.status === 'running').length,
        completed: scans.filter(s => s.status === 'completed').length,
        failed: scans.filter(s => s.status === 'failed').length,
        pending: scans.filter(s => s.status === 'pending').length,
        totalFindings: scans.reduce((acc, s) => acc + s.findings_count, 0),
        criticalFindings: scans.reduce((acc, s) => acc + s.critical_findings, 0),
        highFindings: scans.reduce((acc, s) => acc + s.high_findings, 0),
        avgDuration: scans
          .filter(s => s.duration_seconds)
          .reduce((acc, s, _, arr) => acc + (s.duration_seconds || 0) / arr.length, 0),
      };
      
      return stats;
    },
    enabled: !!scansData?.data,
    staleTime: 30000,
  });
}

export function useRunningScanProgress(orgId: string) {
  return useQuery({
    queryKey: ['runningScanProgress', orgId],
    queryFn: async () => {
      const { data: scansData } = await fetchScans(orgId, { status: ['running', 'pending'] });
      return scansData.map(scan => ({
        id: scan.id,
        name: scan.name,
        progress: scan.progress,
        status: scan.status,
        started_at: scan.started_at,
        estimated_completion: scan.started_at && scan.progress > 0 
          ? new Date(Date.now() + ((Date.now() - new Date(scan.started_at).getTime()) / scan.progress) * (100 - scan.progress))
          : null,
      }));
    },
    enabled: !!orgId,
    refetchInterval: 5000, // 5 seconds for real-time progress
    staleTime: 0,
  });
} 