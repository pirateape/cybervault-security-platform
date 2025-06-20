import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import { PublicClientApplication } from '@azure/msal-browser';
import type { AccountInfo } from '@azure/msal-browser';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  msalAccount: AccountInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID as string,
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_MSAL_TENANT_ID
    }`,
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI as string,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [msalAccount, setMsalAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      console.log('[AuthContext] getSession: start');
      let timeoutId = setTimeout(() => {
        console.warn(
          '[AuthContext] getSession: supabase.auth.getSession() is taking more than 5 seconds'
        );
      }, 5000);
      try {
        console.log(
          '[AuthContext] getSession: before supabase.auth.getSession()'
        );
        const { data } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        console.log(
          '[AuthContext] getSession: after supabase.auth.getSession(), response:',
          data
        );
        const authUser = data.session?.user ?? null;
        if (authUser) {
          // Fetch user profile from DB to get org_id and role
          const {
            data: profile,
            error: profileError,
            status: profileStatus,
          } = await supabase
            .from('users')
            .select('id, org_id, role, full_name')
            .eq('id', authUser.id)
            .single();
          if (profileError && profileStatus !== 406) {
            console.error(
              '[AuthContext] Failed to fetch user profile after session restore:',
              profileError
            );
            setUser({
              id: authUser.id,
              email: authUser.email ?? '',
              org_id: '',
              role: '',
              full_name: '',
              created_at: authUser.created_at,
              updated_at: authUser.updated_at,
            });
          } else if (profileStatus === 406) {
            // Profile not found (Supabase returns 406 if no row)
            setUser(null);
            // Optionally show a user-friendly error or notification
          } else {
            const mergedUser = {
              id: authUser.id,
              email: authUser.email ?? '',
              org_id: profile?.org_id ?? '',
              role: profile?.role ?? '',
              full_name: profile?.full_name ?? '',
              created_at: authUser.created_at,
              updated_at: authUser.updated_at,
            };
            console.log('[AuthContext] getSession: mergedUser', mergedUser);
            setUser(mergedUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('[AuthContext] Error getting session:', error);
        setUser(null);
      } finally {
        console.log('[AuthContext] getSession: finally, setLoading(false)');
        setLoading(false);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log(
          '[AuthContext] onAuthStateChange: event',
          _event,
          'session',
          session
        );
        const authUser = session?.user ?? null;
        if (authUser) {
          // Fetch user profile from DB to get org_id and role
          const {
            data: profile,
            error: profileError,
            status: profileStatus,
          } = await supabase
            .from('users')
            .select('id, org_id, role, full_name')
            .eq('id', authUser.id)
            .single();
          if (profileError && profileStatus !== 406) {
            console.error(
              '[AuthContext] Failed to fetch user profile after auth state change:',
              profileError
            );
            setUser({
              id: authUser.id,
              email: authUser.email ?? '',
              org_id: '',
              role: '',
              full_name: '',
              created_at: authUser.created_at,
              updated_at: authUser.updated_at,
            });
          } else if (profileStatus === 406) {
            // Profile not found (Supabase returns 406 if no row)
            setUser(null);
            // Optionally show a user-friendly error or notification
          } else {
            const mergedUser = {
              id: authUser.id,
              email: authUser.email ?? '',
              org_id: profile?.org_id ?? '',
              role: profile?.role ?? '',
              full_name: profile?.full_name ?? '',
              created_at: authUser.created_at,
              updated_at: authUser.updated_at,
            };
            console.log(
              '[AuthContext] onAuthStateChange: mergedUser',
              mergedUser
            );
            setUser(mergedUser);
          }
        } else {
          setUser(null);
        }
        console.log('[AuthContext] onAuthStateChange: done');
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Fetch user profile from DB to get org_id and role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, org_id, role, full_name')
        .eq('email', email)
        .single();

      if (profileError) {
        console.error(
          'Failed to fetch user profile after login:',
          profileError
        );
        // Sign out the user since we can't get their profile
        await supabase.auth.signOut();
        throw new Error(
          'User profile not found. Please contact your administrator to ensure your account is properly set up.'
        );
      }

      // Merge org_id and role into user object
      const mergedUser = {
        id: authData?.user?.id ?? profile.id ?? '',
        email: authData?.user?.email ?? '',
        org_id: profile.org_id ?? '',
        role: profile.role ?? '',
        full_name: profile.full_name ?? '',
        created_at: authData?.user?.created_at ?? '',
        updated_at: authData?.user?.updated_at ?? '',
      };
      console.log('Merged user after login:', mergedUser);
      setUser(mergedUser);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setMsalAccount(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithMicrosoft = async () => {
    setLoading(true);
    try {
      const loginResponse = await msalInstance.loginPopup({
        scopes: ['user.read'],
      });
      setMsalAccount(loginResponse.account ?? null);
    } catch (error) {
      console.error('Microsoft login error:', error);
      setMsalAccount(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        msalAccount,
        loading,
        login,
        signup,
        logout,
        loginWithMicrosoft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
