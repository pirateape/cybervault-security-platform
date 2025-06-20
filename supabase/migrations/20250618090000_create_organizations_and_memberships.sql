-- Migration: Create organizations, organization_memberships, and org_id propagation
-- Generated: 2025-06-18 09:00 UTC

-- 1. Organizations table
create table if not exists organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Organization memberships (user-org join)
create table if not exists organization_memberships (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references organizations(id) on delete cascade not null,
    user_id uuid references auth.users not null,
    role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
    created_at timestamptz not null default now(),
    unique (org_id, user_id)
);

-- 3. Add org_id to scheduled_exports (and other business tables as needed)
alter table if exists scheduled_exports add column if not exists org_id uuid references organizations(id);
create index if not exists idx_scheduled_exports_org_id on scheduled_exports(org_id);

-- 4. Add org_id to other business tables as needed (e.g., reports)
-- alter table if exists reports add column if not exists org_id uuid references organizations(id);
-- create index if not exists idx_reports_org_id on reports(org_id);

-- 5. Triggers for updated_at
create or replace function update_organizations_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_organizations_updated_at on organizations;
create trigger trg_update_organizations_updated_at
before update on organizations
for each row execute procedure update_organizations_updated_at(); 