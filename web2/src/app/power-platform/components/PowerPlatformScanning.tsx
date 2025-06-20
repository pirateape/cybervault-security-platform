'use client';

import React, { useState, useMemo } from 'react';
import {
  FiPlay,
  FiPause,
  FiRefreshCw,
  FiDownload,
  FiSettings,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiActivity,
  FiEye,
  FiFilter,
  FiCalendar,
  FiTarget,
  FiDatabase,
  FiShield,
} from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';

interface PowerPlatformScanningProps {
  orgId: string;
}

interface ScanResult {
  id: string;
  scanType: 'full' | 'security' | 'compliance' | 'performance';
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  startTime: string;
  endTime?: string;
  duration?: number;
  progress: number;
  results: {
    totalResources: number;
    issuesFound: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  environments: string[];
  triggeredBy: string;
  reportUrl?: string;
}

interface ScanConfiguration {
  scanTypes: string[];
  environments: string[];
  schedule: string;
  notifications: boolean;
  autoRemediation: boolean;
}

export function PowerPlatformScanning({ orgId }: PowerPlatformScanningProps) {
  const [selectedScanType, setSelectedScanType] = useState<string>('full');
  const [selectedEnvironments, setSelectedEnvironments] = useState<string[]>(['production']);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isScanning, setIsScanning] = useState(false);

  // Mock loading state for now - replace with actual API call later
  const isLoading = false;
  const error = null;
  const refetch = () => console.log('Refreshing scan data...');

  // Mock scan results data
  const scanResults: ScanResult[] = useMemo(() => [
    {
      id: 'scan-001',
      scanType: 'full',
      status: 'completed',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      duration: 3600,
      progress: 100,
      results: {
        totalResources: 245,
        issuesFound: 23,
        criticalIssues: 3,
        highIssues: 7,
        mediumIssues: 10,
        lowIssues: 3,
      },
      environments: ['Production', 'Development'],
      triggeredBy: 'System Admin',
      reportUrl: '/reports/scan-001.pdf',
    },
    {
      id: 'scan-002',
      scanType: 'security',
      status: 'running',
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      progress: 65,
      results: {
        totalResources: 156,
        issuesFound: 8,
        criticalIssues: 1,
        highIssues: 3,
        mediumIssues: 4,
        lowIssues: 0,
      },
      environments: ['Production'],
      triggeredBy: 'Security Team',
    },
    {
      id: 'scan-003',
      scanType: 'compliance',
      status: 'completed',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      duration: 2400,
      progress: 100,
      results: {
        totalResources: 189,
        issuesFound: 15,
        criticalIssues: 2,
        highIssues: 5,
        mediumIssues: 6,
        lowIssues: 2,
      },
      environments: ['Production', 'Staging'],
      triggeredBy: 'Compliance Officer',
      reportUrl: '/reports/scan-003.pdf',
    },
    {
      id: 'scan-004',
      scanType: 'performance',
      status: 'failed',
      startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
      progress: 45,
      results: {
        totalResources: 78,
        issuesFound: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      },
      environments: ['Development'],
      triggeredBy: 'DevOps Team',
    },
    {
      id: 'scan-005',
      scanType: 'full',
      status: 'scheduled',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      progress: 0,
      results: {
        totalResources: 0,
        issuesFound: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      },
      environments: ['Production', 'Development', 'Staging'],
      triggeredBy: 'Scheduled Task',
    },
  ], []);

  const filteredScans = useMemo(() => {
    return scanResults.filter(scan => {
      const statusMatch = filterStatus === 'all' || scan.status === filterStatus;
      return statusMatch;
    });
  }, [scanResults, filterStatus]);

  const scanStats = useMemo(() => {
    const total = scanResults.length;
    const running = scanResults.filter(s => s.status === 'running').length;
    const completed = scanResults.filter(s => s.status === 'completed').length;
    const failed = scanResults.filter(s => s.status === 'failed').length;
    const totalIssues = scanResults
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.results.issuesFound, 0);

    return { total, running, completed, failed, totalIssues };
  }, [scanResults]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScanTypeColor = (scanType: string) => {
    switch (scanType) {
      case 'full': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'security': return 'bg-red-100 text-red-800 border-red-200';
      case 'compliance': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'performance': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return FiCheckCircle;
      case 'running': return FiActivity;
      case 'failed': return FiXCircle;
      case 'scheduled': return FiClock;
      default: return FiActivity;
    }
  };

  const getSeverityColor = (count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    if (percentage > 20) return 'text-red-600';
    if (percentage > 10) return 'text-orange-600';
    if (percentage > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  const startScan = async () => {
    setIsScanning(true);
    console.log('Starting scan...', { scanType: selectedScanType, environments: selectedEnvironments });
    // Simulate scan duration
    setTimeout(() => {
      setIsScanning(false);
      console.log('Scan completed');
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading scan data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-400 mr-2" />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Scan Data</h3>
            <p className="text-red-600 text-sm">Failed to load scan data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scan Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Power Platform Scanning</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={refetch}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Refresh scan data"
            >
              <FiRefreshCw size={16} />
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <FiSettings size={14} className="mr-1" />
              Configure
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{scanStats.total}</div>
            <div className="text-sm text-gray-600">Total Scans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{scanStats.running}</div>
            <div className="text-sm text-gray-600">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{scanStats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{scanStats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{scanStats.totalIssues}</div>
            <div className="text-sm text-gray-600">Issues Found</div>
          </div>
        </div>
      </div>

      {/* Start New Scan */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Start New Scan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scan Type</label>
            <div className="space-y-2">
              {[
                { value: 'full', label: 'Full Scan', desc: 'Complete security, compliance, and performance analysis' },
                { value: 'security', label: 'Security Scan', desc: 'Focus on security vulnerabilities and threats' },
                { value: 'compliance', label: 'Compliance Scan', desc: 'Check regulatory and policy compliance' },
                { value: 'performance', label: 'Performance Scan', desc: 'Analyze performance and optimization opportunities' },
              ].map((type) => (
                <label key={type.value} className="flex items-start cursor-pointer">
                  <input
                    type="radio"
                    name="scanType"
                    value={type.value}
                    checked={selectedScanType === type.value}
                    onChange={(e) => setSelectedScanType(e.target.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Environments</label>
            <div className="space-y-2">
              {['production', 'staging', 'development'].map((env) => (
                <label key={env} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEnvironments.includes(env)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEnvironments([...selectedEnvironments, env]);
                      } else {
                        setSelectedEnvironments(selectedEnvironments.filter(e => e !== env));
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium text-gray-900 capitalize">{env}</span>
                </label>
              ))}
            </div>

            <button
              onClick={startScan}
              disabled={isScanning || selectedEnvironments.length === 0}
              className={`mt-4 w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium ${
                isScanning || selectedEnvironments.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <FiPlay size={16} className="mr-2" />
                  Start Scan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex gap-1">
            {['all', 'running', 'completed', 'failed', 'scheduled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 text-sm rounded-lg border ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scan Results */}
      <div className="space-y-4">
        {filteredScans.map((scan) => {
          const StatusIcon = getStatusIcon(scan.status);
          return (
            <div key={scan.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-3 flex-1">
                  <StatusIcon 
                    size={20} 
                    className={scan.status === 'completed' ? 'text-green-500' : 
                              scan.status === 'running' ? 'text-blue-500' : 
                              scan.status === 'failed' ? 'text-red-500' : 'text-yellow-500'} 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-gray-900">Scan {scan.id}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getScanTypeColor(scan.scanType)}`}>
                        {scan.scanType.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(scan.status)}`}>
                        {scan.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Environments:</span> {scan.environments.join(', ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Triggered by:</span> {scan.triggeredBy}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Started:</span> {format(new Date(scan.startTime), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {scan.endTime && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Duration:</span> {Math.round((scan.duration || 0) / 60)} minutes
                          </p>
                        )}
                      </div>
                      
                      {scan.status === 'completed' && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Resources Scanned:</span> {scan.results.totalResources}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`${getSeverityColor(scan.results.criticalIssues, scan.results.issuesFound)}`}>
                              Critical: {scan.results.criticalIssues}
                            </div>
                            <div className={`${getSeverityColor(scan.results.highIssues, scan.results.issuesFound)}`}>
                              High: {scan.results.highIssues}
                            </div>
                            <div className={`${getSeverityColor(scan.results.mediumIssues, scan.results.issuesFound)}`}>
                              Medium: {scan.results.mediumIssues}
                            </div>
                            <div className={`${getSeverityColor(scan.results.lowIssues, scan.results.issuesFound)}`}>
                              Low: {scan.results.lowIssues}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {scan.status === 'running' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{scan.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${scan.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  {scan.reportUrl && (
                    <button
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                      title="Download report"
                    >
                      <FiDownload size={14} />
                    </button>
                  )}
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                    title="View details"
                  >
                    <FiEye size={14} />
                  </button>
                  {scan.status === 'running' && (
                    <button
                      className="p-1.5 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                      title="Stop scan"
                    >
                      <FiPause size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredScans.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FiTarget size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No scans match the selected filters</p>
        </div>
      )}
    </div>
  );
} 