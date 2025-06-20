'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ReviewQueue } from './components/ReviewQueue'
import { ReviewDetails } from './components/ReviewDetails'
import { ReviewStats } from './components/ReviewStats'
import { ReviewFilters } from './components/ReviewFilters'
import { useReviewApi } from '../../lib/hooks/useReviewApi'
import { ReviewResult, ReviewFilters as ReviewFiltersType } from './types'

export default function ReviewDashboard() {
  const [selectedResult, setSelectedResult] = useState<ReviewResult | null>(null)
  const [filters, setFilters] = useState<ReviewFiltersType>({
    status: 'pending',
    severity: '',
    framework: '',
    searchTerm: ''
  })
  
  const { 
    reviewQueue, 
    loading, 
    error, 
    fetchReviewQueue, 
    approveResult, 
    rejectResult, 
    overrideResult,
    submitFeedback 
  } = useReviewApi()

  // Fetch review queue on component mount and when filters change
  useEffect(() => {
    fetchReviewQueue(filters)
  }, [fetchReviewQueue, filters])

  const handleResultSelect = useCallback((result: ReviewResult) => {
    setSelectedResult(result)
  }, [])

  const handleReviewAction = useCallback(async (
    action: 'approve' | 'reject' | 'override',
    resultId: string,
    feedback?: string,
    overrideRecommendation?: string
  ) => {
    try {
      switch (action) {
        case 'approve':
          await approveResult(resultId, feedback)
          break
        case 'reject':
          await rejectResult(resultId, feedback)
          break
        case 'override':
          await overrideResult(resultId, feedback, overrideRecommendation)
          break
      }
      
      // Refresh the queue after action
      await fetchReviewQueue(filters)
      
      // Clear selection if the reviewed item was selected
      if (selectedResult?.id === resultId) {
        setSelectedResult(null)
      }
    } catch (error) {
      console.error(`Failed to ${action} result:`, error)
    }
  }, [approveResult, rejectResult, overrideResult, fetchReviewQueue, filters, selectedResult])

  const handleFilterChange = useCallback((newFilters: ReviewFiltersType) => {
    setFilters(newFilters)
    setSelectedResult(null) // Clear selection when filters change
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Review Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => fetchReviewQueue(filters)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Compliance Review Dashboard
          </h1>
          <p className="text-gray-600">
            Review and approve compliance scan results requiring human oversight
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <ReviewStats results={reviewQueue} />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ReviewFilters 
            filters={filters}
            onFiltersChange={handleFilterChange}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Queue - Left Column */}
          <div className="lg:col-span-2">
            <ReviewQueue
              results={reviewQueue}
              selectedResult={selectedResult}
              onResultSelect={handleResultSelect}
              loading={loading}
              onReviewAction={handleReviewAction}
            />
          </div>

          {/* Review Details - Right Column */}
          <div className="lg:col-span-1">
            <ReviewDetails
              result={selectedResult}
              onReviewAction={handleReviewAction}
              onFeedbackSubmit={submitFeedback}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 