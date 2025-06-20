-- 005_powerplatform_scan_results.sql
-- Table for storing Power Platform scan results (compliance, security, best-practice findings)

create table if not exists public.powerplatform_scan_results (
    id uuid primary key default gen_random_uuid(),
    solution_name text not null,
    solution_path text,
    scan_timestamp timestamptz not null default now(),
    findings jsonb not null,
    summary jsonb,
    initiated_by uuid references auth.users(id),
    status text not null default 'completed',
    raw_response jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Comments for documentation
comment on table public.powerplatform_scan_results is 'Stores results of Power Platform static analysis scans.';
comment on column public.powerplatform_scan_results.findings is 'Array of findings (compliance, security, best-practice issues).';
comment on column public.powerplatform_scan_results.summary is 'Summary of scan results (counts, severity, etc).';
comment on column public.powerplatform_scan_results.initiated_by is 'User who initiated the scan.';
comment on column public.powerplatform_scan_results.status is 'Scan status (completed, failed, pending, etc).';
comment on column public.powerplatform_scan_results.raw_response is 'Raw response from checker tool/API.';

-- Enable Row Level Security
alter table public.powerplatform_scan_results enable row level security;

-- Policy: Only the user who initiated the scan or org admins can select/insert/update/delete
-- (Add more granular org-based RLS if org_id is added in the future)
create policy "Scan initiator can access their own scan results" on public.powerplatform_scan_results
    for all using (auth.uid() = initiated_by); 