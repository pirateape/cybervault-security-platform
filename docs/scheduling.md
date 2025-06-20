# Scheduling & Automation for Report Exports

## Overview
This system enables users to schedule automated report exports with flexible recurrence, delivery methods, and robust management. It is modular, extensible, and built with best-in-class UI/UX and backend practices.

## Architecture
- **Supabase Table:** `scheduled_exports` stores job metadata, recurrence, delivery, and status.
- **API:** `/api/scheduled-exports` (CRUD, RBAC, audit logging)
- **Serverless Worker:** `/api/scheduled-exports/process` (cron-triggered job processor)
- **Frontend:** `/reports/scheduling` dashboard with modular widgets

## API Reference
### Endpoints
- `GET /api/scheduled-exports` — List user jobs
- `POST /api/scheduled-exports` — Create job
- `PATCH /api/scheduled-exports/:id` — Update job
- `DELETE /api/scheduled-exports/:id` — Delete job
- `POST /api/scheduled-exports/process` — Process due jobs (cron/worker)

### Payload Example (Create)
```json
{
  "report_type": "compliance_summary",
  "filters": { "region": "US" },
  "format": "csv",
  "recurrence": "0 9 * * 1", // every Monday at 9am
  "delivery_method": "email",
  "email": "user@example.com"
}
```

## UI Reference
- **ScheduleExportWidget:** Form for new jobs (report, filters, format, recurrence, delivery)
- **ScheduledJobsListWidget:** Table of jobs (edit, delete, pause)
- **JobHistoryWidget:** List of past runs, status, errors
- **NotificationSettingsWidget:** Manage email/in-app notifications

## Extensibility
- Add new report types, formats, or delivery methods via modular API and UI
- Pluggable email providers (Resend, Supabase SMTP, etc.)
- Ready for multi-tenant, advanced recurrence, and notification enhancements

## Testing
- Playwright E2E: `web2-e2e/src/scheduled-exports.spec.ts`
- Unit/visual: `web2/src/app/reports/scheduling/*.test.tsx`
- Storybook: See widget files for stories

## Usage Example
1. Go to `/reports/scheduling`
2. Click "Schedule New Report Export"
3. Fill out the form (choose report, recurrence, delivery)
4. Submit to create a scheduled job
5. Manage jobs in the dashboard; view history and notifications

## Advanced Features (Planned)
- Natural language recurrence picker
- Multi-tenant support
- Advanced notification channels (Slack, SMS)
- Audit log export and analytics

---
For questions or contributions, see the main [README.md](../README.md) or contact the project maintainers. 