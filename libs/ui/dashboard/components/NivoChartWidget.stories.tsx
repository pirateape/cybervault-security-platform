import React from 'react';
import { NivoChartWidget } from './NivoChartWidget';
import { ResponsiveBar } from '@nivo/bar';

export default {
  title: 'Dashboard/NivoChartWidget',
  component: NivoChartWidget,
  decorators: [
    (Story) => (
      <div style={{ width: '100%', height: '500px' }}>
        <Story />
      </div>
    ),
  ],
};

const barData = [
  { name: 'Alpha', value: 98 },
  { name: 'Beta', value: 87 },
  { name: 'Gamma', value: 76 },
  { name: 'Delta', value: 65 },
];

const lineData = [
  {
    id: 'Compliance',
    color: 'hsl(210, 70%, 50%)',
    data: [
      { x: 'Jan', y: 80 },
      { x: 'Feb', y: 85 },
      { x: 'Mar', y: 90 },
      { x: 'Apr', y: 95 },
      { x: 'May', y: 98 },
    ],
  },
];

const pieData = [
  { id: 'Compliant', label: 'Compliant', value: 72 },
  { id: 'Non-Compliant', label: 'Non-Compliant', value: 18 },
  { id: 'Unknown', label: 'Unknown', value: 10 },
];

export const BarChart = () => (
  <NivoChartWidget
    type="bar"
    data={barData}
    options={{
      keys: ['value'],
      indexBy: 'name',
      colors: { scheme: 'category10' },
      axisBottom: {
        legend: 'Project',
        legendPosition: 'middle',
        legendOffset: 32,
      },
      axisLeft: {
        legend: 'Score',
        legendPosition: 'middle',
        legendOffset: -40,
      },
    }}
    ariaLabel="Bar chart demo"
  />
);

export const LineChart = () => (
  <NivoChartWidget
    type="line"
    data={lineData}
    options={{
      axisBottom: {
        legend: 'Month',
        legendPosition: 'middle',
        legendOffset: 32,
      },
      axisLeft: {
        legend: 'Compliance %',
        legendPosition: 'middle',
        legendOffset: -40,
      },
      enableArea: true,
      colors: { scheme: 'nivo' },
    }}
    ariaLabel="Line chart demo"
  />
);

export const PieChart = () => (
  <NivoChartWidget
    type="pie"
    data={pieData}
    options={{
      colors: { scheme: 'nivo' },
      innerRadius: 0.6,
      padAngle: 1.2,
      cornerRadius: 4,
      arcLabelsTextColor: { from: 'color', modifiers: [['darker', 2]] },
    }}
    ariaLabel="Pie chart demo"
  />
);

export const MinimalNivoChart = () => (
  <div style={{ height: 400, width: 600 }}>
    <ResponsiveBar
      data={[{ name: 'Alpha', value: 98 }, { name: 'Beta', value: 87 }]}
      keys={['value']}
      indexBy="name"
      margin={{ top: 32, right: 32, bottom: 56, left: 48 }}
      padding={0.3}
      colors={{ scheme: 'category10' }}
      axisBottom={{ legend: 'Project', legendPosition: 'middle', legendOffset: 32 }}
      axisLeft={{ legend: 'Score', legendPosition: 'middle', legendOffset: -40 }}
      animate={true}
      enableLabel={true}
      labelSkipWidth={12}
      labelSkipHeight={12}
    />
  </div>
);

// Debug component to bypass auth permissions
const DirectBarChart = () => {
  const data = [{ name: 'Alpha', value: 98 }, { name: 'Beta', value: 87 }];
  
  return (
    <div style={{ height: 400, width: 600, border: '1px solid #ccc', padding: '16px' }}>
      <h3>Debug: Direct Bar Chart</h3>
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="name"
        margin={{ top: 32, right: 32, bottom: 56, left: 48 }}
        padding={0.3}
        colors={{ scheme: 'category10' }}
        axisBottom={{ legend: 'Project', legendPosition: 'middle', legendOffset: 32 }}
        axisLeft={{ legend: 'Score', legendPosition: 'middle', legendOffset: -40 }}
        animate={false}
        enableLabel={true}
        labelSkipWidth={12}
        labelSkipHeight={12}
      />
    </div>
  );
};

export const DebugBarChart = DirectBarChart;

// Test chart without permission checks
const ChartWithoutAuth = ({ type, data, options = {}, className, ariaLabel }) => {
  const isDark = false; // Force light theme for testing
  const theme = {
    textColor: '#22223b',
    axis: {
      domain: { line: { stroke: '#ccc', strokeWidth: 1 } },
      legend: { text: { fill: '#22223b' } },
      ticks: {
        line: { stroke: '#ccc', strokeWidth: 1 },
        text: { fill: '#22223b' },
      },
    },
    grid: { line: { stroke: '#eee', strokeWidth: 1 } },
    legends: { text: { fill: '#22223b' } },
    tooltip: {
      container: {
        background: '#fff',
        color: '#22223b',
        fontSize: 14,
      },
    },
  };

  let chart = null;
  if (type === 'bar') {
    chart = (
      <ResponsiveBar
        data={data}
        keys={options.keys || ['value']}
        indexBy={options.indexBy || 'name'}
        margin={options.margin || { top: 32, right: 32, bottom: 56, left: 48 }}
        padding={0.3}
        colors={options.colors || { scheme: 'category10' }}
        theme={theme}
        animate={false}
        enableLabel={true}
        labelSkipWidth={12}
        labelSkipHeight={12}
        {...options}
      />
    );
  }

  return (
    <div
      style={{ height: '400px', width: '600px', border: '1px solid #ccc', padding: '16px' }}
      aria-label={ariaLabel || `${type} chart widget`}
    >
      <h3>Chart Without Auth Check</h3>
      {chart}
    </div>
  );
};

export const TestWithoutAuth = () => (
  <ChartWithoutAuth
    type="bar"
    data={barData}
    options={{
      keys: ['value'],
      indexBy: 'name',
      colors: { scheme: 'category10' },
      axisBottom: {
        legend: 'Project',
        legendPosition: 'middle',
        legendOffset: 32,
      },
      axisLeft: {
        legend: 'Score',
        legendPosition: 'middle',
        legendOffset: -40,
      },
    }}
    ariaLabel="Test bar chart without auth"
  />
);
