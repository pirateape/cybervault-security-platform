import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// Base API URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// TypeScript schemas using Zod
const AIAnalysisRequestSchema = z.object({
  code: z.string(),
  language: z.string(),
  analysisType: z.enum(['security', 'performance', 'quality', 'vulnerability']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  framework: z.string().optional(),
  context: z.string().optional(),
});

const AIFeedbackSchema = z.object({
  id: z.string(),
  code: z.string(),
  language: z.string(),
  analysisType: z.string(),
  riskScore: z.number().min(0).max(10),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  recommendations: z.array(z.string()),
  vulnerabilities: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    line: z.number().optional(),
    remediation: z.string(),
  })),
  performance: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    optimizations: z.array(z.string()),
  }),
  compliance: z.object({
    score: z.number().min(0).max(100),
    framework: z.string(),
    violations: z.array(z.string()),
  }),
  quality: z.object({
    score: z.number().min(0).max(100),
    metrics: z.record(z.number()),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CodeAnalysisSchema = z.object({
  id: z.string(),
  filename: z.string(),
  language: z.string(),
  code: z.string(),
  analysisType: z.string(),
  complexity: z.number(),
  maintainabilityIndex: z.number(),
  issues: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
  })),
  metrics: z.object({
    linesOfCode: z.number(),
    cyclomaticComplexity: z.number(),
    cognitiveComplexity: z.number(),
    technicalDebt: z.number(),
  }),
  aiInsights: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const RiskAnalysisSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  assetType: z.string(),
  riskScore: z.number().min(0).max(10),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  threats: z.array(z.object({
    type: z.string(),
    likelihood: z.number().min(0).max(10),
    impact: z.number().min(0).max(10),
    description: z.string(),
  })),
  mitigations: z.array(z.object({
    strategy: z.string(),
    effectiveness: z.number().min(0).max(10),
    cost: z.enum(['low', 'medium', 'high']),
    timeline: z.string(),
  })),
  compliance: z.object({
    frameworks: z.array(z.string()),
    status: z.enum(['compliant', 'non-compliant', 'partial']),
    gaps: z.array(z.string()),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const VulnerabilityAssessmentSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  targetType: z.string(),
  scanType: z.enum(['automated', 'manual', 'hybrid']),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  summary: z.object({
    totalVulnerabilities: z.number(),
    criticalCount: z.number(),
    highCount: z.number(),
    mediumCount: z.number(),
    lowCount: z.number(),
  }),
  vulnerabilities: z.array(z.object({
    id: z.string(),
    title: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    cvssScore: z.number().min(0).max(10).optional(),
    description: z.string(),
    impact: z.string(),
    remediation: z.string(),
    references: z.array(z.string()),
  })),
  recommendations: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const AIModelMetricsSchema = z.object({
  id: z.string(),
  modelName: z.string(),
  version: z.string(),
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1Score: z.number().min(0).max(1),
  processingTime: z.number(),
  lastUpdated: z.string(),
});

const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'down']),
  message: z.string().optional(),
  services: z.record(z.object({
    status: z.enum(['healthy', 'degraded', 'down']),
    latency: z.number().optional(),
    lastCheck: z.string(),
  })),
  timestamp: z.string(),
});

// Type exports
export type AIAnalysisRequest = z.infer<typeof AIAnalysisRequestSchema>;
export type AIFeedback = z.infer<typeof AIFeedbackSchema>;
export type CodeAnalysis = z.infer<typeof CodeAnalysisSchema>;
export type RiskAnalysis = z.infer<typeof RiskAnalysisSchema>;
export type VulnerabilityAssessment = z.infer<typeof VulnerabilityAssessmentSchema>;
export type AIModelMetrics = z.infer<typeof AIModelMetricsSchema>;
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

// API functions
const analyzeCode = async (request: AIAnalysisRequest): Promise<CodeAnalysis> => {
  const response = await fetch(`${API_BASE}/api/code-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`);
  }

  const data = await response.json();
  return CodeAnalysisSchema.parse(data);
};

const generateAIFeedback = async (request: AIAnalysisRequest): Promise<AIFeedback> => {
  const response = await fetch(`${API_BASE}/api/ai-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Feedback generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return AIFeedbackSchema.parse(data);
};

const getCodeAnalysisHistory = async (limit: number = 20): Promise<CodeAnalysis[]> => {
  const response = await fetch(`${API_BASE}/api/code-analysis/history?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis history: ${response.statusText}`);
  }

  const data = await response.json();
  return z.array(CodeAnalysisSchema).parse(data);
};

const getAIFeedbackHistory = async (limit: number = 20): Promise<AIFeedback[]> => {
  const response = await fetch(`${API_BASE}/api/ai-feedback/history?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch feedback history: ${response.statusText}`);
  }

  const data = await response.json();
  return z.array(AIFeedbackSchema).parse(data);
};

const getRiskAnalysisHistory = async (limit: number = 20): Promise<RiskAnalysis[]> => {
  const response = await fetch(`${API_BASE}/api/risk-analysis/history?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch risk analysis history: ${response.statusText}`);
  }

  const data = await response.json();
  return z.array(RiskAnalysisSchema).parse(data);
};

const getVulnerabilityAssessments = async (limit: number = 20): Promise<VulnerabilityAssessment[]> => {
  const response = await fetch(`${API_BASE}/api/vulnerability-assessments?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch vulnerability assessments: ${response.statusText}`);
  }

  const data = await response.json();
  return z.array(VulnerabilityAssessmentSchema).parse(data);
};

const getAIModelMetrics = async (): Promise<AIModelMetrics[]> => {
  const response = await fetch(`${API_BASE}/api/ai-models/metrics`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch AI model metrics: ${response.statusText}`);
  }

  const data = await response.json();
  return z.array(AIModelMetricsSchema).parse(data);
};

const getHealthStatus = async (): Promise<HealthStatus> => {
  const response = await fetch(`${API_BASE}/api/health`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch health status: ${response.statusText}`);
  }

  const data = await response.json();
  return HealthStatusSchema.parse(data);
};

// React Query hooks
export const useAIAnalysis = {
  // Mutations
  useAnalyzeCode: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: analyzeCode,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['codeAnalysisHistory'] });
      },
    });
  },

  useGenerateAIFeedback: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: generateAIFeedback,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['aiFeedbackHistory'] });
      },
    });
  },

  // Queries
  useCodeAnalysisHistory: (limit: number = 20) => {
    return useQuery({
      queryKey: ['codeAnalysisHistory', limit],
      queryFn: () => getCodeAnalysisHistory(limit),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  useAIFeedbackHistory: (limit: number = 20) => {
    return useQuery({
      queryKey: ['aiFeedbackHistory', limit],
      queryFn: () => getAIFeedbackHistory(limit),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  useRiskAnalysisHistory: (limit: number = 20) => {
    return useQuery({
      queryKey: ['riskAnalysisHistory', limit],
      queryFn: () => getRiskAnalysisHistory(limit),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  useVulnerabilityAssessments: (limit: number = 20) => {
    return useQuery({
      queryKey: ['vulnerabilityAssessments', limit],
      queryFn: () => getVulnerabilityAssessments(limit),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  useAIModelMetrics: () => {
    return useQuery({
      queryKey: ['aiModelMetrics'],
      queryFn: getAIModelMetrics,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },

  useHealthStatus: () => {
    return useQuery({
      queryKey: ['healthStatus'],
      queryFn: getHealthStatus,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // Refetch every minute
    });
  },
};

// Default export for backwards compatibility
export default useAIAnalysis; 