
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, Permission, Membership } from '../types';
import { supabase } from '../services/supabase';
import { db } from '../services/database';

interface AuthContextType {
  user: User | null;
  companyId: string | null;
  companyName: string | null;
  membershipRole: string | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: any) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  refreshMembership: () => Promise<void>;
  isAuthenticated: boolean;
  loadingCompany: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PERMISSIONS: Permission[] = [
  'FINANCE', 'INVENTORY', 'PRODUCTS', 'ORDERS', 'POS', 
  'SETTINGS', 'REPORTS', 'CLIENTS', 'TEAM'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const updateUserState = useCallback((supabaseUser: any) => {
    if (!supabaseUser) return;
    const metadata = supabaseUser.user_metadata || {};
    setUser({
      id: supabaseUser.id,
      name: metadata.name || supabaseUser.email?.split('@')[0],
      email: supabaseUser.email || '',
      role: (metadata.role as UserRole) || UserRole.ADMIN,
      active: true,
      permissions: (metadata.permissions as Permission[]) || ADMIN_PERMISSIONS
    });
  }, []);

  const ensureCompany = useCallback(async () => {
    setLoadingCompany(true);
    
    // Timeout de 6 segundos para não travar o app se o Supabase demorar
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout searching for company')), 6000)
    );

    try {
      const membershipPromise = db.team.getMembership();
      const membership = await Promise.race([membershipPromise, timeoutPromise]) as Membership | null;

      if (membership) {
        setCompanyId(membership.company_id);
        setMembershipRole(membership.role);
        setCompanyName(membership.companies?.name || 'Minha Empresa');
      } else {
        setCompanyId(null);
        setMembershipRole(null);
      }
    } catch (err) {
      console.warn('Compay fetch skipped or failed:', err);
      setCompanyId(null);
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Timeout agressivo para a sessão inicial
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise((_, r) => setTimeout(() => r('timeout'), 5000));
        
        const result: any = await Promise.race([sessionPromise, timeout]);
        
        if (result === 'timeout') throw new Error('Auth session timeout');
        
        const session = result.data?.session;
        if (session?.user) {
          updateUserState(session.user);
          await ensureCompany();
        }
      } catch (err) {
        console.error('Critical Auth Init Error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        updateUserState(session.user);
        if (event === 'SIGNED_IN') {
          await ensureCompany();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCompanyId(null);
        setCompanyName(null);
        setMembershipRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [updateUserState, ensureCompany]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata: any): Promise<boolean> => {
    const redirectUrl = window.location.origin + '/';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          role: UserRole.ADMIN,
          permissions: ADMIN_PERMISSIONS
        },
        emailRedirectTo: redirectUrl,
      }
    });

    if (error) throw error;
    return !!(data.user && !data.session);
  };

  const resendConfirmation = async (email: string) => {
    const redirectUrl = window.location.origin + '/';
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      }
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCompanyId(null);
    setCompanyName(null);
    setMembershipRole(null);
    localStorage.clear();
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (membershipRole === 'OWNER' || membershipRole === 'ADMIN') return true;
    return user.permissions.includes(permission);
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    if (data.user) updateUserState(data.user);
  };

  const refreshMembership = async () => {
    await ensureCompany();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-brand-600/10 rounded-full"></div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Segurança...</p>
            <p className="text-[10px] text-slate-500 font-medium italic">Validando acesso seguro</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      companyId,
      companyName,
      membershipRole,
      login, 
      signUp, 
      resendConfirmation,
      resetPassword,
      logout, 
      refreshSession,
      refreshMembership,
      isAuthenticated: !!user, 
      loadingCompany,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
