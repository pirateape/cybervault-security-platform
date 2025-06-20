-- Migration: Setup compliance data tables for dashboard
-- Date: 2024-07-01

-- 1. Compliance Reports Table
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  title text NOT NULL,
  score numeric,
  status text,
  trend text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Scan Results Table
CREATE TABLE IF NOT EXISTS public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  scan_id uuid,
  severity text,
  description text,
  status text,
  created_at timestamptz DEFAULT now()
);

-- 3. Heat Map Table
CREATE TABLE IF NOT EXISTS public.heat_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  risk_level text,
  affected_area text,
  value numeric,
  created_at timestamptz DEFAULT now()
);

-- 4. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid,
  user_id uuid,
  comment text,
  rating int,
  created_at timestamptz DEFAULT now()
); 