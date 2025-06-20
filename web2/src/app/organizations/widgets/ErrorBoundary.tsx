import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { Card, Button } from '../../../../../libs/ui/primitives';

/**
 * Modular, accessible ErrorBoundary for dashboard widgets.
 * Uses react-error-boundary and TanStack Query's reset boundary.
 * Provides ARIA, keyboard nav, and retry UI.
 */
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();
  return (
    <ReactErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }: { error: any; resetErrorBoundary: () => void }) => (
        <Card role="alert" aria-live="assertive" aria-busy="false" colorScheme="danger" className="flex flex-col items-start gap-2 p-4">
          <div className="font-bold">Something went wrong:</div>
          <pre className="text-sm whitespace-pre-wrap break-all">{error?.message || String(error)}</pre>
          <Button onClick={resetErrorBoundary} autoFocus colorScheme="danger" variant="solid">
            Try again
          </Button>
        </Card>
      )}
    >
      {children}
    </ReactErrorBoundary>
  );
} 