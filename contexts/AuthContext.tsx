
import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        updateUserState(session.user);
        await ensureCompany();
      }
      setLoading(false);
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
  }, []);

  const ensureCompany = async () => {
    setLoadingCompany(true);
    try {
      const membership = await db.team.getMembership();
      if (membership) {
        setCompanyId(membership.company_id);
        setMembershipRole(membership.role);
        setCompanyName(membership.companies?.name || 'Minha Empresa');
      } else {
        setCompanyId(null);
      }
    } catch (err) {
      console.error('Error ensuring company:', err);
    } finally {
      setLoadingCompany(false);
    }
  };

  const updateUserState = (supabaseUser: any) => {
    const metadata = supabaseUser.user_metadata || {};
    setUser({
      id: supabaseUser.id,
      name: metadata.name || supabaseUser.email?.split('@')[0],
      email: supabaseUser.email || '',
      role: (metadata.role as UserRole) || UserRole.ADMIN,
      active: true,
      permissions: (metadata.permissions as Permission[]) || ADMIN_PERMISSIONS
    });
  };

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
    localStorage.clear();
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    // Admins ou Owners da empresa tem acesso total por padrão na lógica multi-tenant
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando Segurança...</p>
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
