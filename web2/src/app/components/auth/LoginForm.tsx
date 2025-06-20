'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { login, signInWithGoogle, signInWithGitHub, signInWithAzure } from '../../auth/actions';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    await login(formData);
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'azure') => {
    setSocialLoading(provider);
    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'github':
          await signInWithGitHub();
          break;
        case 'azure':
          await signInWithAzure();
          break;
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setSocialLoading(null);
    }
  };

  // Reusable style objects
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-16)',
      background: 'linear-gradient(135deg, var(--color-background) 0%, var(--color-surface) 100%)'
    },
    card: {
      maxWidth: '420px',
      width: '100%',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-card-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: 'var(--space-32)'
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: 'var(--space-32)'
    },
    logo: {
      width: '48px',
      height: '48px',
      backgroundColor: 'var(--color-primary)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto var(--space-16) auto',
      color: 'white',
      fontWeight: 'var(--font-weight-bold)',
      fontSize: '24px'
    },
    title: {
      fontSize: 'var(--font-size-3xl)',
      fontWeight: 'var(--font-weight-semibold)',
      color: 'var(--color-text)',
      marginBottom: 'var(--space-8)',
      margin: '0 0 var(--space-8) 0'
    },
    subtitle: {
      color: 'var(--color-text-secondary)',
      fontSize: 'var(--font-size-base)',
      margin: '0'
    },
    errorMessage: {
      marginBottom: 'var(--space-24)',
      padding: 'var(--space-16)',
      backgroundColor: 'rgba(var(--color-error-rgb), var(--status-bg-opacity))',
      border: '1px solid rgba(var(--color-error-rgb), var(--status-border-opacity))',
      borderRadius: 'var(--radius-md)',
      color: 'var(--color-error)',
      fontSize: 'var(--font-size-sm)'
    },
    socialSection: {
      marginBottom: 'var(--space-24)'
    },
    socialButtonsContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 'var(--space-12)'
    },
    socialButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-12)',
      height: '48px',
      width: '100%',
      padding: 'var(--space-12) var(--space-16)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      fontSize: 'var(--font-size-base)',
      fontWeight: 'var(--font-weight-medium)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textDecoration: 'none'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: 'var(--space-24) 0',
      color: 'var(--color-text-secondary)',
      fontSize: 'var(--font-size-sm)'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: 'var(--color-border)'
    },
    dividerText: {
      padding: '0 var(--space-16)'
    },
    formGroup: {
      marginBottom: 'var(--space-20)'
    },
    label: {
      display: 'block',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 'var(--font-weight-medium)',
      color: 'var(--color-text)',
      marginBottom: 'var(--space-8)'
    },
    input: {
      width: '100%',
      padding: 'var(--space-12) var(--space-16)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      fontSize: 'var(--font-size-base)',
      transition: 'all 0.2s ease'
    },
    submitButton: {
      width: '100%',
      height: '48px',
      padding: 'var(--space-12) var(--space-16)',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-primary)',
      color: 'var(--color-btn-primary-text)',
      fontSize: 'var(--font-size-base)',
      fontWeight: 'var(--font-weight-medium)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-8)'
    },
    footer: {
      textAlign: 'center' as const,
      marginTop: 'var(--space-24)',
      fontSize: 'var(--font-size-sm)',
      color: 'var(--color-text-secondary)'
    },
    footerLink: {
      color: 'var(--color-primary)',
      textDecoration: 'none',
      fontWeight: 'var(--font-weight-medium)'
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  const LoadingSpinner = () => (
    <div style={styles.loadingSpinner} />
  );

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const GitHubIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );

  const AzureIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.05 1.24L8.4 12.74l8.84 9.02H24L13.05 1.24zM1.29 15.35L9.53 1.95l3.84 10.79-6.65 6.65-5.43-4.04z"/>
    </svg>
  );

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div className="logo" style={styles.logo}>
            CV
          </div>
          <h1 style={styles.title}>
            Welcome back
          </h1>
          <p style={styles.subtitle}>
            Sign in to your CyberVault account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="status status--error" style={styles.errorMessage}>
            {decodeURIComponent(error)}
          </div>
        )}

        {/* Social Login Buttons */}
        <div style={styles.socialSection}>
          <div style={styles.socialButtonsContainer}>
            <form action={() => handleSocialLogin('google')}>
              <button
                type="submit"
                disabled={socialLoading !== null}
                className="btn btn--outline btn--full-width"
                style={{
                  ...styles.socialButton,
                  ...(socialLoading === 'google' ? { opacity: 0.7 } : {})
                }}
              >
                {socialLoading === 'google' ? <LoadingSpinner /> : <GoogleIcon />}
                Continue with Google
              </button>
            </form>

            <form action={() => handleSocialLogin('github')}>
              <button
                type="submit"
                disabled={socialLoading !== null}
                className="btn btn--outline btn--full-width"
                style={{
                  ...styles.socialButton,
                  ...(socialLoading === 'github' ? { opacity: 0.7 } : {})
                }}
              >
                {socialLoading === 'github' ? <LoadingSpinner /> : <GitHubIcon />}
                Continue with GitHub
              </button>
            </form>

            <form action={() => handleSocialLogin('azure')}>
              <button
                type="submit"
                disabled={socialLoading !== null}
                className="btn btn--outline btn--full-width"
                style={{
                  ...styles.socialButton,
                  ...(socialLoading === 'azure' ? { opacity: 0.7 } : {})
                }}
              >
                {socialLoading === 'azure' ? <LoadingSpinner /> : <AzureIcon />}
                Continue with Azure
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with email</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Email/Password Form */}
        <form action={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              style={styles.input}
              placeholder="Enter your email"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={styles.input}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn--primary btn--full-width"
            style={{
              ...styles.submitButton,
              ...(isLoading ? { opacity: 0.7 } : {})
            }}
          >
            {isLoading ? <LoadingSpinner /> : null}
            Sign in
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          Don't have an account?{' '}
          <a href="/auth/signup" style={styles.footerLink}>
            Sign up
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .btn:hover {
          border-color: var(--color-primary);
          background-color: rgba(var(--color-primary-rgb), 0.05);
        }
        
        .btn--primary:hover {
          background-color: var(--color-primary-hover);
        }
        
        .form-control:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: var(--focus-ring);
        }
      `}</style>
    </div>
  );
} 