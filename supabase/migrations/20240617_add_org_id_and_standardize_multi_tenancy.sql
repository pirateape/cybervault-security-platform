-- 20240617_add_org_id_and_standardize_multi_tenancy.sql
-- Migration: Multi-tenancy compliance and standardization

-- 1. Add org_id to audit.audit_logs
alter table audit.audit_logs
  add column if not exists org_id bigint references public.organizations(id);

-- 2. Add org_id to public.powerplatform_scan_results
alter table public.powerplatform_scan_results
  add column if not exists org_id bigint references public.organizations(id);

-- 3. Standardize discriminator column names (if needed)
-- Example: Rename organization_id to org_id in projects table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'alter table public.projects rename column organization_id to org_id;';
  END IF;
END $$;

-- 4. Update RLS policies for audit.audit_logs
alter table audit.audit_logs enable row level security;

create policy if not exists "Org members can access audit logs in their org"
  on audit.audit_logs
  for select using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id and m.user_id = auth.uid()
    )
  );

-- 5. Update RLS policies for public.powerplatform_scan_results
alter table public.powerplatform_scan_results enable row level security;

create policy if not exists "Org members can access scan results in their org"
  on public.powerplatform_scan_results
  for select using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id and m.user_id = auth.uid()
    )
  );

-- 6. Add B-tree indexes for RLS performance
create index if not exists idx_audit_logs_org_id on audit.audit_logs (org_id);
create index if not exists idx_powerplatform_scan_results_org_id on public.powerplatform_scan_results (org_id);
create index if not exists idx_projects_org_id on public.projects (org_id);
create index if not exists idx_org_members_org_id on public.org_members (org_id);
create index if not exists idx_ms_org_credentials_org_id on public.ms_org_credentials (org_id); 