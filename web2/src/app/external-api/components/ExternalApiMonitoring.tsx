'use client';

import React, { useState } from 'react';
import { Card } from '@ui/primitives/Card';
import { Button } from '@ui/primitives/Button';
import { useApiHealth, useApiMetrics, useRateLimitStatus } from '@data-access/externalApiManagementApi';

// Custom Icons
const ActivityIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
  </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const AlertCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const ClockIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>
  </svg>
);

const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <polyline points="23,4 23,10 17,10"/>
    <polyline points="1,20 1,14 7,14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);

export function ExternalApiMonitoring() {
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Mock org_id for development - in real app this would come from auth context
  const orgId = 'mock-org-id';
  
  const { data: apiHealth, isLoading: healthLoading, refetch: refetchHealth } = useApiHealth();
  const { data: apiMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useApiMetrics(timeRange);
  const { data: rateLimitStatus, isLoading: rateLimitLoading, refetch: refetchRateLimit } = useRateLimitStatus(orgId);

  // Auto-refresh functionality
  React.useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetchHealth();
      refetchMetrics();
      refetchRateLimit();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refetchHealth, refetchMetrics, refetchRateLimit]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircleIcon;
      case 'degraded': return AlertCircleIcon;
      case 'down': return XCircleIcon;
      default: return ActivityIcon;
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Health Monitoring</h3>
          <p className="text-sm text-gray-600">Real-time monitoring of API endpoints and performance metrics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          
          {/* Auto-refresh Toggle */}
          <Button
            variant={autoRefresh ? 'solid' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            Auto-refresh
          </Button>
          
          {/* Manual Refresh */}
          <Button
            variant="outline"
            onClick={() => {
              refetchHealth();
              refetchMetrics();
              refetchRateLimit();
            }}
            className="flex items-center gap-2"
          >
            <RefreshIcon className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Overall Health</p>
              <p className="text-xl font-bold text-green-600">Healthy</p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ActivityIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Endpoints</p>
              <p className="text-xl font-bold text-gray-900">
                {apiHealth?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
                             <p className="text-sm text-gray-600">Avg Response Time</p>
               <p className="text-xl font-bold text-gray-900">
                 {apiMetrics && apiMetrics.length > 0 ? formatResponseTime(apiMetrics[0].average_response_time) : '--'}
               </p>
            </div>
          </div>
        </Card>
        
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUpIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
                             <p className="text-sm text-gray-600">Success Rate</p>
               <p className="text-xl font-bold text-gray-900">
                 {apiMetrics && apiMetrics.length > 0 ? formatPercentage(1 - apiMetrics[0].error_rate) : '--'}
               </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Endpoint Health Status */}
      <Card variant="elevated">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Health Status</h4>
          
          {healthLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : apiHealth && apiHealth.length > 0 ? (
            <div className="space-y-3">
              {apiHealth.map((endpoint, index) => {
                const StatusIcon = getStatusIcon(endpoint.status);
                return (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(endpoint.status)}`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">{endpoint.endpoint}</h5>
                        <p className="text-sm text-gray-600">
                          Last checked: {new Date(endpoint.last_check).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">Response Time</p>
                        <p className="font-semibold">{formatResponseTime(endpoint.response_time_ms)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Success Rate</p>
                        <p className="font-semibold">{formatPercentage(endpoint.success_rate)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Uptime</p>
                        <p className="font-semibold">{formatPercentage(endpoint.uptime_percentage)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No endpoint health data available</p>
              <p className="text-sm text-gray-500">Endpoints will appear here once monitoring is configured</p>
            </div>
          )}
        </div>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Metrics */}
        <Card variant="elevated">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
            
            {metricsLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
                         ) : apiMetrics && apiMetrics.length > 0 ? (
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm text-gray-600">Total Requests</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {apiMetrics[0].total_requests.toLocaleString()}
                     </p>
                   </div>
                   <div>
                     <p className="text-sm text-gray-600">Requests/min</p>
                     <p className="text-2xl font-bold text-gray-900">
                       {Math.round(apiMetrics[0].requests_per_minute)}
                     </p>
                   </div>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-gray-600">P95 Response Time</span>
                     <span className="font-semibold">{formatResponseTime(apiMetrics[0].p95_response_time)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-gray-600">P99 Response Time</span>
                     <span className="font-semibold">{formatResponseTime(apiMetrics[0].p99_response_time)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-gray-600">Error Rate</span>
                     <span className="font-semibold text-red-600">{formatPercentage(apiMetrics[0].error_rate)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm text-gray-600">Uptime</span>
                     <span className="font-semibold text-green-600">{formatPercentage(apiMetrics[0].uptime_percentage)}</span>
                   </div>
                 </div>
               </div>
            ) : (
              <div className="text-center py-6">
                <TrendingUpIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No metrics data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Rate Limiting Status */}
        <Card variant="elevated">
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Rate Limiting Status</h4>
            
            {rateLimitLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : rateLimitStatus && rateLimitStatus.length > 0 ? (
              <div className="space-y-4">
                {rateLimitStatus.map((status, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API Key {status.api_key_id.slice(-8)}</span>
                      <span className="text-sm font-semibold">
                        {status.current_usage} / {status.limit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status.percentage_used > 0.8 ? 'bg-red-500' :
                          status.percentage_used > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(status.percentage_used * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round(status.percentage_used * 100)}% used</span>
                      <span>Resets: {new Date(status.reset_time).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <ShieldIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No rate limit data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card variant="elevated">
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">System Health Indicators</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h5 className="font-semibold text-gray-900">API Gateway</h5>
              <p className="text-sm text-green-600">Operational</p>
              <p className="text-xs text-gray-500 mt-1">99.99% uptime</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h5 className="font-semibold text-gray-900">Database</h5>
              <p className="text-sm text-green-600">Operational</p>
              <p className="text-xs text-gray-500 mt-1">Response time: 12ms</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircleIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h5 className="font-semibold text-gray-900">External Services</h5>
              <p className="text-sm text-yellow-600">Degraded</p>
              <p className="text-xs text-gray-500 mt-1">1 service experiencing issues</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 