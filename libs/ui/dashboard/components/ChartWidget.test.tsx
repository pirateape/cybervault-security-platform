// ChartWidget unit/integration tests
// Requires: @testing-library/react, @types/jest (install as dev dependencies)
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChartWidget } from './ChartWidget';
import type { ChartWidgetData } from '../types/widget';

// Jest globals for type checking
import '@testing-library/jest-dom';

describe('ChartWidget', () => {
  const baseData: ChartWidgetData = {
    type: 'bar',
    data: [
      { name: 'A', value: 10 },
      { name: 'B', value: 20 },
    ],
    options: {},
  };

  it('renders a bar chart', () => {
    render(<ChartWidget data={{ ...baseData, type: 'bar' }} />);
    expect(screen.getByLabelText(/bar chart widget/i)).toBeInTheDocument();
    expect(screen.getByText(/Bar Chart/i)).toBeInTheDocument();
  });

  it('renders a line chart', () => {
    render(<ChartWidget data={{ ...baseData, type: 'line' }} />);
    expect(screen.getByLabelText(/line chart widget/i)).toBeInTheDocument();
    expect(screen.getByText(/Line Chart/i)).toBeInTheDocument();
  });

  it('renders a pie chart', () => {
    render(<ChartWidget data={{ ...baseData, type: 'pie' }} />);
    expect(screen.getByLabelText(/pie chart widget/i)).toBeInTheDocument();
    expect(screen.getByText(/Pie Chart/i)).toBeInTheDocument();
  });

  it('renders an area chart', () => {
    render(<ChartWidget data={{ ...baseData, type: 'area' }} />);
    expect(screen.getByLabelText(/area chart widget/i)).toBeInTheDocument();
    expect(screen.getByText(/Area Chart/i)).toBeInTheDocument();
  });

  it('shows fallback for unsupported chart type', () => {
    render(<ChartWidget data={{ ...baseData, type: 'unknown' as any }} />);
    expect(screen.getByText(/Chart type not supported/i)).toBeInTheDocument();
  });

  it('is accessible with aria-label and role', () => {
    render(<ChartWidget data={baseData} />);
    const widget = screen.getByLabelText(/bar chart widget/i);
    expect(widget).toHaveAttribute('tabindex');
  });
});
