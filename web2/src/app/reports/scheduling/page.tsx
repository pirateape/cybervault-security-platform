// web2/src/app/reports/scheduling/page.tsx
// Scheduling Dashboard UI for Report Exports
// Modular, accessible, and extensible

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React from 'react';
import { ScheduleExportWidget } from './ScheduleExportWidget';
import { ScheduledJobsListWidget } from './ScheduledJobsListWidget';
import { JobHistoryWidget } from './JobHistoryWidget';
import { NotificationSettingsWidget } from './NotificationSettingsWidget';
// import { useUser } from '@/hooks/useUser';
// import { useScheduledExports } from '@/hooks/useScheduledExports';

export default function SchedulingDashboardPage() {
  // TODO: Fetch user/session context
  // const { user } = useUser();
  // const { jobs, isLoading, error } = useScheduledExports();

  return (
    <main className="min-h-screen bg-base-100 p-4 md:p-8 flex flex-col gap-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Report Exports</h1>
        <p className="text-base-content/70 max-w-xl">
          Automate your report exports with flexible scheduling, delivery, and notifications. Manage, edit, and monitor all your scheduled jobs in one place.
        </p>
      </header>
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="col-span-1 xl:col-span-2 bg-base-200 rounded-xl shadow p-6">
          <ScheduleExportWidget />
        </div>
        <div className="col-span-1 bg-base-200 rounded-xl shadow p-6">
          <NotificationSettingsWidget />
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 bg-base-200 rounded-xl shadow p-6">
          <ScheduledJobsListWidget />
        </div>
        <div className="col-span-1 bg-base-200 rounded-xl shadow p-6">
          <JobHistoryWidget />
        </div>
      </section>
      {/* TODO: Add accessibility, keyboard navigation, and responsive enhancements */}
      {/* TODO: Integrate with API, add optimistic updates, error handling, and notifications */}
    </main>
  );
} 