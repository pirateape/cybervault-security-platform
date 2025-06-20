-- 2024_rls_optimizations.sql

-- 1. Indexes for RLS performance
create index if not exists idx_org_members_org_id on public.org_members(org_id);
create index if not exists idx_org_members_user_id on public.org_members(user_id);

-- 2. RLS Policy Structure Best Practices
-- Use security definer functions for role checks
-- Wrap function calls in SELECT for performance
-- Example:
-- using ((select private.get_user_org_role(org_id, (select auth.uid()))) in ('owner', 'admin'))

-- 3. Action-Specific RLS Policies
-- Define separate policies for SELECT, INSERT, UPDATE, DELETE as needed
-- Example:
-- create policy "Org admins can update org" on public.organizations
--   for update using ((select private.get_user_org_role(id, (select auth.uid()))) in ('owner', 'admin'));

-- 4. Automated RLS Testing
-- Use Vitest + Supabase client or pgTAP for SQL-level tests
-- Set session role and JWT claims for SQL-level RLS tests

-- 5. Maintain this file as the single source of truth for RLS enhancements
