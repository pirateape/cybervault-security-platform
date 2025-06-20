'use client'

import React, { useState } from 'react'
import { ReviewResult } from '../types'

interface ReviewDetailsProps {
  result: ReviewResult | null
  onReviewAction: (action: 'approve' | 'reject' | 'override', resultId: string, feedback?: string, overrideRecommendation?: string) => Promise<void>
  onClose: () => void
}

export function ReviewDetails({ result, onReviewAction, onClose }: ReviewDetailsProps) {
  const [showActionForm, setShowActionForm] = useState<'approve' | 'reject' | 'override' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [overrideRecommendation, setOverrideRecommendation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAction = async (action: 'approve' | 'reject' | 'override') => {
    if (!result) return
    
    setSubmitting(true)
    try {
      await onReviewAction(action, result.id, feedback, overrideRecommendation)
      setShowActionForm(null)
      setFeedback('')
      setOverrideRecommendation('')
    } catch (error) {
      console.error('Failed to submit review action:', error)
    } finally {
      setSubmitting(false)
    }
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
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No item selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select an item from the review queue to see detailed information.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Review Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Status and Severity */}
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity)}`}>
              {result.severity || 'Unknown'} Severity
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.review_status)}`}>
              {result.review_status || 'pending'}
            </span>
            {result.compliance_framework && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {result.compliance_framework}
              </span>
            )}
          </div>

          {/* Finding */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Finding</h3>
            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
              {result.finding}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Scan ID</h4>
              <p className="text-sm text-gray-600 font-mono">{result.scan_id}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">User ID</h4>
              <p className="text-sm text-gray-600 font-mono">{result.user_id}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Created</h4>
              <p className="text-sm text-gray-600">{formatDate(result.created_at)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Result ID</h4>
              <p className="text-sm text-gray-600 font-mono">{result.id}</p>
            </div>
          </div>

          {/* Details */}
          {result.details && Object.keys(result.details).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Additional Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Review History */}
          {(result.reviewer_id || result.reviewer_feedback) && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Review History</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {result.reviewer_id && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Reviewer:</span> {result.reviewer_id}
                  </p>
                )}
                {result.reviewer_feedback && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Feedback:</span> {result.reviewer_feedback}
                  </p>
                )}
                {result.override_recommendation && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Override Recommendation:</span> {result.override_recommendation}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {result.review_status === 'pending' && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {!showActionForm ? (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowActionForm('approve')}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setShowActionForm('reject')}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setShowActionForm('override')}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Override
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                  {showActionForm === 'approve' ? 'Approval Comments' : 
                   showActionForm === 'reject' ? 'Rejection Reason' : 'Override Justification'}
                </label>
                <textarea
                  id="feedback"
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={`Enter ${showActionForm} comments...`}
                />
              </div>

              {showActionForm === 'override' && (
                <div>
                  <label htmlFor="override" className="block text-sm font-medium text-gray-700 mb-2">
                    Override Recommendation
                  </label>
                  <input
                    type="text"
                    id="override"
                    value={overrideRecommendation}
                    onChange={(e) => setOverrideRecommendation(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter new recommendation..."
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => handleAction(showActionForm)}
                  disabled={submitting}
                  className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                    showActionForm === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                    showActionForm === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-purple-600 hover:bg-purple-700'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? 'Submitting...' : `Confirm ${showActionForm}`}
                </button>
                <button
                  onClick={() => {
                    setShowActionForm(null)
                    setFeedback('')
                    setOverrideRecommendation('')
                  }}
                  disabled={submitting}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 