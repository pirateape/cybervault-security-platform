import * as React from 'react';
import type { KPIWidgetData } from '../types/widget';
import { motion } from 'framer-motion';
import { useHasPermission } from '../../../hooks/authProvider';
import { Card } from '../../primitives';

interface KPIWidgetProps {
  data: KPIWidgetData;
  className?: string;
}

const trendColors = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-zinc-500 dark:text-zinc-400',
};

export function KPIWidget({ data, className }: KPIWidgetProps) {
  const canView = useHasPermission('view_dashboard') || useHasPermission('view_reports');
  if (!canView) {
    return null;
  }

  // Animated counter (simple fade-in)
  const [displayValue, setDisplayValue] = React.useState(data.value);
  React.useEffect(() => {
    setDisplayValue(data.value);
  }, [data.value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      tabIndex={0}
      aria-label={data.label + ' KPI'}
      aria-live="polite"
      role="region"
      className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
    >
      <Card className="w-full h-full bg-transparent shadow-none p-0">
        <div className="flex items-center mb-2 w-full">
          {data.icon && (
            <span className="text-3xl mr-3" aria-hidden>
              {data.icon}
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex-1">
            {data.label}
          </span>
          {data.trend && (
            <span
              className={`ml-2 text-lg font-bold ${
                trendColors[data.trend]
              }`.trim()}
              aria-label={`Trend: ${data.trend}`}
            >
              {data.trend === 'up' && '\u25b2'}
              {data.trend === 'down' && '\u25bc'}
              {data.trend === 'neutral' && '\u2013'}
            </span>
          )}
        </div>
        <div className="text-4xl font-extrabold text-zinc-900 dark:text-white transition-all duration-500 animate-fade-in">
          {displayValue}
        </div>
      </Card>
    </motion.div>
  );
}
