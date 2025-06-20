'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Modular Audit Log Page for Next.js App
import nextDynamic from 'next/dynamic';
import React from 'react';
import { useRequireRole } from 'libs/hooks/authProvider';

// Dynamically import the AuditLogWidget for code splitting and performance
const AuditLogWidget = nextDynamic(
  () =>
    import('libs/ui/dashboard/components/AuditLogWidget').then(
      (m) => m.AuditLogWidget
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-zinc-400">
        Loading Audit Log UI...
      </div>
    ),
  }
);

export default function AuditLogPage() {
  const canView = useRequireRole(['admin', 'auditor']);
  if (!canView) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 py-8 px-2">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
            Access Denied
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            You do not have permission to view the audit log. If you believe
            this is an error, please contact your administrator.
          </p>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-zinc-50 dark:bg-zinc-950 py-8 px-2">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100 text-center">
          Audit Log
        </h1>
        <AuditLogWidget />
      </div>
    </main>
  );
}
