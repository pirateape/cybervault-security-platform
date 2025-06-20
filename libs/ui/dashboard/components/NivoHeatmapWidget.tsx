import * as React from 'react';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { useHasPermission } from '../../../hooks/authProvider';
import { Box, Text } from '@chakra-ui/react';

// Nivo expects data as an array of series: { id: string, data: Array<{ x: string, y: number }> }
// Rows are defined by 'id', columns by unique 'x' values in the data arrays.
export interface NivoHeatmapWidgetProps {
  data: Array<{ id: string; data: Array<{ x: string; y: number }> }>;
  options?: Record<string, any>;
  className?: string;
  ariaLabel?: string;
}

export const NivoHeatmapWidget: React.FC<NivoHeatmapWidgetProps> = (props) => {
  const canView = useHasPermission('view_dashboard') || useHasPermission('view_reports');
  if (!canView) {
    return null;
  }

  const { data, options = {}, className, ariaLabel } = props;
  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = {
    textColor: isDark ? '#e5e7eb' : '#22223b',
    axis: {
      domain: { line: { stroke: isDark ? '#444' : '#ccc', strokeWidth: 1 } },
      legend: { text: { fill: isDark ? '#e5e7eb' : '#22223b' } },
      ticks: {
        line: { stroke: isDark ? '#444' : '#ccc', strokeWidth: 1 },
        text: { fill: isDark ? '#e5e7eb' : '#22223b' },
      },
    },
    grid: { line: { stroke: isDark ? '#333' : '#eee', strokeWidth: 1 } },
    legends: { text: { fill: isDark ? '#e5e7eb' : '#22223b' } },
    tooltip: {
      container: {
        background: isDark ? '#22223b' : '#fff',
        color: isDark ? '#e5e7eb' : '#22223b',
        fontSize: 14,
      },
    },
  };

  return (
    <div
      className={`card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl p-6 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
      tabIndex={0}
      aria-label={ariaLabel || 'Heatmap widget'}
      role="region"
    >
      <ResponsiveHeatMap
        data={data}
        margin={options.margin || { top: 32, right: 32, bottom: 56, left: 48 }}
        colors={options.colors || { scheme: isDark ? 'nivo' : 'reds' }}
        theme={theme}
        animate={true}
        axisTop={options.axisTop || null}
        axisRight={options.axisRight || null}
        axisBottom={options.axisBottom || { orient: 'bottom', legend: '', legendOffset: 36, legendPosition: 'middle' }}
        axisLeft={options.axisLeft || { orient: 'left', legend: '', legendOffset: -40, legendPosition: 'middle' }}
        borderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
        {...options}
      />
    </div>
  );
}; 