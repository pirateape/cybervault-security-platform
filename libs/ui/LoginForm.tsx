'use client';

// LoginForm: Modular login form using AuthProvider
// Usage: <LoginForm />
import React, { useState } from 'react';
import { useAuth } from '../hooks/authProvider';
import { GoogleIcon, GithubIcon } from './Icons'; // Assuming you have these icons

export function LoginForm() {
  const { login, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      // The auth provider will handle the redirect on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setLoading(false);
    }
  };
  
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    try {
        await signInWithProvider(provider);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-text">Welcome to CyberVault</h1>
        
        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleSocialLogin('google')} disabled={loading} className="flex items-center justify-center w-full px-4 py-2 border border-border/50 rounded-md shadow-sm text-sm font-medium text-text-secondary bg-surface hover:bg-primary/5">
                <GoogleIcon className="w-5 h-5 mr-2" />
                Sign in with Google
            </button>
            <button onClick={() => handleSocialLogin('github')} disabled={loading} className="flex items-center justify-center w-full px-4 py-2 border border-border/50 rounded-md shadow-sm text-sm font-medium text-text-secondary bg-surface hover:bg-primary/5">
                <GithubIcon className="w-5 h-5 mr-2" />
                Sign in with GitHub
            </button>
        </div>

        <div className="flex items-center justify-center space-x-2">
            <hr className="w-full border-border/20" />
            <span className="text-xs text-text-secondary">OR</span>
            <hr className="w-full border-border/20" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-text-secondary">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-background border border-border/50 rounded-md shadow-sm placeholder-text-secondary/50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-text-secondary">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-background border border-border/50 rounded-md shadow-sm placeholder-text-secondary/50 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-btn-primary-text bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-active disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
