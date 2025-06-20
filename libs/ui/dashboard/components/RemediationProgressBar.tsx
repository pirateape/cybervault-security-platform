import * as React from 'react';
import { Card } from '../../primitives';
import { motion } from 'framer-motion';
import { useHasPermission } from '../../../hooks/authProvider';

interface RemediationProgressBarProps {
  label: string;
  progress: number; // 0-100
  status?: 'in-progress' | 'complete' | 'blocked';
  className?: string;
}

const statusColors = {
  'in-progress': 'bg-blue-500',
  complete: 'bg-green-500',
  blocked: 'bg-red-500',
};

const statusLabels = {
  'in-progress': 'In Progress',
  complete: 'Complete',
  blocked: 'Blocked',
};

export const RemediationProgressBar: React.FC<RemediationProgressBarProps> = (props) => {
  const canView = useHasPermission('view_dashboard') || useHasPermission('view_reports');
  if (!canView) {
    return null;
  }

  // Animate progress changes
  const [displayProgress, setDisplayProgress] = React.useState(props.progress);
  React.useEffect(() => {
    const timeout = setTimeout(() => setDisplayProgress(props.progress), 100);
    return () => clearTimeout(timeout);
  }, [props.progress]);

  return (
    <Card
      variant="elevated"
      tabIndex={0}
      ariaLabel={props.label + ' remediation progress'}
      aria-live="polite"
      role="region"
      className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${props.className ?? ''}`.trim()}
    >
      <div className="flex items-center mb-2 w-full">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex-1">
          {props.label}
        </span>
        <span
          className={`ml-2 text-xs font-bold px-2 py-1 rounded ${
            props.status === 'complete'
              ? 'bg-green-100 text-green-700'
              : props.status === 'blocked'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}
          aria-label={`Status: ${statusLabels[props.status || 'in-progress']}`}
        >
          {statusLabels[props.status || 'in-progress']}
        </span>
      </div>
      <div className="w-full h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full ${statusColors[props.status || 'in-progress']} rounded-full`}
        />
      </div>
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{displayProgress}%</span>
    </Card>
  );
};
