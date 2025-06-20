import * as React from 'react';
import { motion } from 'framer-motion';
import { useHasPermission } from '../../../hooks/authProvider';
import { Card } from '../../primitives';

export interface ScorecardWidgetProps {
  score: number;
  label: string;
  riskLevel: 'low' | 'medium' | 'high';
  icon?: React.ReactNode;
  className?: string;
}

const riskColors = {
  low: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-red-100 text-red-700 border-red-300',
};

export const ScorecardWidget: React.FC<ScorecardWidgetProps> = ({
  score,
  label,
  riskLevel = 'medium', // Default fallback
  icon,
  className,
}) => {
  const canViewDashboard = useHasPermission('view_dashboard');
  const canViewReports = useHasPermission('view_reports');
  const canViewScorecard = canViewDashboard || canViewReports;
  
  // Debug logging
  console.log('ScorecardWidget Debug:', {
    canViewDashboard,
    canViewReports,
    canViewScorecard
  });
  
  // During SSR/build, be permissive to avoid empty static pages
  if (typeof window === 'undefined' && !canViewScorecard) {
    // Return a placeholder during SSR
    return (
      <div className="card bg-white border border-zinc-200 shadow-lg rounded-xl p-6 flex flex-col items-center justify-center">
        <span style={{ color: '#6b7280' }}>Loading scorecard...</span>
      </div>
    );
  }
  
  if (!canViewScorecard) {
    console.log('ScorecardWidget: Permission denied, returning null');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      tabIndex={0}
      aria-label={label + ' scorecard'}
      aria-live="polite"
      role="region"
      className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
    >
      <Card className={`w-full h-full p-6 flex flex-col items-start border shadow-lg rounded-xl ${riskColors[riskLevel] || riskColors.medium}`}>
        <div className="flex items-center mb-2 w-full">
          {icon && (
            <span className="text-3xl mr-3" aria-hidden>
              {icon}
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider flex-1">
            {label}
          </span>
          <span
            className="ml-2 text-lg font-bold"
            aria-label={`Risk: ${riskLevel}`}
          >
            {riskLevel?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
        <div className="text-5xl font-extrabold transition-all duration-500 animate-fade-in">
          {score}%
        </div>
      </Card>
    </motion.div>
  );
};
