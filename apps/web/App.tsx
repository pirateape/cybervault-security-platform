// App.tsx: Main entry point for the dashboard app
// Usage: import and render <App /> in your main file (e.g., main.tsx or index.tsx)
import React from 'react';
import { AuthProvider, useAuth } from '../../libs/hooks/authProvider';
import { LoginForm, ReportingDashboard } from '../../libs/ui';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="animate-spin text-3xl">⏳</span>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <ReportingDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
