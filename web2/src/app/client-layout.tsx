'use client';

import Link from 'next/link';
import { AuthProvider } from '../../../libs/hooks/authProvider';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function ClientLayout({ children }: { children: ReactNode }) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <nav className="w-full bg-zinc-100 dark:bg-zinc-900 py-3 px-6 flex gap-6 items-center border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className="font-semibold text-zinc-800 dark:text-zinc-100 hover:underline"
          >
            Home
          </Link>
          <Link
            href="/audit-log"
            className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
          >
            Audit Log
          </Link>
        </nav>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}

