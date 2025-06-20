import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Auth } from './Auth';
import { AuthProvider } from '../hooks/authProvider';

// Mock the auth provider
jest.mock('../hooks/authProvider', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signInWithProvider: jest.fn(),
  }),
}));

describe('Auth Component', () => {
  const mockOnAuthSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email login form by default', () => {
    render(
      <AuthProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </AuthProvider>
    );
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.mock('../hooks/authProvider', () => ({
      useAuth: () => ({
        user: null,
        loading: true,
        signInWithProvider: jest.fn(),
      }),
    }));

    render(
      <AuthProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </AuthProvider>
    );
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
  });

  it('renders social login buttons when providers are specified', () => {
    render(
      <AuthProvider>
        <Auth 
          providers={['google', 'github']} 
          onAuthSuccess={mockOnAuthSuccess} 
        />
      </AuthProvider>
    );
    expect(screen.getByTestId('google-login')).toBeInTheDocument();
    expect(screen.getByTestId('github-login')).toBeInTheDocument();
  });

  it('calls onAuthSuccess after successful login', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ user: { id: '123' } });
    jest.mock('../hooks/authProvider', () => ({
      useAuth: () => ({
        user: null,
        loading: false,
        signInWithProvider: mockSignIn,
      }),
    }));

    render(
      <AuthProvider>
        <Auth onAuthSuccess={mockOnAuthSuccess} />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('google-login'));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google');
      expect(mockOnAuthSuccess).toHaveBeenCalled();
    });
  });
}); 