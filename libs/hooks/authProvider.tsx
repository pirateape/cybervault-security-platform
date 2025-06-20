import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '../data-access/supabaseClient';
import { ROLE_PERMISSIONS, UserRole, Permission, UserPermissions } from '../types/src';

// User and role types (expand as needed)
export interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requireRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // If Supabase is not available, immediately set mock user state
  const mockUser = !supabase ? {
    id: 'demo-user',
    email: 'demo@example.com',
    role: 'admin' as UserRole,
    permissions: getPermissions('admin'),
  } : null;
  
  const [user, setUser] = useState<User | null>(mockUser);
  // Start with false for mock auth, will be set to true only if real auth is needed
  const [loading, setLoading] = useState(!supabase ? false : true);

  // Helper to extract role from user metadata or custom claims
  function extractRole(supabaseUser: any): UserRole {
    // Try custom claims, then user_metadata, fallback to 'user'
    return (
      supabaseUser?.app_metadata?.role ||
      supabaseUser?.user_metadata?.role ||
      'user'
    );
  }

  // Helper to extract permissions from role (can be extended to fetch from Supabase)
  function getPermissions(role: UserRole): UserPermissions {
    return ROLE_PERMISSIONS[role] || [];
  }

  // Restore session on mount
  useEffect(() => {
    // If supabase is not available, set mock user immediately without loading state
    if (!supabase) {
      console.warn('Supabase not configured, using mock auth with admin permissions');
      setUser({
        id: 'demo-user',
        email: 'demo@example.com',
        role: 'admin',
        permissions: getPermissions('admin'),
      });
      setLoading(false);
      return;
    }

    // Only set loading for real Supabase auth
    setLoading(true);

    const getSession = async () => {
      try {
        const { data } = await supabase!.auth.getSession();
        const session = data?.session;
        if (session?.user) {
          const role = extractRole(session.user);
          setUser({
            id: session.user.id,
            email: session.user.email || 'no-email@example.com',
            role,
            permissions: getPermissions(role),
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth session error:', error);
        setUser(null);
      }
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes
    const { data: listener } = supabase!.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const role = extractRole(session.user);
          setUser({
            id: session.user.id,
            email: session.user.email || 'no-email@example.com',
            role,
            permissions: getPermissions(role),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Login with Supabase
  const login = async (email: string, password: string) => {
    setLoading(true);

    if (!supabase) {
      // Mock login for demo
      console.warn('Supabase not configured, using mock login');
      setUser({
        id: 'demo-user',
        email: email,
        role: 'admin',
        permissions: getPermissions('admin'),
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        const role = extractRole(data.user);
        setUser({
          id: data.user.id,
          email: data.user.email || 'no-email@example.com',
          role,
          permissions: getPermissions(role),
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
    setLoading(false);
  };

  // Logout with Supabase
  const logout = async () => {
    setLoading(true);

    if (!supabase) {
      // Mock logout for demo
      console.warn('Supabase not configured, using mock logout');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      await supabase!.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }

    setUser(null);
    setLoading(false);
  };

  // RBAC enforcement utility
  const requireRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  // Permission enforcement utility
  const hasPermission = (permission: Permission) => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes('admin_all');
  };

  // Social login with Supabase
  const signInWithProvider = async (provider: 'google' | 'github') => {
    setLoading(true);

    if (!supabase) {
      // Mock social login for demo
      console.warn('Supabase not configured, using mock social login');
      setUser({
        id: 'demo-user',
        email: `demo-${provider}@example.com`,
        role: 'user',
        permissions: getPermissions('user'),
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase!.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback',
        },
      });
      if (error) throw error;
      
      // Note: The actual user data will be handled by the onAuthStateChange listener
      // This is because OAuth redirects to a new page
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        requireRole, 
        hasPermission,
        signInWithProvider 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// useRequireRole hook for components
export function useRequireRole(role: UserRole | UserRole[]) {
  const { requireRole, loading } = useAuth();
  if (loading) return false;
  return requireRole(role);
}

// useHasPermission hook for widgets
export function useHasPermission(permission: Permission) {
  const { hasPermission, loading, user } = useAuth();
  const result = loading ? false : hasPermission(permission);
  
  // Debug logging
  console.log(`useHasPermission('${permission}'):`, {
    loading,
    user: user ? { id: user.id, role: user.role, permissions: user.permissions } : null,
    result
  });
  
  if (loading) return false;
  return hasPermission(permission);
}

/**
 * Usage:
 *   const { user, requireRole } = useAuth();
 *   if (!requireRole('admin')) return <AccessDenied />;
 *
 *   // Or in a component:
 *   const isSecurityTeam = useRequireRole('security_team');
 *   if (!isSecurityTeam) return null;
 */
