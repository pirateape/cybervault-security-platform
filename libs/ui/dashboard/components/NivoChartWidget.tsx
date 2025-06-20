import * as React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { useHasPermission } from '../../../hooks/authProvider';

export interface NivoChartWidgetProps {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  options?: Record<string, any>;
  className?: string;
  ariaLabel?: string;
}

export const NivoChartWidget: React.FC<NivoChartWidgetProps> = (props) => {
  const canViewDashboard = useHasPermission('view_dashboard');
  const canViewReports = useHasPermission('view_reports');
  const canView = canViewDashboard || canViewReports;
  
  // Debug logging
  console.log('NivoChartWidget Debug:', {
    canViewDashboard,
    canViewReports,
    canView,
    type: props.type
  });
  
  // During SSR/build, be permissive to avoid empty static pages
  if (typeof window === 'undefined' && !canView) {
    // Return a placeholder during SSR
    return (
      <div className="card bg-white border border-zinc-200 shadow-lg rounded-xl p-6 flex flex-col items-center justify-center">
        <span style={{ color: '#6b7280' }}>Loading chart...</span>
      </div>
    );
  }
  
  if (!canView) {
    console.log('NivoChartWidget: Permission denied, returning null');
    return <div style={{padding: '20px', border: '2px solid red'}}>Permission Denied: Cannot view dashboard or reports</div>;
  }

  const { type, data, options = {}, className, ariaLabel } = props;
  // Theme-aware colors
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

  // Chart rendering
  let chart: React.ReactNode = null;
  switch (type) {
    case 'bar':
      chart = (
        <ResponsiveBar
          data={data}
          keys={options.keys || ['value']}
          indexBy={options.indexBy || 'name'}
          margin={options.margin || { top: 32, right: 32, bottom: 56, left: 48 }}
          padding={0.3}
          colors={options.colors || { scheme: isDark ? 'nivo' : 'category10' }}
          theme={theme}
          animate={true}
          enableLabel={true}
          labelSkipWidth={12}
          labelSkipHeight={12}
          {...options}
        />
      );
      break;
    case 'line':
      chart = (
        <ResponsiveLine
          data={data}
          margin={options.margin || { top: 32, right: 32, bottom: 56, left: 48 }}
          xScale={options.xScale || { type: 'point' }}
          yScale={options.yScale || { type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          axisBottom={options.axisBottom || { orient: 'bottom', legend: options.xLegend || '', legendOffset: 36, legendPosition: 'middle' }}
          axisLeft={options.axisLeft || { orient: 'left', legend: options.yLegend || '', legendOffset: -40, legendPosition: 'middle' }}
          colors={options.colors || { scheme: isDark ? 'nivo' : 'category10' }}
          theme={theme}
          enablePoints={true}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          enableArea={options.enableArea || false}
          useMesh={true}
          animate={true}
          {...options}
        />
      );
      break;
    case 'pie':
      chart = (
        <ResponsivePie
          data={data}
          margin={options.margin || { top: 32, right: 32, bottom: 56, left: 48 }}
          innerRadius={options.innerRadius || 0.5}
          padAngle={options.padAngle || 0.7}
          cornerRadius={options.cornerRadius || 3}
          colors={options.colors || { scheme: isDark ? 'nivo' : 'category10' }}
          borderWidth={options.borderWidth || 1}
          borderColor={options.borderColor || { from: 'color', modifiers: [['darker', 0.2]] }}
          theme={theme}
          animate={true}
          enableArcLabels={true}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={options.arcLabelsTextColor || { from: 'color', modifiers: [['darker', 2]] }}
          {...options}
        />
      );
      break;
    default:
      chart = <div className="text-zinc-400 dark:text-zinc-600">Unsupported chart type: {type}</div>;
  }

  return (
    <div
      className={`card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl p-6 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
      tabIndex={0}
      aria-label={ariaLabel || `${type} chart widget`}
      role="region"
    >
      {chart}
    </div>
  );
}; 