import { render, screen } from '@testing-library/react';
import { ScheduledJobsListWidget } from './ScheduledJobsListWidget';

describe('ScheduledJobsListWidget', () => {
  it('renders heading and empty state', () => {
    render(<ScheduledJobsListWidget />);
    expect(screen.getByRole('heading', { name: /Scheduled Jobs/i })).toBeInTheDocument();
    expect(screen.getByText(/No scheduled jobs found/i)).toBeInTheDocument();
  });
  // TODO: Add tests for loading, error, and data-driven states
  // TODO: Add interaction tests (edit, delete, pause)
}); 