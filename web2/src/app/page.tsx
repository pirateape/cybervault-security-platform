import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/libs/data-access/createSupabaseServerClient';
import { CyberVaultDashboard } from '../components/cybervault/CyberVaultDashboard';

async function checkAuth() {
  // Temporarily disabled for testing
  /*
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  return user;
  */
}

export default async function Index() {
  // await checkAuth();
  
  return <CyberVaultDashboard />;
}
