-- Migration: Create scheduled_exports table for report export scheduling/automation
-- Generated: 2025-06-14 16:00 UTC

create table if not exists scheduled_exports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users not null,
    report_type text not null,
    filters jsonb not null default '{}',
    format text not null check (format in ('csv', 'pdf', 'xlsx')),
    recurrence text not null, -- cron string or interval
    next_run_at timestamptz not null,
    delivery_method text not null check (delivery_method in ('email', 'dashboard', 'both')),
    email text,
    status text not null default 'active' check (status in ('active', 'paused', 'error', 'completed')),
    last_run_at timestamptz,
    last_result jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_scheduled_exports_next_run_at on scheduled_exports(next_run_at);
create index if not exists idx_scheduled_exports_user_id on scheduled_exports(user_id);

-- Optional: trigger to update updated_at on row modification
create or replace function update_scheduled_exports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_scheduled_exports_updated_at on scheduled_exports;
create trigger trg_update_scheduled_exports_updated_at
before update on scheduled_exports
for each row execute procedure update_scheduled_exports_updated_at(); 