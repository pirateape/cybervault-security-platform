-- 002_rls_policies.sql
-- Enable Row Level Security (RLS) and add example policies for core tables

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.projects enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: Users can only access their own profile
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Organizations: Org members can view orgs they belong to
create policy "Org members can view their orgs" on public.organizations
  for select using (exists (
    select 1 from public.org_members m
    where m.org_id = id and m.user_id = auth.uid()
  ));

-- Org Members: Users can see their own org memberships
create policy "Users can view their org memberships" on public.org_members
  for select using (user_id = auth.uid());

-- Projects: Org members can view projects in their org
create policy "Org members can view projects in their org" on public.projects
  for select using (exists (
    select 1 from public.org_members m
    where m.org_id = org_id and m.user_id = auth.uid()
  ));

-- Audit Logs: Org members can view audit logs for their org
create policy "Org members can view audit logs for their org" on public.audit_logs
  for select using (exists (
    select 1 from public.org_members m
    where m.org_id = org_id and m.user_id = auth.uid()
  )); 