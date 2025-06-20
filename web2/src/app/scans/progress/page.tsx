'use client';

import React, { useState, useEffect } from 'react';
import {
  useRunningScanProgress, 
  useScanProgress,
  useScanProgressStats,
  useUpdateScanStatus,
} from '@data-access/scanApi';
import { formatDistanceToNow, format } from 'date-fns';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock user data - in real app this would come from auth context
const mockUser = {
  id: 'user-123',
  org_id: 'org-456',
  name: 'John Doe',
  email: 'john@example.com'
};

interface ScanProgressVisualizationProps {
  scanId: string;
  scanName: string;
}

const ScanProgressVisualization: React.FC<ScanProgressVisualizationProps> = ({ scanId, scanName }) => {
  const { data: progressData, refetch } = useScanProgress(scanId);
  const updateScanStatus = useUpdateScanStatus();
  const [showDetails, setShowDetails] = useState(false);

  if (!progressData) {
    return (
      <div className="p-4 border rounded-lg bg-white shadow">
        <p>Loading progress data...</p>
      </div>
    );
  }

  const handleScanAction = async (action: 'pause' | 'resume' | 'stop') => {
    try {
      await updateScanStatus.mutateAsync({ 
        scanId, 
        status: action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'cancelled'
      });
      
      alert(`Scan ${action} request sent successfully`);
      refetch();
    } catch (error) {
      alert(`Failed to ${action} scan`);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return '#ef4444';
    if (progress < 50) return '#f97316';
    if (progress < 75) return '#eab308';
    return '#22c55e';
  };

  const formatETA = (seconds: number | null) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">{scanName}</h3>
          <p className="text-sm text-gray-600">Stage: {progressData.current_stage}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleScanAction('pause')}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            title="Pause Scan"
          >
            Pause
          </button>
          <button
            onClick={() => handleScanAction('resume')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            title="Resume Scan"
          >
            Resume
          </button>
          <button
            onClick={() => handleScanAction('stop')}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            title="Stop Scan"
          >
            Stop
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="View Details"
          >
            Details
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Progress Bar */}
                 <div className="space-y-2">
           <div className="flex justify-between text-sm">
             <span>Progress: {progressData.progress.toFixed(1)}%</span>
             <span>ETA: {formatETA(progressData.estimated_remaining_seconds)}</span>
           </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progressData.progress}%`,
                backgroundColor: getProgressColor(progressData.progress)
              }}
            />
          </div>
        </div>

                 {/* Key Stats */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="text-center p-3 bg-gray-50 rounded">
             <div className="text-2xl font-bold text-blue-600">{progressData.stages_completed}</div>
             <div className="text-sm text-gray-600">Stages Completed</div>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded">
             <div className="text-2xl font-bold text-green-600">{progressData.total_stages}</div>
             <div className="text-sm text-gray-600">Total Stages</div>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded">
             <div className="text-2xl font-bold text-orange-600">{progressData.warning_count || 0}</div>
             <div className="text-sm text-gray-600">Warnings</div>
           </div>
           <div className="text-center p-3 bg-gray-50 rounded">
             <div className="text-2xl font-bold text-red-600">{progressData.error_count || 0}</div>
             <div className="text-sm text-gray-600">Errors</div>
           </div>
         </div>

        {/* Detailed Progress Visualization */}
        {showDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-lg font-semibold mb-4">Detailed Progress</h4>
            
            {/* Stage Progress */}
            <div className="mb-6">
              <h5 className="font-medium mb-2">Scan Stages</h5>
              <div className="space-y-2">
                {progressData.stages?.map((stage, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      stage.status === 'completed' ? 'bg-green-500' :
                      stage.status === 'running' ? 'bg-blue-500 animate-pulse' :
                      stage.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <span className="flex-1">{stage.name}</span>
                    <span className="text-sm text-gray-600">{stage.progress}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics Chart */}
            <div className="mb-6">
              <h5 className="font-medium mb-2">Performance Metrics</h5>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer>
                  <LineChart data={progressData.throughput_history || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      labelFormatter={(timestamp) => format(new Date(timestamp), 'MMM dd, HH:mm:ss')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="targets_per_minute" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Targets/min"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Progress Distribution */}
            <div>
              <h5 className="font-medium mb-2">Progress Distribution</h5>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: progressData.targets_scanned, fill: '#22c55e' },
                        { name: 'Remaining', value: progressData.total_targets - progressData.targets_scanned, fill: '#e5e7eb' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    />
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ScanProgressTrackingDashboard() {
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds default
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: runningScans, refetch: refetchRunningScans } = useRunningScanProgress(mockUser.org_id);
  const { data: progressStats } = useScanProgressStats(mockUser.org_id);

  // Auto-refresh running scans
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchRunningScans();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetchRunningScans]);

  const runningScansArray = runningScans || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan Progress Tracking</h1>
          <p className="text-gray-600">Monitor real-time progress of active security scans</p>
        </div>

        {/* Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Auto Refresh:</label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Interval:</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                disabled={!autoRefresh}
                className="px-3 py-1 border rounded"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
              </select>
            </div>
            <button
              onClick={() => refetchRunningScans()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* Progress Stats Overview */}
        {progressStats && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-blue-600">{progressStats.running_scans_count}</div>
              <div className="text-sm text-gray-600">Running Scans</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-green-600">
                {progressStats.average_completion_rate?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-600">Avg Completion</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progressStats.total_targets_in_progress || 0}
              </div>
              <div className="text-sm text-gray-600">Targets in Progress</div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatDistanceToNow(new Date(progressStats.oldest_scan_start_time || Date.now()))}
              </div>
              <div className="text-sm text-gray-600">Oldest Running</div>
            </div>
          </div>
        )}

        {/* Running Scans */}
        <div className="space-y-4">
          {runningScansArray.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow">
              <p className="text-gray-500">No active scans found</p>
              <p className="text-sm text-gray-400 mt-2">Start a new scan to see progress tracking here</p>
            </div>
          ) : (
            runningScansArray.map((scan) => (
              <ScanProgressVisualization
                key={scan.id}
                scanId={scan.id}
                scanName={scan.name}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 