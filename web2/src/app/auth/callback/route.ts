import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/libs/data-access/createSupabaseServerClient';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createSupabaseServerClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=Authentication failed`);
    }
  }

  // Redirect to the dashboard after successful authentication
  return NextResponse.redirect(`${origin}/`);
} 