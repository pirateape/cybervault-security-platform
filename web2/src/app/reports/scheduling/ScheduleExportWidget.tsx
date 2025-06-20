import React from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { ScheduleExportSchema } from '@/libs/validation/scheduledExportSchemas';
// import { z } from 'zod';

// TODO: Define ScheduleExportFormValues type from Zod schema
// type ScheduleExportFormValues = z.infer<typeof ScheduleExportSchema>;

export function ScheduleExportWidget() {
  // TODO: Initialize React Hook Form with Zod validation
  // const form = useForm<ScheduleExportFormValues>({ resolver: zodResolver(ScheduleExportSchema) });

  return (
    <section aria-labelledby="schedule-export-heading" className="flex flex-col gap-4">
      <h2 id="schedule-export-heading" className="text-xl font-semibold">Schedule New Report Export</h2>
      {/* TODO: Replace with RHF form */}
      <form className="flex flex-col gap-4" aria-describedby="schedule-export-desc">
        <div id="schedule-export-desc" className="text-base-content/60">
          Set up a new scheduled export. Choose report type, filters, format, recurrence, and delivery method.
        </div>
        {/* TODO: Report type, filters, and format selectors */}
        <div>
          <label className="label">Delivery Method</label>
          <select className="select select-bordered w-full">
            <option value="email">Email</option>
            <option value="dashboard">Dashboard</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className="label">Recurrence</label>
          {/* TODO: Replace with cron/interval picker, natural language hints */}
          <input className="input input-bordered w-full" placeholder="e.g. Every Monday at 9am" />
        </div>
        {/* TODO: Add accessibility, keyboard navigation, and error handling */}
        <button type="submit" className="btn btn-primary w-full" disabled>
          Schedule Export (Coming Soon)
        </button>
      </form>
    </section>
  );
} 