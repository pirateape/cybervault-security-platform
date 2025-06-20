/**
 * Re-export standardized Review API hooks
 * 
 * This file maintains backwards compatibility while redirecting to the new
 * standardized data access patterns implemented in libs/data-access/reviewApi.ts
 */

'use client';

import { useCallback } from 'react';
import { 
  useReviewQueue, 
  useReviewResult,
  useApproveReview,
  useRejectReview,
  type ReviewFilters,
  type ReviewResult,
  type ReviewAction 
} from '@data-access/reviewApi';

// Re-export types for backwards compatibility
export type { ReviewResult, ReviewFilters, ReviewAction };

/**
 * Legacy hook interface for backwards compatibility
 * 
 * This provides the same interface as the old useReviewApi but uses
 * the new standardized patterns under the hood.
 */
export function useReviewApi() {
  // Note: orgId should come from auth context in a real implementation
  const orgId = 'default-org'; // TODO: Get from auth context

  const { data: reviewQueue = [], isLoading: loading, error, refetch } = useReviewQueue(orgId);
  const approveReviewMutation = useApproveReview(orgId);
  const rejectReviewMutation = useRejectReview(orgId);
  
  const fetchReviewQueue = useCallback(async (filters?: ReviewFilters) => {
    await refetch();
  }, [refetch]);

  const approveResult = useCallback(async (resultId: string, feedback?: string) => {
    return approveReviewMutation.mutateAsync({
      resultId,
      action: { reviewer_id: 'current-user', feedback: feedback || '' }
    });
  }, [approveReviewMutation]);

  const rejectResult = useCallback(async (resultId: string, feedback?: string) => {
    return rejectReviewMutation.mutateAsync({
      resultId,
      action: { reviewer_id: 'current-user', feedback: feedback || '' }
    });
  }, [rejectReviewMutation]);

  const overrideResult = useCallback(async (
    resultId: string, 
    feedback?: string, 
    overrideRecommendation?: string
  ) => {
    // For now, treat override as approve with feedback
    return approveReviewMutation.mutateAsync({
      resultId,
      action: { 
        reviewer_id: 'current-user', 
        feedback: `${feedback || ''} (Override: ${overrideRecommendation || ''})`
      }
    });
  }, [approveReviewMutation]);

  const submitFeedback = useCallback(async (
    resultId: string, 
    feedbackData: ReviewAction
  ) => {
    // Submit feedback by updating the review
    return approveReviewMutation.mutateAsync({ resultId, action: feedbackData });
  }, [approveReviewMutation]);

  const getAuditTrail = useCallback(async (resultId: string) => {
    // This would need to be implemented in the audit trail hook
    throw new Error('getAuditTrail not yet implemented with new patterns');
  }, []);

  return {
    reviewQueue,
    loading,
    error: error?.message || null,
    fetchReviewQueue,
    approveResult,
    rejectResult,
    overrideResult,
    submitFeedback,
    getAuditTrail,
  };
}

// Re-export the modern hooks for new components
export {
  useReviewQueue,
  useReviewResult,
  useApproveReview,
  useRejectReview,
} from '@data-access/reviewApi'; 