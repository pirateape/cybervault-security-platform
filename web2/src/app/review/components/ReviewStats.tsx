'use client'

import React from 'react'
import { ReviewResult } from '../types'

interface ReviewStatsProps {
  results: ReviewResult[]
  loading: boolean
}

export function ReviewStats({ results, loading }: ReviewStatsProps) {
  const calculateStats = () => {
    if (loading || results.length === 0) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        overridden: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    }

    const stats = {
      total: results.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      overridden: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }

    results.forEach(result => {
      // Count by status
      switch (result.review_status?.toLowerCase()) {
        case 'pending':
          stats.pending++
          break
        case 'approved':
          stats.approved++
          break
        case 'rejected':
          stats.rejected++
          break
        case 'overridden':
          stats.overridden++
          break
      }

      // Count by severity
      switch (result.severity?.toLowerCase()) {
        case 'critical':
          stats.critical++
          break
        case 'high':
          stats.high++
          break
        case 'medium':
          stats.medium++
          break
        case 'low':
          stats.low++
          break
      }
    })

    return stats
  }

  const stats = calculateStats()

  const StatCard = ({ 
    title, 
    value, 
    color, 
    icon,
    percentage 
  }: { 
    title: string
    value: number
    color: string
    icon: React.ReactNode
    percentage?: number
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color}`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {percentage !== undefined && (
                <div className="ml-2 flex items-baseline text-sm text-gray-600">
                  ({percentage.toFixed(1)}%)
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Status Overview</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Items"
            value={stats.total}
            color="text-blue-600"
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          
          <StatCard
            title="Pending Review"
            value={stats.pending}
            color="text-yellow-600"
            percentage={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <StatCard
            title="Approved"
            value={stats.approved}
            color="text-green-600"
            percentage={stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <StatCard
            title="Rejected"
            value={stats.rejected}
            color="text-red-600"
            percentage={stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Severity Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Severity Breakdown</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Critical"
            value={stats.critical}
            color="text-red-600"
            percentage={stats.total > 0 ? (stats.critical / stats.total) * 100 : 0}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
          />
          
          <StatCard
            title="High"
            value={stats.high}
            color="text-orange-600"
            percentage={stats.total > 0 ? (stats.high / stats.total) * 100 : 0}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <StatCard
            title="Medium"
            value={stats.medium}
            color="text-yellow-600"
            percentage={stats.total > 0 ? (stats.medium / stats.total) * 100 : 0}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          
          <StatCard
            title="Low"
            value={stats.low}
            color="text-green-600"
            percentage={stats.total > 0 ? (stats.low / stats.total) * 100 : 0}
            icon={
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Quick Actions */}
      {stats.pending > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                {stats.pending} item{stats.pending !== 1 ? 's' : ''} pending review
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {stats.critical > 0 && `${stats.critical} critical severity item${stats.critical !== 1 ? 's' : ''} require immediate attention.`}
                {stats.critical === 0 && stats.high > 0 && `${stats.high} high severity item${stats.high !== 1 ? 's' : ''} should be reviewed soon.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 