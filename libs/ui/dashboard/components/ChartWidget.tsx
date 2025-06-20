import * as React from 'react';
import type { ChartWidgetData } from '../types/widget';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { useHasPermission } from '../../../hooks/authProvider';
import { Card } from '../../primitives';

interface ChartWidgetProps {
  data: ChartWidgetData;
  className?: string;
}

// Custom Tooltip for accessibility
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="bg-white dark:bg-zinc-900 p-2 rounded shadow text-xs"
      >
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-zinc-700 dark:text-zinc-200">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Custom Axis Tick for better readability
const CustomizedAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-35)"
      >
        {payload.value}
      </text>
    </g>
  );
};

export const ChartWidget: React.FC<ChartWidgetProps> = ({ data, className }) => {
  const canView = useHasPermission('view_dashboard') || useHasPermission('view_reports');
  if (!canView) {
    return null;
  }

  // SSR/CSR safety: ResponsiveContainer with initialDimension
  const chartProps = {
    width: '100%',
    height: 320,
    initialDimension: { width: 520, height: 320 },
  };

  let chartContent: React.ReactNode = null;
  const chartData = Array.isArray(data.data) ? data.data : [];
  const options = data.options || {};

  // Validation: Check if chartData is empty or invalid
  if (!Array.isArray(data.data) || chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        tabIndex={0}
        aria-label={data.type + ' chart widget'}
        aria-live="polite"
        role="region"
        className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
      >
        <Card className="w-full h-full bg-transparent shadow-none p-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
            {data.type.charAt(0).toUpperCase() + data.type.slice(1)} Chart
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[120px]">
            <div className="text-center">
              <div className="text-zinc-400 dark:text-zinc-600 text-lg mb-2">
                📊
              </div>
              <div className="text-zinc-400 dark:text-zinc-600 text-sm">
                No data available
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  switch (data.type) {
    case 'bar':
      chartContent = (
        <ResponsiveContainer {...chartProps}>
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={options.xKey || 'name'}
              tick={<CustomizedAxisTick />}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey={options.yKey || 'value'}
              fill="#3182ce"
              barSize={32}
              radius={[8, 8, 0, 0]}
            >
              {chartData.map((entry: any, idx: number) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={
                    options.colors?.[idx % options.colors.length] || '#3182ce'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
      break;
    case 'line':
      chartContent = (
        <ResponsiveContainer {...chartProps}>
          <LineChart
            data={chartData}
            margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={options.xKey || 'name'}
              tick={<CustomizedAxisTick />}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={options.yKey || 'value'}
              stroke="#38a169"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
      break;
    case 'pie':
      chartContent = (
        <ResponsiveContainer {...chartProps} height={280}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Pie
              data={chartData}
              dataKey={options.yKey || 'value'}
              nameKey={options.xKey || 'name'}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#805ad5"
              label
            >
              {chartData.map((entry: any, idx: number) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={
                    options.colors?.[idx % options.colors.length] || '#805ad5'
                  }
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
      break;
    case 'area':
      chartContent = (
        <ResponsiveContainer {...chartProps}>
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182ce" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3182ce" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={options.xKey || 'name'}
              tick={<CustomizedAxisTick />}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey={options.yKey || 'value'}
              stroke="#3182ce"
              fillOpacity={1}
              fill="url(#colorArea)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
      break;
    default:
      chartContent = (
        <div className="flex-1 flex items-center justify-center min-h-[120px] animate-pulse bg-gradient-to-br from-zinc-100/60 dark:from-zinc-800/60 to-zinc-200/40 dark:to-zinc-900/40 rounded-lg">
          <span className="text-zinc-400 dark:text-zinc-600 text-lg">
            Chart type not supported
          </span>
        </div>
      );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      tabIndex={0}
      aria-label={data.type + ' chart widget'}
      aria-live="polite"
      role="region"
      className={`group flex flex-col items-start transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${className ?? ''}`.trim()}
    >
      <Card className="w-full h-full bg-transparent shadow-none p-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
          {data.type.charAt(0).toUpperCase() + data.type.slice(1)} Chart
        </div>
        <div className="flex-1 flex items-center justify-center min-h-[120px]">
          {chartContent}
        </div>
      </Card>
    </motion.div>
  );
};
