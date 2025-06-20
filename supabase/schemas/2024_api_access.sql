-- 2024_api_access.sql

-- 1. Create custom api schema
create schema if not exists api;

-- 2. Expose a view for users (select only, no column drops)
create or replace view api.users as select id, email, org_id from public.users;

-- 3. Grant permissions for API access
grant select on table api.users to anon;
grant select, insert, update, delete on table api.users to authenticated;

-- NOTE: Dropping columns from a view is not supported in Postgres. Only select the columns you want to expose in the view definition.
-- If more granular control is needed, create additional views for each entity with only the required fields. 