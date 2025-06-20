-- Migration: Create audit_log table for compliance and security
-- Date: 2024-07-01

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES public.users(id),
  event_type text NOT NULL,
  resource text,
  resource_id text,
  outcome text,
  details jsonb,
  ip_address text,
  user_agent text,
  hash text,
  prev_hash text
);

-- Index for fast querying by event type and user
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON public.audit_log(timestamp);

-- Row Level Security: Append-only (no update/delete)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY audit_log_select ON public.audit_log FOR SELECT USING (auth.role() IN ('admin', 'compliance_officer'));
REVOKE UPDATE, DELETE ON public.audit_log FROM PUBLIC;

-- Trigger for hash chaining (pseudo-code, actual implementation may require a plpgsql function)
-- This is a placeholder for a real hash chaining trigger
-- CREATE OR REPLACE FUNCTION audit_log_hash_chain() RETURNS trigger AS $$
-- BEGIN
--   NEW.prev_hash := (SELECT hash FROM public.audit_log ORDER BY timestamp DESC LIMIT 1);
--   NEW.hash := encode(digest(NEW.prev_hash || NEW.user_id || NEW.event_type || NEW.timestamp, 'sha256'), 'hex');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER audit_log_hash_chain_trigger
-- BEFORE INSERT ON public.audit_log
-- FOR EACH ROW EXECUTE FUNCTION audit_log_hash_chain(); 