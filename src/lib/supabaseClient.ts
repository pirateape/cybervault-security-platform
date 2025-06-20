import { createClient } from '@supabase/supabase-js';

// NOTE: Data passed to Supabase should be filtered for PII if STORE_PII is not enabled.
// See libs/data-access/graphClient.ts for the PII filtering logic.

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
