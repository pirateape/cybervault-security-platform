import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComplianceStatusWidget } from './ComplianceStatusWidget';
import * as dashboardApi from '../../../data-access/dashboardApi';
import '@testing-library/jest-dom';

describe('ComplianceStatusWidget', () => {
  const mockReports = [
    {
      id: '1',
      title: 'NIST Security Assessment',
      framework: 'NIST',
      status: 'compliant',
      score: 92,
      lastUpdated: new Date().toISOString(),
      riskLevel: 'low',
      findings: 15,
      remediated: 13,
      organizationalUnit: 'IT Security',
      trend: 'up',
    },
  ];

  beforeEach(() => {
    jest.spyOn(dashboardApi, 'useComplianceReports').mockReturnValue({
      data: mockReports,
      isLoading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders compliance status with data', () => {
    render(<ComplianceStatusWidget />);
    expect(screen.getByLabelText(/compliance status/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance Status/i)).toBeInTheDocument();
    expect(screen.getByText(/NIST/i)).toBeInTheDocument();
    expect(screen.getByText(/92%/i)).toBeInTheDocument();
    expect(screen.getByText(/Good/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: compliant/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.spyOn(dashboardApi, 'useComplianceReports').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    render(<ComplianceStatusWidget />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    jest.spyOn(dashboardApi, 'useComplianceReports').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to fetch' },
    } as any);
    render(<ComplianceStatusWidget />);
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });

  it('shows empty state', () => {
    jest.spyOn(dashboardApi, 'useComplianceReports').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
    render(<ComplianceStatusWidget />);
    expect(
      screen.getByText(/No compliance data available/i)
    ).toBeInTheDocument();
  });

  it('is accessible with aria-label, tabIndex, and aria-live', () => {
    render(<ComplianceStatusWidget />);
    const widget = screen.getByLabelText(/compliance status/i);
    expect(widget).toHaveAttribute('tabindex');
    expect(widget).toHaveAttribute('aria-live', 'polite');
  });
});
