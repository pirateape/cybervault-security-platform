'use client'

import { useState, useCallback } from 'react'
import { ReviewResult, ReviewFilters, ReviewFeedbackRequest } from '../../app/review/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface UseReviewApiReturn {
  reviewQueue: ReviewResult[]
  loading: boolean
  error: string | null
  fetchReviewQueue: (filters?: ReviewFilters) => Promise<void>
  approveResult: (resultId: string, feedback?: string) => Promise<void>
  rejectResult: (resultId: string, feedback?: string) => Promise<void>
  overrideResult: (resultId: string, feedback?: string, overrideRecommendation?: string) => Promise<void>
  submitFeedback: (resultId: string, feedbackData: ReviewFeedbackRequest) => Promise<void>
  getAuditTrail: (resultId: string) => Promise<any[]>
}

export function useReviewApi(): UseReviewApiReturn {
  const [reviewQueue, setReviewQueue] = useState<ReviewResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get auth token from localStorage or context
  const getAuthToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }, [])

  // Get current user ID (you may need to adjust this based on your auth implementation)
  const getCurrentUserId = useCallback(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          return user.id
        } catch (e) {
          console.error('Failed to parse user data:', e)
        }
      }
    }
    return 'current-user-id' // Fallback - replace with actual user ID logic
  }, [])

  // Get organization ID (you may need to adjust this based on your org implementation)
  const getOrgId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('org_id') || 'default-org'
    }
    return 'default-org'
  }, [])

  const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken()
    const orgId = getOrgId()
    
    const url = new URL(`${API_BASE_URL}${endpoint}`)
    url.searchParams.append('org_id', orgId)

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }, [getAuthToken, getOrgId])

  const fetchReviewQueue = useCallback(async (filters?: ReviewFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest('/review/queue')
      
      let filteredData = data
      
      // Apply client-side filtering if filters are provided
      if (filters) {
        filteredData = data.filter((result: ReviewResult) => {
          if (filters.status && filters.status !== 'all' && result.review_status !== filters.status) {
            return false
          }
          if (filters.severity && result.severity !== filters.severity) {
            return false
          }
          if (filters.framework && result.compliance_framework !== filters.framework) {
            return false
          }
          if (filters.searchTerm && !result.finding.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
            return false
          }
          return true
        })
      }
      
      setReviewQueue(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review queue')
    } finally {
      setLoading(false)
    }
  }, [apiRequest])

  const approveResult = useCallback(async (resultId: string, feedback?: string) => {
    const reviewerId = getCurrentUserId()
    await apiRequest(`/review/${resultId}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        reviewer_id: reviewerId,
        feedback: feedback || ''
      })
    })
  }, [apiRequest, getCurrentUserId])

  const rejectResult = useCallback(async (resultId: string, feedback?: string) => {
    const reviewerId = getCurrentUserId()
    await apiRequest(`/review/${resultId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        reviewer_id: reviewerId,
        feedback: feedback || ''
      })
    })
  }, [apiRequest, getCurrentUserId])

  const overrideResult = useCallback(async (resultId: string, feedback?: string, overrideRecommendation?: string) => {
    const reviewerId = getCurrentUserId()
    await apiRequest(`/review/${resultId}/override`, {
      method: 'POST',
      body: JSON.stringify({
        reviewer_id: reviewerId,
        feedback: feedback || '',
        override_recommendation: overrideRecommendation || ''
      })
    })
  }, [apiRequest, getCurrentUserId])

  const submitFeedback = useCallback(async (resultId: string, feedbackData: ReviewFeedbackRequest) => {
    await apiRequest(`/review/${resultId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedbackData)
    })
  }, [apiRequest])

  const getAuditTrail = useCallback(async (resultId: string) => {
    return await apiRequest(`/review/${resultId}/audit`)
  }, [apiRequest])

  return {
    reviewQueue,
    loading,
    error,
    fetchReviewQueue,
    approveResult,
    rejectResult,
    overrideResult,
    submitFeedback,
    getAuditTrail
  }
} 