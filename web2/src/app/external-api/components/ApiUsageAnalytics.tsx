'use client';

import React, { useState } from 'react';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { useUsageStats, useCostTracking, useUsageForecast, useExportUsageReport } from '@data-access/externalApiManagementApi';

// Custom Icons
const BarChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const DollarSignIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>
  </svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7,10 12,15 17,10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const DatabaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export function ApiUsageAnalytics() {
  const [period, setPeriod] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [costPeriod, setCostPeriod] = useState('month');
  const [forecastDays, setForecastDays] = useState(30);
  
  // Mock org_id for development - in real app this would come from auth context
  const orgId = 'mock-org-id';
  
  const { data: usageStats, isLoading: usageLoading, refetch: refetchUsage } = useUsageStats(orgId, period);
  const { data: costTracking, isLoading: costLoading, refetch: refetchCost } = useCostTracking(orgId, costPeriod);
  const { data: usageForecast, isLoading: forecastLoading, refetch: refetchForecast } = useUsageForecast(orgId, forecastDays);
  const exportReport = useExportUsageReport();

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    try {
      await exportReport.mutateAsync({
        orgId,
        format,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Calculate current period stats from usage data
  const currentStats = usageStats && usageStats.length > 0 ? usageStats[0] : null;
  
  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Usage Analytics</h3>
          <p className="text-sm text-gray-600">Comprehensive usage reporting, cost tracking, and forecasting</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'hour' | 'day' | 'week' | 'month')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="hour">Hourly</option>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          
          {/* Export Buttons */}
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportReport.isPending}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            Export CSV
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exportReport.isPending}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChartIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-xl font-bold text-gray-900">
                {currentStats ? formatNumber(currentStats.total_requests) : '--'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unique API Keys</p>
              <p className="text-xl font-bold text-gray-900">
                {currentStats ? formatNumber(currentStats.unique_api_keys) : '--'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DatabaseIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Data Transferred</p>
              <p className="text-xl font-bold text-gray-900">
                {currentStats ? formatBytes(currentStats.total_data_transferred_mb * 1024 * 1024) : '--'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSignIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Cost</p>
              <p className="text-xl font-bold text-gray-900">
                {costTracking && costTracking.length > 0 ? formatCurrency(costTracking[0].total_cost) : '--'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Endpoints */}
        <Card variant="elevated">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Endpoints</h4>
            
            {usageLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : currentStats && currentStats.top_endpoints.length > 0 ? (
              <div className="space-y-4">
                {currentStats.top_endpoints.map((endpoint, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {endpoint.endpoint}
                      </span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{formatNumber(endpoint.requests)}</span>
                        <span className="text-gray-500">({endpoint.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${endpoint.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChartIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No endpoint usage data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Top API Keys */}
        <Card variant="elevated">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top API Keys</h4>
            
            {usageLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : currentStats && currentStats.top_api_keys.length > 0 ? (
              <div className="space-y-4">
                {currentStats.top_api_keys.map((apiKey, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {apiKey.label || `API Key ${apiKey.api_key_id.slice(-8)}`}
                      </span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold">{formatNumber(apiKey.requests)}</span>
                        <span className="text-gray-500">({apiKey.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${apiKey.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <UsersIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No API key usage data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Error Analysis */}
      <Card variant="elevated">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Error Breakdown</h4>
          
          {usageLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : currentStats && currentStats.error_breakdown.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentStats.error_breakdown.map((error, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      error.status_code >= 500 ? 'bg-red-100' :
                      error.status_code >= 400 ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      <AlertTriangleIcon className={`w-5 h-5 ${
                        error.status_code >= 500 ? 'text-red-600' :
                        error.status_code >= 400 ? 'text-orange-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{error.status_code}</p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(error.count)} errors ({error.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertTriangleIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No error data available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Cost Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card variant="elevated">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Cost Analysis</h4>
              <select
                value={costPeriod}
                onChange={(e) => setCostPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
            
            {costLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : costTracking && costTracking.length > 0 ? (
              <div className="space-y-6">
                {costTracking.map((cost, index) => (
                  <div key={index} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">API Requests</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(cost.total_cost)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(cost.total_requests)} requests @ {formatCurrency(cost.cost_per_request)} each
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Data Transfer</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(cost.data_transfer_cost)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cost.data_transfer_gb.toFixed(2)} GB transferred
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUpIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Estimated Monthly Cost: {formatCurrency(cost.estimated_monthly_cost)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <DollarSignIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No cost data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Usage Forecast */}
        <Card variant="elevated">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Usage Forecast</h4>
              <select
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Next 7 days</option>
                <option value={30}>Next 30 days</option>
                <option value={90}>Next 90 days</option>
              </select>
            </div>
            
            {forecastLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : usageForecast ? (
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Predicted Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(usageForecast.predicted_requests || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((usageForecast.confidence || 0) * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Predicted Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(usageForecast.predicted_cost || 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Based on current usage patterns
                    </p>
                  </div>
                </div>
                
                {usageForecast.recommendations && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Recommendations</p>
                        <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                          {usageForecast.recommendations.map((rec: string, index: number) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <TrendingUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No forecast data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Export Status */}
      {exportReport.isPending && (
        <Card variant="elevated">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Generating report...</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 