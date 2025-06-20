import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/libs/data-access/createSupabaseServerClient';
import LoginForm from '../../components/auth/LoginForm';

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    redirect('/');
  }

  return (
    <div 
      className="auth-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-24)',
        position: 'relative'
      }}
    >
      {/* Subtle background pattern */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, var(--color-primary) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, var(--color-secondary) 0%, transparent 50%)
          `,
          opacity: 0.03,
          pointerEvents: 'none'
        }}
      />
      
      {/* Content */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
        <LoginForm />
      </div>
    </div>
  );
} 