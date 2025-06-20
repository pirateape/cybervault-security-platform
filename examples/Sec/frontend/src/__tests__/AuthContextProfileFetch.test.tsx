import '@testing-library/jest-dom';
import { render, waitFor, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as React from 'react';

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => ({
              // Will be replaced per test
            }),
          }),
        }),
      }),
    }),
  };
});

describe('AuthContext - Supabase Profile Fetch Edge Cases', () => {
  function TestComponent() {
    const { user, loading } = useAuth();
    return (
      <div>
        <div data-testid="user">{user ? user.id : 'none'}</div>
        <div data-testid="loading">{loading ? 'yes' : 'no'}</div>
      </div>
    );
  }

  it('handles 406 error (profile not found) gracefully', async () => {
    // Mock .single() to return 406
    const supabase = require('@supabase/supabase-js').createClient();
    supabase.from().select().eq().single = () => ({
      data: null,
      error: { status: 406 },
      status: 406,
    });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('none');
    });
  });

  it('handles successful profile fetch', async () => {
    const supabase = require('@supabase/supabase-js').createClient();
    supabase.from().select().eq().single = () => ({
      data: {
        id: 'user-1',
        org_id: 'org-1',
        role: 'admin',
        full_name: 'Test User',
      },
      error: null,
      status: 200,
    });
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('user-1');
    });
  });
});
