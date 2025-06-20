/**
 * Standardized Review API using unified data access patterns
 * 
 * This module replaces the old web2/src/lib/hooks/useReviewApi.ts with:
 * - Unified API client with authentication
 * - Standardized error handling and types
 * - Consistent query key patterns
 * - TanStack Query integration
 * - Optimistic updates for review actions
 */

import { z } from 'zod';
import { 
  useEntityList, 
  useStandardQuery,
  useStandardMutation,
  queryKeys,
  queryConfig
} from './queryHelpers';
import { api, APIError } from './apiClient';
import { useQueryClient } from '@tanstack/react-query';

// ====================
// TYPES & SCHEMAS
// ====================

export const ReviewResultSchema = z.object({
  id: z.string(),
  finding: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  compliance_framework: z.string(),
  review_status: z.enum(['pending', 'approved', 'rejected', 'under_review']),
  created_at: z.string(),
  updated_at: z.string(),
  reviewed_at: z.string().optional(),
  reviewer_id: z.string().optional(),
  feedback: z.string().optional(),
});

export const ReviewFiltersSchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'rejected', 'under_review']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  framework: z.string().optional(),
  searchTerm: z.string().optional(),
});

export const ReviewActionSchema = z.object({
  reviewer_id: z.string(),
  feedback: z.string().optional(),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type ReviewFilters = z.infer<typeof ReviewFiltersSchema>;
export type ReviewAction = z.infer<typeof ReviewActionSchema>;

// ====================
// API ENDPOINTS
// ====================

const REVIEW_BASE = '/review';

const reviewEndpoints = {
  queue: () => `${REVIEW_BASE}/queue`,
  approve: (resultId: string) => `${REVIEW_BASE}/${resultId}/approve`,
  reject: (resultId: string) => `${REVIEW_BASE}/${resultId}/reject`,
  bulkAction: () => `${REVIEW_BASE}/bulk-action`,
} as const;

// ====================
// QUERY FUNCTIONS
// ====================

async function fetchReviewQueue(orgId: string, filters?: ReviewFilters): Promise<ReviewResult[]> {
  const params = new URLSearchParams({ org_id: orgId });
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, value);
      }
    });
  }
  
  const url = `${reviewEndpoints.queue()}?${params.toString()}`;
  const data = await api.get<ReviewResult[]>(url, orgId);
  return data.map(item => ReviewResultSchema.parse(item));
}

async function approveReviewResult(
  resultId: string, 
  action: ReviewAction, 
  orgId: string
): Promise<ReviewResult> {
  const data = await api.post<ReviewResult>(
    reviewEndpoints.approve(resultId), 
    action, 
    orgId
  );
  return ReviewResultSchema.parse(data);
}

async function rejectReviewResult(
  resultId: string, 
  action: ReviewAction, 
  orgId: string
): Promise<ReviewResult> {
  const data = await api.post<ReviewResult>(
    reviewEndpoints.reject(resultId), 
    action, 
    orgId
  );
  return ReviewResultSchema.parse(data);
}

// ====================
// QUERY HOOKS
// ====================

/**
 * Fetch review queue with optional filtering
 */
export function useReviewQueue(orgId: string, filters?: ReviewFilters) {
  return useStandardQuery(
    queryKeys.review.queue(orgId, filters),
    () => fetchReviewQueue(orgId, filters),
    {
      ...queryConfig.default,
      enabled: !!orgId,
    }
  );
}

/**
 * Get a specific review result by ID
 */
export function useReviewResult(orgId: string, resultId: string) {
  return useStandardQuery(
    queryKeys.review.detail(orgId, resultId),
    async () => {
      const data = await api.get<ReviewResult>(`${REVIEW_BASE}/${resultId}`, orgId);
      return ReviewResultSchema.parse(data);
    },
    {
      ...queryConfig.default,
      enabled: !!orgId && !!resultId,
    }
  );
}

// ====================
// MUTATION HOOKS
// ====================

/**
 * Approve a review result with optimistic updates
 */
export function useApproveReview(orgId: string) {
  const queryClient = useQueryClient();
  
  interface ApproveContext {
    previousQueue?: ReviewResult[];
    previousDetail?: ReviewResult;
    queueKey: readonly unknown[];
    detailKey: readonly unknown[];
  }
  
  return useStandardMutation<
    ReviewResult,
    APIError,
    { resultId: string; action: ReviewAction }
  >(
    ({ resultId, action }) => approveReviewResult(resultId, action, orgId),
    {
      onMutate: async ({ resultId }) => {
        // Cancel outgoing refetches
        const queueKey = queryKeys.review.queue(orgId);
        const detailKey = queryKeys.review.detail(orgId, resultId);
        
        await queryClient.cancelQueries({ queryKey: queueKey });
        await queryClient.cancelQueries({ queryKey: detailKey });

        // Snapshot previous values
        const previousQueue = queryClient.getQueryData<ReviewResult[]>(queueKey);
        const previousDetail = queryClient.getQueryData<ReviewResult>(detailKey);

        // Optimistically update the cache
        if (previousQueue) {
          queryClient.setQueryData<ReviewResult[]>(queueKey, (old = []) =>
            old.map(item => 
              item.id === resultId 
                ? { ...item, review_status: 'approved' as const, reviewed_at: new Date().toISOString() }
                : item
            )
          );
        }

        if (previousDetail) {
          queryClient.setQueryData<ReviewResult>(detailKey, {
            ...previousDetail,
            review_status: 'approved',
            reviewed_at: new Date().toISOString(),
          });
        }

        return { previousQueue, previousDetail, queueKey, detailKey } as ApproveContext;
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context) {
          if (context.previousQueue) {
            queryClient.setQueryData(context.queueKey, context.previousQueue);
          }
          if (context.previousDetail) {
            queryClient.setQueryData(context.detailKey, context.previousDetail);
          }
        }
      },
      onSettled: (data, error, variables, context) => {
        // Always refetch to ensure consistency
        if (context) {
          queryClient.invalidateQueries({ queryKey: context.queueKey });
          queryClient.invalidateQueries({ queryKey: context.detailKey });
        }
      },
    }
  );
}

/**
 * Reject a review result with optimistic updates
 */
export function useRejectReview(orgId: string) {
  const queryClient = useQueryClient();
  
  return useStandardMutation(
    ({ resultId, action }: { resultId: string; action: ReviewAction }) =>
      rejectReviewResult(resultId, action, orgId),
    {
      onMutate: async ({ resultId }) => {
        // Cancel outgoing refetches
        const queueKey = queryKeys.review.queue(orgId);
        const detailKey = queryKeys.review.detail(orgId, resultId);
        
        await queryClient.cancelQueries({ queryKey: queueKey });
        await queryClient.cancelQueries({ queryKey: detailKey });

        // Snapshot previous values
        const previousQueue = queryClient.getQueryData<ReviewResult[]>(queueKey);
        const previousDetail = queryClient.getQueryData<ReviewResult>(detailKey);

        // Optimistically update the cache
        if (previousQueue) {
          queryClient.setQueryData<ReviewResult[]>(queueKey, (old = []) =>
            old.map(item => 
              item.id === resultId 
                ? { ...item, review_status: 'rejected' as const, reviewed_at: new Date().toISOString() }
                : item
            )
          );
        }

        if (previousDetail) {
          queryClient.setQueryData<ReviewResult>(detailKey, {
            ...previousDetail,
            review_status: 'rejected',
            reviewed_at: new Date().toISOString(),
          });
        }

        return { previousQueue, previousDetail, queueKey, detailKey };
      },
      onError: (err, variables, context) => {
        // Rollback on error
        if (context) {
          if (context.previousQueue) {
            queryClient.setQueryData(context.queueKey, context.previousQueue);
          }
          if (context.previousDetail) {
            queryClient.setQueryData(context.detailKey, context.previousDetail);
          }
        }
      },
      onSettled: (data, error, variables, context) => {
        // Always refetch to ensure consistency
        if (context) {
          queryClient.invalidateQueries({ queryKey: context.queueKey });
          queryClient.invalidateQueries({ queryKey: context.detailKey });
        }
      },
    }
  );
}

// ====================
// EXTENDED QUERY KEYS
// ====================

// Add review-specific query keys to the main queryKeys object
declare module './queryHelpers' {
  interface QueryKeys {
    review: {
      queue: (orgId: string, filters?: ReviewFilters) => readonly unknown[];
      detail: (orgId: string, resultId: string) => readonly unknown[];
    };
  }
}

// Implement the review query keys
export const reviewQueryKeys = {
  queue: (orgId: string, filters?: ReviewFilters) => 
    ['review', 'queue', orgId, filters] as const,
  detail: (orgId: string, resultId: string) => 
    ['review', 'detail', orgId, resultId] as const,
};

// Export a complete Review API interface
export const reviewApi = {
  useReviewQueue,
  useReviewResult,
  useApproveReview,
  useRejectReview,
  // Raw query functions for direct usage
  fetchReviewQueue,
  approveReviewResult,
  rejectReviewResult,
  // Query keys for manual cache manipulation
  queryKeys: reviewQueryKeys,
} as const; 