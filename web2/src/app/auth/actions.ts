'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/libs/data-access/createSupabaseServerClient';

export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  
  // Get form data
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Validate inputs
  if (!data.email || !data.password) {
    redirect('/auth/login?error=Missing email or password');
  }

  // Attempt to sign in
  const { error } = await supabase.auth.signInWithPassword(data);
  
  if (error) {
    console.error('Login error:', error);
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  // Revalidate the layout to update auth state
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  
  // Get form data
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  // Validate inputs
  if (!data.email || !data.password || !data.confirmPassword) {
    redirect('/auth/signup?error=Missing required fields');
  }

  if (data.password !== data.confirmPassword) {
    redirect('/auth/signup?error=Passwords do not match');
  }

  if (data.password.length < 6) {
    redirect('/auth/signup?error=Password must be at least 6 characters');
  }

  // Attempt to sign up
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });
  
  if (error) {
    console.error('Signup error:', error);
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Redirect to confirmation page
  redirect('/auth/signup?success=Check your email to confirm your account');
}

export async function signout() {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Signout error:', error);
  }

  // Revalidate the layout to update auth state
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

// Social Authentication Functions
export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    console.error('Google sign-in error:', error);
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithGitHub() {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    console.error('GitHub sign-in error:', error);
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithAzure() {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    console.error('Azure sign-in error:', error);
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
} 