# Migration Guide: Moving to Multi-Tenant Schema

## Overview
This guide describes the process for migrating existing data to the new multi-tenant schema, enabling strict tenant isolation and secure credential management. The migration is designed to be robust, idempotent, and auditable.

## Prerequisites
- Ensure you have a full backup of your database.
- Confirm that all users are notified of a potential maintenance window.
- Review the migration SQL script: `scripts/migrate_to_multitenant.sql`.
- Identify or create a mapping table (`legacy_credential_org_map`) if you need to map legacy credentials to orgs.
- Determine the default `org_id` to use for unmapped records.

## Migration Steps
1. **Back Up Data**
   - The script will create backup tables (`backup_credentials`, `backup_reports`, `backup_dashboard_layouts`).
   - Optionally, create a full database dump as an extra precaution.

2. **Run the Migration Script**
   - Execute `scripts/migrate_to_multitenant.sql` in your Supabase/Postgres environment:
     ```sh
     psql $DATABASE_URL -f scripts/migrate_to_multitenant.sql
     ```
   - The script is idempotent and safe to run multiple times.

3. **Validate Migration**
   - Check that all relevant tables have an `org_id` column:
     ```sql
     \d+ credentials
     \d+ reports
     \d+ dashboard_layouts
     ```
   - Verify that all records have a valid `org_id`:
     ```sql
     SELECT COUNT(*) FROM credentials WHERE org_id IS NULL;
     SELECT COUNT(*) FROM reports WHERE org_id IS NULL;
     SELECT COUNT(*) FROM dashboard_layouts WHERE org_id IS NULL;
     ```
   - Confirm that data in `tenant_credentials` matches expected org assignments:
     ```sql
     SELECT org_id, COUNT(*) FROM tenant_credentials GROUP BY org_id;
     ```

4. **Post-Migration Testing**
   - Run backend and frontend segregation tests (see `tests/test_tenant_credentials_rls.py` and `web2-e2e/credentials.spec.ts`).
   - Manually verify that users from one tenant cannot access another tenant's data.

5. **Rollback Plan**
   - If issues are detected, restore from backup tables or your full database dump.
   - Example rollback (restore credentials):
     ```sql
     DELETE FROM credentials;
     INSERT INTO credentials SELECT * FROM backup_credentials;
     ```
   - Review and test before re-enabling production access.

## Troubleshooting
- If the script fails, check for missing tables or permissions.
- Ensure the mapping table (`legacy_credential_org_map`) exists if used.
- Review logs and error messages for details.

## Communication Plan
- Notify all stakeholders of the migration schedule and expected downtime.
- Provide regular updates during the migration process.
- Confirm completion and system readiness before resuming normal operations.

## Best Practices
- Always test the migration in a staging environment first.
- Document any manual changes or exceptions.
- Keep all backup and migration logs for audit purposes.

---
For questions or support, contact the engineering team or refer to the project README. 