-- Migration: Add rule_versions table for rule version history

create table if not exists public.rule_versions (
  id bigserial primary key,
  rule_id bigint not null references public.rules(id) on delete cascade,
  version text not null,
  content jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists idx_rule_versions_rule_id on public.rule_versions(rule_id);
create index if not exists idx_rule_versions_created_at on public.rule_versions(created_at);

comment on table public.rule_versions is 'Stores all versions of rules for audit and rollback.';
comment on column public.rule_versions.rule_id is 'Reference to the rule in public.rules.';
comment on column public.rule_versions.version is 'Version string or number.';
comment on column public.rule_versions.content is 'Full rule content at this version.';
comment on column public.rule_versions.created_by is 'User who created this version.';
comment on column public.rule_versions.created_at is 'Timestamp when this version was created.';
comment on column public.rule_versions.metadata is 'Optional metadata for this version.'; 