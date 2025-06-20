-- 002_audit_schema.sql
-- Audit schema and logs for Supabase/Postgres

create schema if not exists audit;
create table if not exists audit.audit_logs (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id),
  action text not null,
  entity text,
  entity_id bigint,
  details jsonb,
  created_at timestamptz default now()
);

-- Create or replace a public view for audit_logs (read-only)
create or replace view public.audit_logs as
select id, user_id, action, entity, entity_id, details, created_at
from audit.audit_logs; 