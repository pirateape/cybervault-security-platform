-- Migration: Add org_id (bigint) to scheduled_exports
-- Generated: 2025-06-18 09:02 UTC

alter table if exists scheduled_exports add column if not exists org_id bigint references organizations(id);
create index if not exists idx_scheduled_exports_org_id on scheduled_exports(org_id); 