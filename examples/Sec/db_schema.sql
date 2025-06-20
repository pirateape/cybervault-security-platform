-- Security Compliance Tool: Supabase Schema Backup (Multi-Org)

-- USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    full_name text,
    role text NOT NULL DEFAULT 'user',
    is_disabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);

-- SCANS TABLE
CREATE TABLE IF NOT EXISTS public.scans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    scan_type text NOT NULL,
    status text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    target text,
    metadata jsonb
);
CREATE INDEX IF NOT EXISTS idx_scans_org_id ON public.scans(org_id);

-- RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL,
    scan_id uuid REFERENCES public.scans(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    finding text NOT NULL,
    severity text,
    compliance_framework text,
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_results_org_id ON public.results(org_id);

$1

-- Enforce append-only: prevent UPDATE/DELETE on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs is append-only: % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
 