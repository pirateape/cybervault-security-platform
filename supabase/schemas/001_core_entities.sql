-- 001_core_entities.sql
-- Core entity table definitions for Supabase/Postgres

-- Users table (linked to Supabase auth)
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  username text unique not null,
  full_name text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Organizations
default now()
);

-- Organizations
create table if not exists public.organizations (
  id bigint primary key generated always as identity,
  name text not null,
  slug text unique not null,
  plan_type text not null check (plan_type in ('free', 'pro', 'enterprise')),
  created_at timestamptz default now()
);

-- Organization Members (many-to-many)
create table if not exists public.org_members (
  org_id bigint references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);

-- Projects/Scans
create table if not exists public.projects (
  id bigint primary key generated always as identity,
  name text not null,
  organization_id bigint references public.organizations(id),
  status text not null check (status in ('active', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audit schema and logs
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

-- Enable RLS for sensitive tables
alter table if exists public.projects enable row level security;
alter table if exists audit.audit_logs enable row level security; 