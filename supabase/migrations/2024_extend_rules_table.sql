-- Migration: Extend rules table to match ComplianceRule model
-- Adds fields for modular, extensible, and UI-driven rule management

alter table if exists public.rules
  add column if not exists framework text,
  add column if not exists conditions jsonb,
  add column if not exists event jsonb,
  add column if not exists parameters jsonb,
  add column if not exists is_active boolean default true,
  add column if not exists version text,
  add column if not exists updated_at timestamptz,
  add column if not exists created_by uuid references auth.users(id);

-- Expand severity enum if needed (for now, just allow text)
-- alter type ... if using enum

-- Add indexes for performance
create index if not exists idx_rules_org_id on public.rules(org_id);
create index if not exists idx_rules_is_active on public.rules(is_active);
create index if not exists idx_rules_updated_at on public.rules(updated_at);

-- Add comments for documentation
comment on column public.rules.framework is 'Compliance framework (e.g., NIST, ISO27001)';
comment on column public.rules.conditions is 'Rule conditions (JSON structure)';
comment on column public.rules.event is 'Event triggered by rule (JSON structure)';
comment on column public.rules.parameters is 'Custom parameters for rule (JSON structure)';
comment on column public.rules.is_active is 'Whether the rule is enabled';
comment on column public.rules.version is 'Rule version string';
comment on column public.rules.updated_at is 'Last update timestamp';
comment on column public.rules.created_by is 'User who created the rule (for owner-based RLS)'; 