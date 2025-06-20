-- Migration to Multi-Tenant Schema
-- 1. Back up affected tables
CREATE TABLE IF NOT EXISTS backup_credentials AS TABLE credentials;
CREATE TABLE IF NOT EXISTS backup_reports AS TABLE reports;
CREATE TABLE IF NOT EXISTS backup_dashboard_layouts AS TABLE dashboard_layouts;

-- 2. Add org_id column if missing
ALTER TABLE IF EXISTS credentials ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE IF EXISTS dashboard_layouts ADD COLUMN IF NOT EXISTS org_id uuid;

-- 3. Migrate legacy credentials to tenant_credentials
-- (Assume a mapping table legacy_credential_org_map(credential_id, org_id) exists, or use a default org_id)
INSERT INTO tenant_credentials (org_id, name, encrypted_value, created_by, created_at, updated_at)
SELECT
  COALESCE(map.org_id, '<default-org-id>'),
  c.name,
  c.encrypted_value,
  c.created_by,
  c.created_at,
  c.updated_at
FROM credentials c
LEFT JOIN legacy_credential_org_map map ON c.id = map.credential_id
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_credentials tc WHERE tc.encrypted_value = c.encrypted_value AND tc.name = c.name
);

-- 4. (Optional) Set org_id for existing records if not set
UPDATE credentials SET org_id = '<default-org-id>' WHERE org_id IS NULL;
UPDATE reports SET org_id = '<default-org-id>' WHERE org_id IS NULL;
UPDATE dashboard_layouts SET org_id = '<default-org-id>' WHERE org_id IS NULL;

-- 5. Add indexes for org_id if not present
CREATE INDEX IF NOT EXISTS idx_credentials_org_id ON credentials(org_id);
CREATE INDEX IF NOT EXISTS idx_reports_org_id ON reports(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_org_id ON dashboard_layouts(org_id);

-- 6. (Optional) Add rollback logic in a separate script for safety
-- See docs/migration-to-multitenant.md for details 