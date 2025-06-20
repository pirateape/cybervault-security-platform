-- 003_rls_granular_policies.sql
-- Granular RLS policies for insert, update, and delete on core tables

-- PROFILES
-- Users can insert their own profile (if not exists)
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
-- Users can update their own profile (already exists)
-- Users can delete their own profile (optional, usually not allowed)

-- ORGANIZATIONS
-- Org members can insert orgs (optional, restrict to certain roles if needed)
create policy "Users can create organizations" on public.organizations
  for insert with check (auth.uid() is not null);
-- Org owners/admins can update their org
create policy "Org owners/admins can update org" on public.organizations
  for update using (exists (
    select 1 from public.org_members m
    where m.org_id = id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));
-- Org owners can delete their org
create policy "Org owners can delete org" on public.organizations
  for delete using (exists (
    select 1 from public.org_members m
    where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
  ));

-- ORG MEMBERS
-- Users can join orgs (insert membership for themselves)
create policy "Users can join orgs" on public.org_members
  for insert with check (user_id = auth.uid());
-- Org owners/admins can update org memberships
create policy "Org owners/admins can update org memberships" on public.org_members
  for update using (exists (
    select 1 from public.org_members m
    where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));
-- Org owners/admins can remove org members
create policy "Org owners/admins can delete org memberships" on public.org_members
  for delete using (exists (
    select 1 from public.org_members m
    where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));

-- PROJECTS
-- Org members can create projects in their org
create policy "Org members can create projects in their org" on public.projects
  for insert with check (exists (
    select 1 from public.org_members m
    where m.org_id = org_id and m.user_id = auth.uid()
  ));
-- Org members can update projects in their org
create policy "Org members can update projects in their org" on public.projects
  for update using (exists (
    select 1 from public.org_members m
    where m.org_id = org_id and m.user_id = auth.uid()
  ));
-- Org owners/admins can delete projects in their org
create policy "Org owners/admins can delete projects in their org" on public.projects
  for delete using (exists (
    select 1 from public.org_members m
    where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
  ));

-- AUDIT LOGS
-- Only system or admin can insert audit logs (optional, restrict as needed)
-- Org members can update audit logs for their org (rare, usually not allowed)
-- Org owners/admins can delete audit logs for their org (rare, usually not allowed)

-- REMEDIATION ACTIONS
-- Enable RLS
alter table public.remediation_actions enable row level security;

-- Org reviewers/approvers can select remediation actions in their org
create policy "Reviewers/Approvers can view remediation actions in their org" on public.remediation_actions
  for select using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('reviewer', 'approver', 'admin', 'owner')
    )
  );
-- Assigned user can update their own remediation action
create policy "Assigned user can update their remediation action" on public.remediation_actions
  for update using (
    assigned_to = auth.uid()
  );
-- Org approvers/admins can update any remediation action in their org
create policy "Approvers/Admins can update remediation actions in their org" on public.remediation_actions
  for update using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('approver', 'admin', 'owner')
    )
  );
-- Only org admins/owners can delete remediation actions (optional, restrict as needed)
create policy "Admins/Owners can delete remediation actions in their org" on public.remediation_actions
  for delete using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('admin', 'owner')
    )
  );

-- REVIEW FEEDBACK
-- Enable RLS
alter table public.review_feedback enable row level security;

-- Org reviewers/approvers can select review feedback in their org
create policy "Reviewers/Approvers can view review feedback in their org" on public.review_feedback
  for select using (
    exists (
      select 1 from public.org_members m
      join public.results r on r.id = review_feedback.result_id
      where m.org_id = r.org_id and m.user_id = auth.uid() and m.role in ('reviewer', 'approver', 'admin', 'owner')
    )
  );
-- User can insert their own review feedback
create policy "User can insert their own review feedback" on public.review_feedback
  for insert with check (
    user_id = auth.uid()
  );
-- User can update their own review feedback
create policy "User can update their own review feedback" on public.review_feedback
  for update using (
    user_id = auth.uid()
  );
-- Org admins/owners can delete review feedback in their org
create policy "Admins/Owners can delete review feedback in their org" on public.review_feedback
  for delete using (
    exists (
      select 1 from public.org_members m
      join public.results r on r.id = review_feedback.result_id
      where m.org_id = r.org_id and m.user_id = auth.uid() and m.role in ('admin', 'owner')
    )
  ); 