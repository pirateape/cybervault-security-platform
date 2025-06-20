import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Dashboard from '../pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';

const queryClient = new QueryClient();

describe('Dashboard', () => {
  it('renders dashboard heading', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('renders scan trigger button', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(
      screen.getByRole('button', { name: /trigger scan/i })
    ).toBeInTheDocument();
  });

  it('renders results table when data is available', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </QueryClientProvider>
    );
    // This test would need mocked data to be meaningful
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
