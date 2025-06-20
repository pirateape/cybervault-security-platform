import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuditLogWidget } from './AuditLogWidget';
import * as auditLogApi from '../../../data-access/auditLogApi';
import '@testing-library/jest-dom';

describe('AuditLogWidget', () => {
  const mockLogs = [
    {
      id: '1',
      timestamp: '2024-07-01T12:00:00Z',
      event_type: 'login',
      user_id: 'user-1',
      resource: 'dashboard',
      resource_id: 'dash-1',
      outcome: 'success',
      ip_address: '127.0.0.1',
    },
    {
      id: '2',
      timestamp: '2024-07-01T13:00:00Z',
      event_type: 'scan',
      user_id: 'user-2',
      resource: 'scanner',
      resource_id: 'scan-1',
      outcome: 'failure',
      ip_address: '127.0.0.2',
    },
  ];

  beforeEach(() => {
    jest.spyOn(auditLogApi, 'useAuditLogs').mockReturnValue({
      data: mockLogs,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders audit log table with data', () => {
    render(<AuditLogWidget />);
    expect(screen.getByLabelText(/audit log widget/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit Log/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/scan/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.spyOn(auditLogApi, 'useAuditLogs').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);
    render(<AuditLogWidget />);
    expect(screen.getByText(/Loading audit logs/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    jest.spyOn(auditLogApi, 'useAuditLogs').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to fetch' },
      refetch: jest.fn(),
    } as any);
    render(<AuditLogWidget />);
    expect(screen.getByText(/Error loading audit logs/i)).toBeInTheDocument();
  });

  it('shows empty state', () => {
    jest.spyOn(auditLogApi, 'useAuditLogs').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
    render(<AuditLogWidget />);
    expect(screen.getByText(/No audit logs found/i)).toBeInTheDocument();
  });

  it('filters by event type', () => {
    render(<AuditLogWidget />);
    const input = screen.getByPlaceholderText(/event type/i);
    fireEvent.change(input, { target: { value: 'login' } });
    expect(input).toHaveValue('login');
  });

  it('paginates results', () => {
    render(<AuditLogWidget data={{ pageSize: 1 }} />);
    expect(screen.getByText(/Page 1/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Next page/i));
    expect(screen.getByText(/Page 2/i)).toBeInTheDocument();
  });

  it('is accessible with aria-label and tabIndex', () => {
    render(<AuditLogWidget />);
    const widget = screen.getByLabelText(/audit log widget/i);
    expect(widget).toHaveAttribute('tabindex');
  });

  // Advanced: CSV export and row details (stub for now)
  it('has CSV export button (future)', () => {
    // TODO: Implement CSV export button and test
  });
  it('shows row details on click (future)', () => {
    // TODO: Implement row details modal and test
  });
  it('renders timeline view (future)', () => {
    // TODO: Implement timeline view and test
  });
});
