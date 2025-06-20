-- Migration: Create organization_memberships with bigint org_id
-- Generated: 2025-06-18 09:01 UTC

create table if not exists organization_memberships (
    id uuid primary key default gen_random_uuid(),
    org_id bigint references organizations(id) on delete cascade not null,
    user_id uuid references auth.users(id) not null,
    role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
    created_at timestamptz not null default now(),
    unique (org_id, user_id)
); 