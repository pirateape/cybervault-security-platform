import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

// Define types for dashboard data
export interface ComplianceReport {
  id: string;
  title: string;
  framework: string;
  status: string;
  score: number;
  lastUpdated: string;
  riskLevel: string;
  findings: number;
  remediated: number;
  organizationalUnit: string;
  trend?: string;
}

export interface ComplianceDataPoint {
  service: string;
  category: string;
  riskLevel: string;
  count: number;
  x: number;
  y: number;
}

export interface FeedbackEntry {
  id: string;
  userId: string;
  reportId: string;
  feedback: string;
  createdAt: string;
}

// Supabase client setup
const supabaseUrl =
  process.env.NX_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.NX_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

// Only create client if we have valid credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found in dashboardApi. Using mock data.'
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Fetch compliance reports for a given org (tenant).
 * @param orgId Organization (tenant) ID
 */
export function useComplianceReports(orgId: string) {
  return useQuery<ComplianceReport[], Error>({
    queryKey: ['complianceReports', orgId],
    queryFn: async () => {
      if (!supabase) {
        // Return mock data when Supabase is not available
        return [
          {
            id: '1',
            title: 'NIST Security Assessment',
            framework: 'NIST',
            status: 'compliant',
            score: 92,
            lastUpdated: new Date().toISOString(),
            riskLevel: 'low',
            findings: 15,
            remediated: 13,
            organizationalUnit: 'IT Security',
          },
          {
            id: '2',
            title: 'GDPR Compliance Review',
            framework: 'GDPR',
            status: 'partial',
            score: 78,
            lastUpdated: new Date().toISOString(),
            riskLevel: 'medium',
            findings: 22,
            remediated: 17,
            organizationalUnit: 'Data Protection',
          },
        ] as ComplianceReport[];
      }
      const { data, error } = await supabase!
        .from('compliance_reports')
        .select('*')
        .eq('org_id', orgId);
      if (error) throw error;
      return data as ComplianceReport[];
    },
    enabled: !!orgId,
  });
}

/**
 * Fetch heat map data for a given org (tenant).
 * @param orgId Organization (tenant) ID
 */
export function useHeatMapData(orgId: string) {
  return useQuery<ComplianceDataPoint[], Error>({
    queryKey: ['heatMapData', orgId],
    queryFn: async () => {
      if (!supabase) {
        // Return mock heat map data
        return [
          {
            service: 'Auth Service',
            category: 'Security',
            riskLevel: 'low',
            count: 5,
            x: 1,
            y: 1,
          },
          {
            service: 'API Gateway',
            category: 'Network',
            riskLevel: 'medium',
            count: 3,
            x: 2,
            y: 1,
          },
          {
            service: 'Database',
            category: 'Data',
            riskLevel: 'high',
            count: 2,
            x: 3,
            y: 1,
          },
        ] as ComplianceDataPoint[];
      }
      const { data, error } = await supabase!.from('heat_map').select('*').eq('org_id', orgId);
      if (error) throw error;
      return data as ComplianceDataPoint[];
    },
    enabled: !!orgId,
  });
}

/**
 * Fetch user feedback for a report in a given org (tenant).
 * @param orgId Organization (tenant) ID
 * @param reportId Report ID
 */
export function useFeedbackEntries(orgId: string, reportId: string) {
  return useQuery<FeedbackEntry[], Error>({
    queryKey: ['feedbackEntries', orgId, reportId],
    queryFn: async () => {
      if (!supabase) {
        // Return mock feedback data
        return [
          {
            id: '1',
            userId: 'demo-user',
            reportId: reportId,
            feedback: 'This assessment looks comprehensive.',
            createdAt: new Date().toISOString(),
          },
        ] as FeedbackEntry[];
      }
      const { data, error } = await supabase!
        .from('feedback')
        .select('*')
        .eq('org_id', orgId)
        .eq('reportId', reportId);
      if (error) throw error;
      return data as FeedbackEntry[];
    },
    enabled: !!orgId && !!reportId,
  });
}

/**
 * Fetch scan results for a given org and/or scan.
 * @param orgId Organization (tenant) ID
 * @param scanId Scan ID (optional)
 */
export function useScanResults(orgId: string, scanId?: string) {
  return useQuery<any[], Error>({
    queryKey: ['scanResults', orgId, scanId],
    queryFn: async () => {
      if (!supabase) {
        // Return mock scan results
        return [
          {
            id: '1',
            severity: 'high',
            title: 'Unencrypted data transmission',
            status: 'open',
          },
          {
            id: '2',
            severity: 'medium',
            title: 'Weak password policy',
            status: 'resolved',
          },
          {
            id: '3',
            severity: 'low',
            title: 'Missing security headers',
            status: 'open',
          },
          {
            id: '4',
            severity: 'critical',
            title: 'SQL injection vulnerability',
            status: 'open',
          },
        ];
      }
      let query = supabase!.from('results').select('*').eq('org_id', orgId);
      if (scanId) query = query.eq('scan_id', scanId);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });
}
