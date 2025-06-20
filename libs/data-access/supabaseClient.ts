/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Support both Vite (import.meta.env) and Next.js (process.env) environments
const getEnvVar = (name: string) => {
  // For Next.js/Node.js environments
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name];
  }
  // For Vite/browser environments
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[name];
  }
  return undefined;
};

const supabaseUrl =
  getEnvVar('VITE_SUPABASE_URL') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL') ||
  '';

const supabaseAnonKey =
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY') ||
  '';

// Only create client if we have valid credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Some features may not work.');
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
