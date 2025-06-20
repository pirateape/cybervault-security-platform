// supabase/functions/withRoleAuth.ts
// Reusable middleware for Supabase Edge Functions (Deno runtime)
// Validates JWT, fetches user role for org, enforces required role

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Usage: wrap your handler with withRoleAuth(handler, requiredRole)
export function withRoleAuth(
  handler: (req: Request, user: any, role: string) => Promise<Response>,
  requiredRole: string
) {
  return async (req: Request) => {
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
    if (data.role !== requiredRole)
      return new Response('Forbidden', { status: 403 });

    // Call the actual handler
    return handler(req, user, data.role);
  };
}

// Example usage:
// serve(withRoleAuth(async (req, user, role) => { ... }, 'admin'))
