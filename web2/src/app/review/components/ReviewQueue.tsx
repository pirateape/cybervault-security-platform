'use client'

import React, { useId } from 'react'
import { ReviewResult } from '../types'
import { 
  handleKeyboardActivation, 
  createAriaProps, 
  LiveAnnouncer 
} from '../../../lib/accessibility'

interface ReviewQueueProps {
  results: ReviewResult[]
  selectedResult: ReviewResult | null
  onResultSelect: (result: ReviewResult) => void
  loading: boolean
  onReviewAction: (action: 'approve' | 'reject' | 'override', resultId: string, feedback?: string, overrideRecommendation?: string) => Promise<void>
}

export function ReviewQueue({ 
  results, 
  selectedResult, 
  onResultSelect, 
  loading,
  onReviewAction 
}: ReviewQueueProps) {
  const queueId = useId()
  const announcer = LiveAnnouncer.getInstance()

  // Handle review action with accessibility announcements
  const handleReviewActionWithAnnouncement = async (
    action: 'approve' | 'reject' | 'override',
    resultId: string,
    feedback?: string,
    overrideRecommendation?: string
  ) => {
    try {
      await onReviewAction(action, resultId, feedback, overrideRecommendation)
      announcer.announce(
        `Review item ${action}d successfully`,
        'assertive'
      )
    } catch (error) {
      announcer.announce(
        `Error ${action}ing review item. Please try again.`,
        'assertive'
      )
    }
  }

  // Handle keyboard selection
  const handleItemKeyDown = (event: React.KeyboardEvent, result: ReviewResult) => {
    handleKeyboardActivation(event, () => onResultSelect(result))
  }
  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'overridden':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        role="status"
        aria-live="polite"
        aria-label="Loading review queue"
      >
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div 
              className="loading-spinner"
              aria-hidden="true"
            ></div>
            <span className="ml-3 text-gray-600">Loading review queue...</span>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200"
        role="status"
        aria-live="polite"
      >
        <div className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items to review</h3>
            <p className="mt-1 text-sm text-gray-500">
              All compliance results have been reviewed or no pending items match your filters.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section 
      className="bg-white rounded-lg shadow-sm border border-gray-200"
      aria-labelledby={`${queueId}-heading`}
      {...createAriaProps.table('Review queue', `${queueId}-description`)}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 
          id={`${queueId}-heading`}
          className="text-lg font-semibold text-gray-900"
        >
          Review Queue ({results.length} items)
        </h2>
        <p 
          id={`${queueId}-description`}
          className="sr-only"
        >
          List of compliance scan results requiring review. Use arrow keys to navigate, Enter or Space to select items.
        </p>
      </div>
      
      <div 
        className="divide-y divide-gray-200"
        role="list"
        aria-label="Review queue items"
      >
        {results.map((result, index) => (
          <div
            key={result.id}
            className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${
              selectedResult?.id === result.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
            role="listitem"
            tabIndex={0}
            onClick={() => onResultSelect(result)}
            onKeyDown={(e) => handleItemKeyDown(e, result)}
            aria-label={`Review item ${index + 1} of ${results.length}: ${result.finding}`}
            aria-describedby={`item-${result.id}-details`}
            aria-selected={selectedResult?.id === result.id}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span 
                    className={`status-indicator status-${result.severity?.toLowerCase() || 'pending'} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(result.severity)}`}
                    aria-label={`Severity: ${result.severity || 'Unknown'}`}
                  >
                    {result.severity || 'Unknown'}
                  </span>
                  <span 
                    className={`status-indicator status-${result.review_status?.toLowerCase() || 'pending'} inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.review_status)}`}
                    aria-label={`Review status: ${result.review_status || 'pending'}`}
                  >
                    {result.review_status || 'pending'}
                  </span>
                  {result.compliance_framework && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {result.compliance_framework}
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {result.finding}
                </h3>
                
                <div 
                  id={`item-${result.id}-details`}
                  className="flex items-center text-xs text-gray-500 space-x-4"
                >
                  <span>
                    <span className="sr-only">Scan ID: </span>
                    {result.scan_id.slice(0, 8)}...
                  </span>
                  <span>
                    <span className="sr-only">Created on: </span>
                    {formatDate(result.created_at)}
                  </span>
                </div>
                
                {result.details && Object.keys(result.details).length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">
                      {Object.keys(result.details).length} additional details
                    </span>
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <div className="flex space-x-2">
                  {result.review_status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReviewActionWithAnnouncement('approve', result.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            handleReviewActionWithAnnouncement('approve', result.id)
                          }
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:ring-2 focus:ring-green-500 transition-colors"
                        aria-label={`Approve review for ${result.finding}`}
                      >
                        <span className="sr-only">Approve review for: </span>
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReviewActionWithAnnouncement('reject', result.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            handleReviewActionWithAnnouncement('reject', result.id)
                          }
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:ring-2 focus:ring-red-500 transition-colors"
                        aria-label={`Reject review for ${result.finding}`}
                      >
                        <span className="sr-only">Reject review for: </span>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
} 