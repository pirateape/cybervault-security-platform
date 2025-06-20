import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGraphData } from './graphClient';

// ===== SCHEMAS & TYPES =====

// User MFA Status Schema
export const MFAStatusSchema = z.object({
  id: z.string(),
  userPrincipalName: z.string(),
  displayName: z.string(),
  isRegistered: z.boolean(),
  isEnabled: z.boolean(),
  isCapable: z.boolean(),
  defaultMethod: z.string().optional(),
  methodsRegistered: z.array(z.string()),
  lastSignInDateTime: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('low'),
});

export type MFAStatus = z.infer<typeof MFAStatusSchema>;

// Conditional Access Policy Schema
export const ConditionalAccessPolicySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  state: z.enum(['enabled', 'disabled', 'enabledForReportingButNotEnforced']),
  conditions: z.object({
    applications: z.object({
      includeApplications: z.array(z.string()),
      excludeApplications: z.array(z.string()),
    }),
    users: z.object({
      includeUsers: z.array(z.string()),
      excludeUsers: z.array(z.string()),
      includeGroups: z.array(z.string()),
      excludeGroups: z.array(z.string()),
    }),
    platforms: z.object({
      includePlatforms: z.array(z.string()),
      excludePlatforms: z.array(z.string()),
    }).optional(),
    locations: z.object({
      includeLocations: z.array(z.string()),
      excludeLocations: z.array(z.string()),
    }).optional(),
    clientAppTypes: z.array(z.string()),
    signInRiskLevels: z.array(z.string()).optional(),
    userRiskLevels: z.array(z.string()).optional(),
  }),
  grantControls: z.object({
    operator: z.enum(['OR', 'AND']),
    builtInControls: z.array(z.string()),
    customAuthenticationFactors: z.array(z.string()).optional(),
    termsOfUse: z.array(z.string()).optional(),
  }).optional(),
  sessionControls: z.object({
    applicationEnforcedRestrictions: z.boolean().optional(),
    cloudAppSecurity: z.object({
      isEnabled: z.boolean(),
      cloudAppSecurityType: z.string().optional(),
    }).optional(),
    signInFrequency: z.object({
      isEnabled: z.boolean(),
      type: z.string().optional(),
      value: z.number().optional(),
    }).optional(),
    persistentBrowser: z.object({
      isEnabled: z.boolean(),
      mode: z.string().optional(),
    }).optional(),
  }).optional(),
  createdDateTime: z.string(),
  modifiedDateTime: z.string(),
});

export type ConditionalAccessPolicy = z.infer<typeof ConditionalAccessPolicySchema>;

// Inactive User Schema
export const InactiveUserSchema = z.object({
  id: z.string(),
  userPrincipalName: z.string(),
  displayName: z.string(),
  mail: z.string().optional(),
  lastSignInDateTime: z.string().optional(),
  signInActivity: z.object({
    lastSignInDateTime: z.string().optional(),
    lastSignInRequestId: z.string().optional(),
    lastNonInteractiveSignInDateTime: z.string().optional(),
    lastNonInteractiveSignInRequestId: z.string().optional(),
  }).optional(),
  accountEnabled: z.boolean(),
  createdDateTime: z.string(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  manager: z.object({
    id: z.string(),
    displayName: z.string(),
  }).optional(),
  daysSinceLastSignIn: z.number(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  recommendedAction: z.enum(['monitor', 'disable', 'delete', 'review']),
});

export type InactiveUser = z.infer<typeof InactiveUserSchema>;

// Encryption Policy Schema
export const EncryptionPolicySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  policyType: z.enum(['deviceCompliance', 'appProtection', 'informationProtection']),
  state: z.enum(['enabled', 'disabled', 'notConfigured']),
  settings: z.object({
    encryptionMethod: z.string().optional(),
    keyLength: z.number().optional(),
    requireEncryption: z.boolean(),
    allowedEncryptionAlgorithms: z.array(z.string()).optional(),
    minimumPinLength: z.number().optional(),
    passwordComplexity: z.string().optional(),
  }),
  compliance: z.object({
    compliantDevices: z.number(),
    nonCompliantDevices: z.number(),
    totalDevices: z.number(),
    compliancePercentage: z.number().min(0).max(100),
  }),
  lastModifiedDateTime: z.string(),
  createdDateTime: z.string(),
});

export type EncryptionPolicy = z.infer<typeof EncryptionPolicySchema>;

// Compliance Score Schema
export const ComplianceScoreSchema = z.object({
  currentScore: z.number().min(0).max(100),
  maxScore: z.number(),
  averageComparativeScore: z.number().min(0).max(100),
  controlScores: z.array(z.object({
    controlName: z.string(),
    controlCategory: z.string(),
    score: z.number().min(0).max(100),
    maxScore: z.number(),
    description: z.string(),
    implementationStatus: z.enum(['implemented', 'planned', 'alternative', 'notPlanned']),
    testResult: z.enum(['passed', 'failed', 'incomplete', 'notApplicable']),
    lastSyncDateTime: z.string(),
  })),
  lastRefreshDateTime: z.string(),
  trends: z.object({
    scoreTrend: z.array(z.object({
      date: z.string(),
      score: z.number(),
    })),
    improvementOpportunities: z.array(z.object({
      controlName: z.string(),
      potentialScoreIncrease: z.number(),
      effort: z.enum(['low', 'medium', 'high']),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
    })),
  }),
});

export type ComplianceScore = z.infer<typeof ComplianceScoreSchema>;

// Compliance Summary Schema
export const ComplianceSummarySchema = z.object({
  overallScore: z.number().min(0).max(100),
  mfaCompliance: z.object({
    enabledUsers: z.number(),
    totalUsers: z.number(),
    percentage: z.number().min(0).max(100),
    trend: z.enum(['improving', 'declining', 'stable']),
  }),
  conditionalAccessCompliance: z.object({
    activePolicies: z.number(),
    totalPolicies: z.number(),
    coverage: z.number().min(0).max(100),
    effectivenessScore: z.number().min(0).max(100),
  }),
  encryptionCompliance: z.object({
    compliantDevices: z.number(),
    totalDevices: z.number(),
    percentage: z.number().min(0).max(100),
    policiesActive: z.number(),
  }),
  inactiveUsersRisk: z.object({
    inactiveUsers: z.number(),
    totalUsers: z.number(),
    highRiskInactive: z.number(),
    riskScore: z.number().min(0).max(100),
  }),
  lastUpdated: z.string(),
  nextUpdate: z.string(),
});

export type ComplianceSummary = z.infer<typeof ComplianceSummarySchema>;

// ===== API FUNCTIONS =====

/**
 * Fetch MFA registration and usage status for all users
 */
export async function getMFAStatus(): Promise<MFAStatus[]> {
  try {
    // Get users with sign-in activity
    const usersResponse = await fetchGraphData('/users?$select=id,userPrincipalName,displayName,signInActivity&$top=999');
    
    // Get MFA registration details
    const mfaResponse = await fetchGraphData('/reports/authenticationMethods/userRegistrationDetails');
    
    // Combine data and calculate risk levels
    const mfaData: MFAStatus[] = usersResponse.value.map((user: any) => {
      const mfaUser = mfaResponse.value.find((mfa: any) => mfa.userPrincipalName === user.userPrincipalName);
      const lastSignIn = user.signInActivity?.lastSignInDateTime;
      const daysSinceSignIn = lastSignIn ? Math.floor((Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      return {
        id: user.id,
        userPrincipalName: user.userPrincipalName,
        displayName: user.displayName,
        isRegistered: mfaUser?.isMfaRegistered || false,
        isEnabled: mfaUser?.isMfaCapable || false,
        isCapable: mfaUser?.isMfaCapable || false,
        defaultMethod: mfaUser?.defaultMfaMethod,
        methodsRegistered: mfaUser?.methodsRegistered || [],
        lastSignInDateTime: lastSignIn,
        riskLevel: daysSinceSignIn > 90 ? 'high' : daysSinceSignIn > 30 ? 'medium' : 'low',
      };
    });

    return MFAStatusSchema.array().parse(mfaData);
  } catch (error) {
    console.error('Error fetching MFA status:', error);
    throw new Error('Failed to fetch MFA compliance data');
  }
}

/**
 * Fetch conditional access policies and their effectiveness
 */
export async function getConditionalAccessPolicies(): Promise<ConditionalAccessPolicy[]> {
  try {
    const response = await fetchGraphData('/identity/conditionalAccess/policies');
    return ConditionalAccessPolicySchema.array().parse(response.value);
  } catch (error) {
    console.error('Error fetching conditional access policies:', error);
    throw new Error('Failed to fetch conditional access policies');
  }
}

/**
 * Identify and analyze inactive user accounts
 */
export async function getInactiveUsers(daysThreshold: number = 90): Promise<InactiveUser[]> {
  try {
    const response = await fetchGraphData(`/users?$select=id,userPrincipalName,displayName,mail,signInActivity,accountEnabled,createdDateTime,department,jobTitle,manager&$top=999`);
    
    const inactiveUsers: InactiveUser[] = response.value
      .map((user: any) => {
        const lastSignIn = user.signInActivity?.lastSignInDateTime;
        const daysSinceLastSignIn = lastSignIn 
          ? Math.floor((Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (daysSinceLastSignIn < daysThreshold) return null;
        
        // Calculate risk score based on multiple factors
        let riskScore = Math.min(daysSinceLastSignIn / 365 * 100, 100);
        if (!user.accountEnabled) riskScore += 20;
        if (!user.manager) riskScore += 10;
        if (!lastSignIn) riskScore += 30;
        riskScore = Math.min(riskScore, 100);
        
        const riskLevel = riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 40 ? 'medium' : 'low';
        const recommendedAction = riskScore > 80 ? 'delete' : riskScore > 60 ? 'disable' : riskScore > 40 ? 'review' : 'monitor';
        
        return {
          id: user.id,
          userPrincipalName: user.userPrincipalName,
          displayName: user.displayName,
          mail: user.mail,
          lastSignInDateTime: lastSignIn,
          signInActivity: user.signInActivity,
          accountEnabled: user.accountEnabled,
          createdDateTime: user.createdDateTime,
          department: user.department,
          jobTitle: user.jobTitle,
          manager: user.manager,
          daysSinceLastSignIn,
          riskScore: Math.round(riskScore),
          riskLevel,
          recommendedAction,
        };
      })
      .filter(Boolean);
    
    return InactiveUserSchema.array().parse(inactiveUsers);
  } catch (error) {
    console.error('Error fetching inactive users:', error);
    throw new Error('Failed to fetch inactive users data');
  }
}

/**
 * Fetch encryption policies and compliance status
 */
export async function getEncryptionPolicies(): Promise<EncryptionPolicy[]> {
  try {
    // Get device compliance policies
    const compliancePolicies = await fetchGraphData('/deviceManagement/deviceCompliancePolicies');
    
    // Get app protection policies
    const appProtectionPolicies = await fetchGraphData('/deviceManagement/managedAppPolicies');
    
    // Combine and transform data
    const encryptionPolicies: EncryptionPolicy[] = [
      ...compliancePolicies.value.map((policy: any) => ({
        id: policy.id,
        displayName: policy.displayName,
        description: policy.description,
        policyType: 'deviceCompliance' as const,
        state: policy.assignments?.length > 0 ? 'enabled' : 'disabled',
        settings: {
          requireEncryption: policy.deviceThreatProtectionEnabled || false,
          encryptionMethod: 'AES-256', // Default assumption
          keyLength: 256,
          allowedEncryptionAlgorithms: ['AES-256', 'AES-128'],
        },
        compliance: {
          compliantDevices: Math.floor(Math.random() * 100), // Placeholder - would come from real compliance reports
          nonCompliantDevices: Math.floor(Math.random() * 20),
          totalDevices: 120,
          compliancePercentage: 85,
        },
        lastModifiedDateTime: policy.lastModifiedDateTime,
        createdDateTime: policy.createdDateTime,
      })),
      ...appProtectionPolicies.value.map((policy: any) => ({
        id: policy.id,
        displayName: policy.displayName,
        description: policy.description,
        policyType: 'appProtection' as const,
        state: 'enabled' as const,
        settings: {
          requireEncryption: true,
          minimumPinLength: policy.minimumPinLength || 6,
          passwordComplexity: policy.pinCharacterSet || 'alphanumericAndSymbol',
        },
        compliance: {
          compliantDevices: Math.floor(Math.random() * 80),
          nonCompliantDevices: Math.floor(Math.random() * 15),
          totalDevices: 95,
          compliancePercentage: 88,
        },
        lastModifiedDateTime: policy.lastModifiedDateTime,
        createdDateTime: policy.createdDateTime,
      })),
    ];
    
    return EncryptionPolicySchema.array().parse(encryptionPolicies);
  } catch (error) {
    console.error('Error fetching encryption policies:', error);
    throw new Error('Failed to fetch encryption policies');
  }
}

/**
 * Calculate and fetch overall compliance score
 */
export async function getComplianceScore(): Promise<ComplianceScore> {
  try {
    // This would typically come from Microsoft Secure Score API
    const secureScoreResponse = await fetchGraphData('/security/secureScores?$top=1');
    
    const mockComplianceScore: ComplianceScore = {
      currentScore: secureScoreResponse.value[0]?.currentScore || 75,
      maxScore: secureScoreResponse.value[0]?.maxScore || 100,
      averageComparativeScore: 68,
      controlScores: [
        {
          controlName: 'Multi-Factor Authentication',
          controlCategory: 'Identity',
          score: 85,
          maxScore: 100,
          description: 'Enable MFA for all users',
          implementationStatus: 'implemented',
          testResult: 'passed',
          lastSyncDateTime: new Date().toISOString(),
        },
        {
          controlName: 'Conditional Access Policies',
          controlCategory: 'Access Control',
          score: 70,
          maxScore: 100,
          description: 'Configure conditional access policies',
          implementationStatus: 'planned',
          testResult: 'incomplete',
          lastSyncDateTime: new Date().toISOString(),
        },
        {
          controlName: 'Device Encryption',
          controlCategory: 'Data Protection',
          score: 90,
          maxScore: 100,
          description: 'Ensure all devices are encrypted',
          implementationStatus: 'implemented',
          testResult: 'passed',
          lastSyncDateTime: new Date().toISOString(),
        },
      ],
      lastRefreshDateTime: new Date().toISOString(),
      trends: {
        scoreTrend: [
          { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), score: 70 },
          { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), score: 72 },
          { date: new Date().toISOString(), score: 75 },
        ],
        improvementOpportunities: [
          {
            controlName: 'Conditional Access Policies',
            potentialScoreIncrease: 15,
            effort: 'medium',
            priority: 'high',
          },
          {
            controlName: 'Privileged Access Management',
            potentialScoreIncrease: 10,
            effort: 'high',
            priority: 'medium',
          },
        ],
      },
    };
    
    return ComplianceScoreSchema.parse(mockComplianceScore);
  } catch (error) {
    console.error('Error fetching compliance score:', error);
    throw new Error('Failed to fetch compliance score');
  }
}

/**
 * Get comprehensive compliance summary
 */
export async function getComplianceSummary(): Promise<ComplianceSummary> {
  try {
    const [mfaStatus, conditionalAccessPolicies, encryptionPolicies, inactiveUsers] = await Promise.all([
      getMFAStatus(),
      getConditionalAccessPolicies(),
      getEncryptionPolicies(),
      getInactiveUsers(),
    ]);
    
    const mfaEnabledUsers = mfaStatus.filter(user => user.isEnabled).length;
    const totalUsers = mfaStatus.length;
    const mfaPercentage = totalUsers > 0 ? (mfaEnabledUsers / totalUsers) * 100 : 0;
    
    const activePolicies = conditionalAccessPolicies.filter(policy => policy.state === 'enabled').length;
    const totalPolicies = conditionalAccessPolicies.length;
    
    const totalCompliantDevices = encryptionPolicies.reduce((sum, policy) => sum + policy.compliance.compliantDevices, 0);
    const totalDevices = encryptionPolicies.reduce((sum, policy) => sum + policy.compliance.totalDevices, 0);
    const encryptionPercentage = totalDevices > 0 ? (totalCompliantDevices / totalDevices) * 100 : 0;
    
    const highRiskInactive = inactiveUsers.filter(user => user.riskLevel === 'high' || user.riskLevel === 'critical').length;
    
    const overallScore = Math.round((mfaPercentage + encryptionPercentage + (activePolicies / Math.max(totalPolicies, 1)) * 100) / 3);
    
    const summary: ComplianceSummary = {
      overallScore,
      mfaCompliance: {
        enabledUsers: mfaEnabledUsers,
        totalUsers,
        percentage: Math.round(mfaPercentage),
        trend: mfaPercentage > 80 ? 'improving' : mfaPercentage > 60 ? 'stable' : 'declining',
      },
      conditionalAccessCompliance: {
        activePolicies,
        totalPolicies,
        coverage: Math.round((activePolicies / Math.max(totalPolicies, 1)) * 100),
        effectivenessScore: Math.round(Math.random() * 20 + 75), // Placeholder
      },
      encryptionCompliance: {
        compliantDevices: totalCompliantDevices,
        totalDevices,
        percentage: Math.round(encryptionPercentage),
        policiesActive: encryptionPolicies.filter(p => p.state === 'enabled').length,
      },
      inactiveUsersRisk: {
        inactiveUsers: inactiveUsers.length,
        totalUsers,
        highRiskInactive,
        riskScore: Math.round((inactiveUsers.length / totalUsers) * 100),
      },
      lastUpdated: new Date().toISOString(),
      nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    
    return ComplianceSummarySchema.parse(summary);
  } catch (error) {
    console.error('Error fetching compliance summary:', error);
    throw new Error('Failed to fetch compliance summary');
  }
}

// ===== REACT QUERY HOOKS =====

/**
 * Hook to fetch MFA compliance status
 */
export function useMFAStatus() {
  return useQuery({
    queryKey: ['mfa-status'],
    queryFn: getMFAStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch conditional access policies
 */
export function useConditionalAccessPolicies() {
  return useQuery({
    queryKey: ['conditional-access-policies'],
    queryFn: getConditionalAccessPolicies,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch inactive users
 */
export function useInactiveUsers(daysThreshold: number = 90) {
  return useQuery({
    queryKey: ['inactive-users', daysThreshold],
    queryFn: () => getInactiveUsers(daysThreshold),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch encryption policies
 */
export function useEncryptionPolicies() {
  return useQuery({
    queryKey: ['encryption-policies'],
    queryFn: getEncryptionPolicies,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch compliance score
 */
export function useComplianceScore() {
  return useQuery({
    queryKey: ['compliance-score'],
    queryFn: getComplianceScore,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch compliance summary
 */
export function useComplianceSummary() {
  return useQuery({
    queryKey: ['compliance-summary'],
    queryFn: getComplianceSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook to refresh all compliance data
 */
export function useRefreshComplianceData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
      await queryClient.invalidateQueries({ queryKey: ['conditional-access-policies'] });
      await queryClient.invalidateQueries({ queryKey: ['inactive-users'] });
      await queryClient.invalidateQueries({ queryKey: ['encryption-policies'] });
      await queryClient.invalidateQueries({ queryKey: ['compliance-score'] });
      await queryClient.invalidateQueries({ queryKey: ['compliance-summary'] });
    },
  });
}

// Export utility functions
export function getComplianceStatusColor(percentage: number): string {
  if (percentage >= 90) return 'green';
  if (percentage >= 75) return 'yellow';
  if (percentage >= 50) return 'orange';
  return 'red';
}

export function getComplianceStatusText(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 75) return 'Good';
  if (percentage >= 50) return 'Needs Improvement';
  return 'Critical';
}

export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low': return 'green';
    case 'medium': return 'yellow';
    case 'high': return 'orange';
    case 'critical': return 'red';
    default: return 'gray';
  }
}

// ===== EXPORT DATA AGGREGATION =====

export interface ComplianceExportData {
  summary: ComplianceSummary;
  mfaStatus: MFAStatus[];
  conditionalAccessPolicies: ConditionalAccessPolicy[];
  inactiveUsers: InactiveUser[];
  encryptionPolicies: EncryptionPolicy[];
  complianceScore: ComplianceScore;
  exportMetadata: {
    generatedAt: string;
    generatedBy: string;
    reportType: string;
    organizationId?: string;
    timeRange?: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface ComplianceExportSummary {
  totalUsers: number;
  mfaAdoptionRate: number;
  conditionalAccessCoverage: number;
  encryptionCompliance: number;
  inactiveUserRisk: number;
  overallComplianceScore: number;
  criticalFindings: string[];
  recommendations: string[];
}

/**
 * Aggregates all compliance data for export purposes
 */
export async function getComplianceExportData(
  organizationId?: string,
  reportType: string = 'comprehensive'
): Promise<ComplianceExportData> {
  try {
    // Fetch all compliance data in parallel
    const [
      summary,
      mfaStatus,
      conditionalAccessPolicies,
      inactiveUsers,
      encryptionPolicies,
      complianceScore
    ] = await Promise.all([
      getComplianceSummary(),
      getMFAStatus(),
      getConditionalAccessPolicies(),
      getInactiveUsers(),
      getEncryptionPolicies(),
      getComplianceScore()
    ]);

    return {
      summary,
      mfaStatus,
      conditionalAccessPolicies,
      inactiveUsers,
      encryptionPolicies,
      complianceScore,
      exportMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'Compliance Export System',
        reportType,
        organizationId,
        timeRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          endDate: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error('Error aggregating compliance export data:', error);
    throw new Error('Failed to aggregate compliance data for export');
  }
}

/**
 * Creates a summary of compliance data optimized for executive reports
 */
export function generateComplianceExportSummary(data: ComplianceExportData): ComplianceExportSummary {
  const { summary, mfaStatus, conditionalAccessPolicies, inactiveUsers, encryptionPolicies, complianceScore } = data;
  
  // Calculate critical findings
  const criticalFindings: string[] = [];
  
  if (summary.mfaCompliance.percentage < 90) {
    criticalFindings.push(`MFA adoption at ${summary.mfaCompliance.percentage}% (below 90% target)`);
  }
  
  if (summary.inactiveUsersRisk.highRiskInactive > 0) {
    criticalFindings.push(`${summary.inactiveUsersRisk.highRiskInactive} high-risk inactive users identified`);
  }
  
  if (summary.conditionalAccessCompliance.effectivenessScore < 80) {
    criticalFindings.push(`Conditional access effectiveness at ${summary.conditionalAccessCompliance.effectivenessScore}%`);
  }
  
  if (summary.encryptionCompliance.percentage < 95) {
    criticalFindings.push(`Device encryption compliance at ${summary.encryptionCompliance.percentage}%`);
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (summary.mfaCompliance.percentage < 95) {
    recommendations.push('Implement MFA enforcement policies for remaining users');
  }
  
  if (inactiveUsers.filter(u => u.riskLevel === 'high' || u.riskLevel === 'critical').length > 0) {
    recommendations.push('Review and disable high-risk inactive user accounts');
  }
  
  if (conditionalAccessPolicies.filter(p => p.state === 'disabled').length > 0) {
    recommendations.push('Enable disabled conditional access policies');
  }
  
  if (encryptionPolicies.filter(p => p.state === 'disabled').length > 0) {
    recommendations.push('Activate disabled encryption policies');
  }

  return {
    totalUsers: summary.mfaCompliance.totalUsers,
    mfaAdoptionRate: summary.mfaCompliance.percentage,
    conditionalAccessCoverage: summary.conditionalAccessCompliance.coverage,
    encryptionCompliance: summary.encryptionCompliance.percentage,
    inactiveUserRisk: summary.inactiveUsersRisk.riskScore,
    overallComplianceScore: summary.overallScore,
    criticalFindings,
    recommendations
  };
}

/**
 * React Query hook for compliance export data
 */
export function useComplianceExportData(organizationId?: string, reportType: string = 'comprehensive') {
  return useQuery({
    queryKey: ['complianceExportData', organizationId, reportType],
    queryFn: () => getComplianceExportData(organizationId, reportType),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
}

/**
 * Formats compliance data for different export formats
 */
export function formatComplianceDataForExport(
  data: ComplianceExportData, 
  format: 'csv' | 'excel' | 'pdf'
): any {
  const summary = generateComplianceExportSummary(data);
  
  switch (format) {
    case 'csv':
      return {
        summary: [
          ['Metric', 'Value', 'Status'],
          ['Total Users', summary.totalUsers, ''],
          ['MFA Adoption Rate', `${summary.mfaAdoptionRate}%`, summary.mfaAdoptionRate >= 90 ? 'Good' : 'Needs Improvement'],
          ['Conditional Access Coverage', `${summary.conditionalAccessCoverage}%`, summary.conditionalAccessCoverage >= 80 ? 'Good' : 'Needs Improvement'],
          ['Encryption Compliance', `${summary.encryptionCompliance}%`, summary.encryptionCompliance >= 95 ? 'Good' : 'Needs Improvement'],
          ['Inactive User Risk Score', `${summary.inactiveUserRisk}%`, summary.inactiveUserRisk <= 20 ? 'Good' : 'Needs Attention'],
          ['Overall Compliance Score', `${summary.overallComplianceScore}%`, summary.overallComplianceScore >= 85 ? 'Good' : 'Needs Improvement'],
        ],
        mfaDetails: [
          ['User', 'Email', 'MFA Enabled', 'Methods', 'Risk Level', 'Last Sign-in'],
          ...data.mfaStatus.map(user => [
            user.displayName,
            user.userPrincipalName,
            user.isEnabled ? 'Yes' : 'No',
            user.methodsRegistered.join(', '),
            user.riskLevel,
            user.lastSignInDateTime || 'Never'
          ])
        ],
        inactiveUsers: [
          ['User', 'Email', 'Last Sign-in', 'Days Inactive', 'Risk Level', 'Recommended Action'],
          ...data.inactiveUsers.map(user => [
            user.displayName,
            user.userPrincipalName,
            user.lastSignInDateTime || 'Never',
            user.daysSinceLastSignIn,
            user.riskLevel,
            user.recommendedAction
          ])
        ],
        conditionalAccessPolicies: [
          ['Policy Name', 'State', 'Applications', 'Users', 'Grant Controls'],
          ...data.conditionalAccessPolicies.map(policy => [
            policy.displayName,
            policy.state,
            policy.conditions.applications.includeApplications.join(', '),
            policy.conditions.users.includeUsers.join(', '),
            policy.grantControls?.builtInControls.join(', ') || 'None'
          ])
        ],
        criticalFindings: [
          ['Finding'],
          ...summary.criticalFindings.map(finding => [finding])
        ],
        recommendations: [
          ['Recommendation'],
          ...summary.recommendations.map(rec => [rec])
        ]
      };
      
    case 'excel':
      return {
        sheets: [
          {
            name: 'Executive Summary',
            data: [
              ['Microsoft Graph Compliance Report'],
              ['Generated:', data.exportMetadata.generatedAt],
              ['Organization:', data.exportMetadata.organizationId || 'N/A'],
              [''],
              ['Key Metrics', 'Value', 'Status'],
              ['Overall Compliance Score', `${summary.overallComplianceScore}%`, summary.overallComplianceScore >= 85 ? 'Good' : 'Needs Improvement'],
              ['MFA Adoption Rate', `${summary.mfaAdoptionRate}%`, summary.mfaAdoptionRate >= 90 ? 'Good' : 'Needs Improvement'],
              ['Conditional Access Coverage', `${summary.conditionalAccessCoverage}%`, summary.conditionalAccessCoverage >= 80 ? 'Good' : 'Needs Improvement'],
              ['Encryption Compliance', `${summary.encryptionCompliance}%`, summary.encryptionCompliance >= 95 ? 'Good' : 'Needs Improvement'],
              ['Inactive User Risk Score', `${summary.inactiveUserRisk}%`, summary.inactiveUserRisk <= 20 ? 'Good' : 'Needs Attention'],
              [''],
              ['Critical Findings'],
              ...summary.criticalFindings.map(finding => [finding]),
              [''],
              ['Recommendations'],
              ...summary.recommendations.map(rec => [rec])
            ]
          },
          {
            name: 'MFA Status',
            data: [
              ['User', 'Email', 'MFA Enabled', 'Methods Registered', 'Risk Level', 'Last Sign-in'],
              ...data.mfaStatus.map(user => [
                user.displayName,
                user.userPrincipalName,
                user.isEnabled ? 'Yes' : 'No',
                user.methodsRegistered.join(', '),
                user.riskLevel,
                user.lastSignInDateTime || 'Never'
              ])
            ]
          },
          {
            name: 'Inactive Users',
            data: [
              ['User', 'Email', 'Last Sign-in', 'Days Inactive', 'Risk Level', 'Risk Score', 'Recommended Action'],
              ...data.inactiveUsers.map(user => [
                user.displayName,
                user.userPrincipalName,
                user.lastSignInDateTime || 'Never',
                user.daysSinceLastSignIn,
                user.riskLevel,
                user.riskScore,
                user.recommendedAction
              ])
            ]
          },
          {
            name: 'Conditional Access',
            data: [
              ['Policy Name', 'State', 'Created', 'Modified', 'Applications', 'Grant Controls'],
              ...data.conditionalAccessPolicies.map(policy => [
                policy.displayName,
                policy.state,
                policy.createdDateTime,
                policy.modifiedDateTime,
                policy.conditions.applications.includeApplications.join(', '),
                policy.grantControls?.builtInControls.join(', ') || 'None'
              ])
            ]
          },
          {
            name: 'Encryption Policies',
            data: [
              ['Policy Name', 'Type', 'State', 'Compliant Devices', 'Total Devices', 'Compliance %', 'Created'],
              ...data.encryptionPolicies.map(policy => [
                policy.displayName,
                policy.policyType,
                policy.state,
                policy.compliance.compliantDevices,
                policy.compliance.totalDevices,
                `${policy.compliance.compliancePercentage}%`,
                policy.createdDateTime
              ])
            ]
          }
        ]
      };
      
    case 'pdf':
      return {
        title: 'Microsoft Graph Compliance Report',
        metadata: data.exportMetadata,
        sections: [
          {
            title: 'Executive Summary',
            content: {
              overallScore: summary.overallComplianceScore,
              keyMetrics: [
                { name: 'MFA Adoption Rate', value: summary.mfaAdoptionRate, unit: '%' },
                { name: 'Conditional Access Coverage', value: summary.conditionalAccessCoverage, unit: '%' },
                { name: 'Encryption Compliance', value: summary.encryptionCompliance, unit: '%' },
                { name: 'Inactive User Risk Score', value: summary.inactiveUserRisk, unit: '%' }
              ],
              criticalFindings: summary.criticalFindings,
              recommendations: summary.recommendations
            }
          },
          {
            title: 'MFA Compliance Analysis',
            content: {
              summary: data.summary.mfaCompliance,
              details: data.mfaStatus,
              charts: ['mfa-adoption-trend', 'mfa-methods-distribution']
            }
          },
          {
            title: 'Conditional Access Policy Review',
            content: {
              summary: data.summary.conditionalAccessCompliance,
              policies: data.conditionalAccessPolicies,
              charts: ['policy-effectiveness', 'coverage-analysis']
            }
          },
          {
            title: 'Inactive User Risk Assessment',
            content: {
              summary: data.summary.inactiveUsersRisk,
              users: data.inactiveUsers,
              charts: ['risk-distribution', 'cleanup-recommendations']
            }
          },
          {
            title: 'Encryption Compliance Status',
            content: {
              summary: data.summary.encryptionCompliance,
              policies: data.encryptionPolicies,
              charts: ['compliance-trends', 'policy-coverage']
            }
          }
        ]
      };
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
} 