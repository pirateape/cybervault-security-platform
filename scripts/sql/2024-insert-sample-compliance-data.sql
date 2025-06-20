-- Insert sample/mock data for compliance dashboard testing
-- Date: 2024-07-01

-- 1. Sample Compliance Reports
INSERT INTO public.compliance_reports (id, org_id, title, score, status, trend, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Q2 2024 Compliance Audit', 87.5, 'Compliant', 'Upward', now() - interval '30 days', now()),
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Q1 2024 Compliance Audit', 72.0, 'Partially Compliant', 'Stable', now() - interval '120 days', now() - interval '90 days'),
  ('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Annual Security Review', 65.0, 'Non-Compliant', 'Downward', now() - interval '200 days', now() - interval '180 days');

-- 2. Sample Scan Results (updated for actual schema)
INSERT INTO public.results (
  id, scan_id, user_id, finding, severity, compliance_framework, details, created_at, org_id, review_status, reviewer_id, reviewer_feedback, override_recommendation
) VALUES
  ('10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Unpatched critical vulnerability in server', 'High', 'ISO 27001', '{"evidence": "CVE-2024-1234"}', now() - interval '29 days', '11111111-1111-1111-1111-111111111111', 'pending', NULL, NULL, NULL),
  ('10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Outdated TLS version detected', 'Medium', 'SOC 2', '{"evidence": "TLS 1.0"}', now() - interval '28 days', '11111111-1111-1111-1111-111111111111', 'approved', NULL, 'Reviewed and closed', NULL),
  ('10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', 'Missing security headers', 'Low', 'PCI DSS', '{"evidence": "No CSP header"}', now() - interval '190 days', '22222222-2222-2222-2222-222222222222', 'pending', NULL, NULL, NULL);

-- 3. Sample Heat Map Data
INSERT INTO public.heat_map (id, org_id, risk_level, affected_area, value, created_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'High', 'Network', 8.5, now() - interval '29 days'),
  ('20000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Medium', 'Application', 5.0, now() - interval '28 days'),
  ('20000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'Low', 'Physical', 2.0, now() - interval '190 days');

-- 4. Sample Feedback
INSERT INTO public.feedback (id, report_id, user_id, comment, rating, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Great improvement over last quarter!', 5, now() - interval '25 days'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'Needs more focus on application security.', 3, now() - interval '85 days'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'Action plan required for non-compliance.', 2, now() - interval '175 days');

-- 1b. Sample Scans (required for results FK)
INSERT INTO public.scans (
  id, user_id, scan_type, status, started_at, completed_at, target, metadata, org_id
) VALUES
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Network', 'completed', now() - interval '30 days', now() - interval '29 days', '10.0.0.1', '{"tool": "Nessus"}', '11111111-1111-1111-1111-111111111111'),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', 'Web', 'completed', now() - interval '191 days', now() - interval '190 days', 'app.example.com', '{"tool": "OWASP ZAP"}', '22222222-2222-2222-2222-222222222222');

-- 1a. Sample Users (required for scans and results FK)
INSERT INTO public.users (
  id, email, password_hash, full_name, role, created_at, updated_at, org_id, is_disabled
) VALUES
  ('40000000-0000-0000-0000-000000000001', 'alice@example.com', 'hashed_pw1', 'Alice Anderson', 'admin', now() - interval '365 days', now(), '11111111-1111-1111-1111-111111111111', false),
  ('40000000-0000-0000-0000-000000000002', 'bob@example.com', 'hashed_pw2', 'Bob Brown', 'user', now() - interval '200 days', now(), '11111111-1111-1111-1111-111111111111', false),
  ('40000000-0000-0000-0000-000000000003', 'carol@example.com', 'hashed_pw3', 'Carol Clark', 'user', now() - interval '300 days', now(), '22222222-2222-2222-2222-222222222222', false);

-- 0. Sample Organizations (required for users FK)
INSERT INTO public.organizations (
  id, name, slug, plan_type, max_posts, created_at
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'acme-corp', 'pro', 50, now() - interval '400 days'),
  ('22222222-2222-2222-2222-222222222222', 'Beta Inc', 'beta-inc', 'free', 10, now() - interval '300 days'); 