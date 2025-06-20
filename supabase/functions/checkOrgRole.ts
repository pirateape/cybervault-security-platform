// supabase/functions/checkOrgRole.ts
// This file is intended for Supabase Edge Functions (Deno runtime)
// Deno provides global 'Deno' and supports remote imports
// No changes needed for linter errors in local TypeScript tooling

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

serve(async (req) => {
  const { org_id } = await req.json();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user id from JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Missing auth', { status: 401 });
  const jwt = authHeader.replace('Bearer ', '');
  const { data: user, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user?.user?.id)
    return new Response('Invalid user', { status: 401 });
  const userId = user.user.id;

  // Query org_members for role
  const { data, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org_id)
    .eq('user_id', userId)
    .single();
  if (error || !data) return new Response('Forbidden', { status: 403 });

  return new Response(JSON.stringify({ role: data.role }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
