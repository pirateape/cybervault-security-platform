-- 004_seed_data.sql
-- Seed initial test data for core tables (multi-tenant SaaS example)

-- Example organizations
insert into public.organizations (id, name, slug, plan_type, created_at) values
  (1001, 'Acme Corp', 'acme-corp', 'pro', now()),
  (1002, 'Beta Inc', 'beta-inc', 'free', now());

-- Example users (profiles)
insert into public.profiles (id, username, full_name, bio, created_at, updated_at) values
  ('6540dfd4-a7b6-4e04-b232-409e3152a752', 'alice', 'Alice Anderson', 'CEO at Acme', now(), now()),
  ('5a3940ee-51df-4fea-abf1-2413f4964ce1', 'bob', 'Bob Brown', 'Engineer at Acme', now(), now()),
  ('39867fbc-72ef-4160-8ba9-f960999dbb8f', 'carol', 'Carol Clark', 'CTO at Beta', now(), now()),
  ('d95b5fae-efe4-4269-933a-daa2c8b7d6cb', 'dave', 'Dave Davis', 'Dev at Beta', now(), now());

-- Example org memberships
insert into public.org_members (org_id, user_id, role, joined_at) values
  (1001, '6540dfd4-a7b6-4e04-b232-409e3152a752', 'owner', now()),
  (1001, '5a3940ee-51df-4fea-abf1-2413f4964ce1', 'member', now()),
  (1002, '39867fbc-72ef-4160-8ba9-f960999dbb8f', 'owner', now()),
  (1002, 'd95b5fae-efe4-4269-933a-daa2c8b7d6cb', 'admin', now());

-- Example projects
insert into public.projects (org_id, name, description, created_at, updated_at) values
  (1001, 'Acme Security Audit', 'Security audit for Acme Corp', now(), now()),
  (1001, 'Acme Compliance Tracker', 'Compliance tracking tool', now(), now()),
  (1002, 'Beta Risk Assessment', 'Risk assessment for Beta Inc', now(), now()); 