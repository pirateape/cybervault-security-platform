import React from 'react';
import { useComplianceReports } from '../../../data-access/dashboardApi';
import { useHasPermission } from '../../../hooks/authProvider';
import { Card } from '../../primitives';
import { motion } from 'framer-motion';

interface ComplianceStatusWidgetProps {
  config?: {
    framework?: string;
  };
  className?: string;
  data?: {
    orgId?: string;
  };
}

const badgeClass = (score: number) => {
  if (score >= 75) return 'bg-green-100 text-green-700 border-green-300';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-red-100 text-red-700 border-red-300';
};

export const ComplianceStatusWidget: React.FC<ComplianceStatusWidgetProps> = ({
  config,
  className,
  data,
}) => {
  const { data: reports, isLoading, error } = useComplianceReports(data?.orgId || 'default-org');
  const canViewDashboard = useHasPermission('view_dashboard');
  const canViewReports = useHasPermission('view_reports');
  const canView = canViewDashboard || canViewReports;
  if (!canView) {
    return null;
  }

  // Filter by framework if provided, else use latest
  const report = React.useMemo((): any => {
    if (!reports || reports.length === 0) return null;
    if (config && config.framework) {
      return reports.find((r) => r.framework === config.framework) || reports[0];
    }
    // Sort by lastUpdated desc if available
    return [...reports].sort((a, b) =>
      (b.lastUpdated || '').localeCompare(a.lastUpdated || '')
    )[0];
  }, [reports, config]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        tabIndex={0}
        aria-label="Compliance Status"
        aria-live="polite"
        role="region"
        className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
      >
        <Card className="w-full h-full p-6 flex flex-col items-center justify-center">
          <span className="animate-spin text-3xl text-blue-500" role="status" aria-label="Loading">⏳</span>
        </Card>
      </motion.div>
    );
  }
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        tabIndex={0}
        aria-label="Compliance Status"
        aria-live="polite"
        role="region"
        className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
      >
        <Card className="w-full h-full p-6 flex flex-col items-center justify-center bg-red-50 border border-red-200">
          <span className="text-red-600 font-semibold">{error.message}</span>
        </Card>
      </motion.div>
    );
  }
  if (!report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        tabIndex={0}
        aria-label="Compliance Status"
        aria-live="polite"
        role="region"
        className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
      >
        <Card className="w-full h-full p-6 flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200">
          <span className="text-zinc-500">No compliance data available.</span>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      tabIndex={0}
      aria-label="Compliance Status"
      aria-live="polite"
      role="region"
      className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
    >
      <Card className="w-full h-full p-6 flex flex-col">
        <span className="text-lg font-bold mb-2">Compliance Status</span>
        <div className="flex items-center justify-between mb-2">
          <span className="text-md font-semibold">
            {report.framework || report.title}
          </span>
          <span className={`ml-2 px-2 py-1 rounded text-xs font-bold border ${badgeClass(report.score)}`} aria-label={`Score: ${report.score}`}>
            {report.score >= 75 ? 'Good' : report.score >= 50 ? 'Fair' : 'Poor'}
          </span>
        </div>
        <div className="flex items-center mb-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mr-4 border-2 border-zinc-200 dark:border-zinc-700">
            <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">{report.score}%</span>
          </div>
          <div className="flex-1">
            <span className="block text-sm text-zinc-700 dark:text-zinc-300 mb-1">
              Last updated: {report.lastUpdated ? new Date(report.lastUpdated).toLocaleDateString() : 'N/A'}
            </span>
            {report.trend && report.trend !== 'stable' && (
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">Trend: {report.trend}</span>
            )}
          </div>
        </div>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Status: {report.status}</span>
      </Card>
    </motion.div>
  );
};