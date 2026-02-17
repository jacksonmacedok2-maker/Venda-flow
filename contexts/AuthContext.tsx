
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, Permission } from '../types';
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
  setAuthenticatedCompany: (id: string, name: string, role: string) => void;
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
  
  // Ref para rastrear se acabamos de definir uma empresa manualmente para evitar sobrescrita por delay de consulta
  const justSetCompanyManual = useRef(false);

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

  const ensureCompany = useCallback(async (retryCount = 0) => {
    // Se acabamos de setar manualmente, ignoramos consultas automáticas por 5 segundos
    if (justSetCompanyManual.current && retryCount === 0) return;

    setLoadingCompany(true);
    
    try {
      const membership = await db.team.getMembership();

      if (membership) {
        setCompanyId(membership.company_id);
        setMembershipRole(membership.role);
        setCompanyName(membership.companies?.name || 'Minha Empresa');
        setLoadingCompany(false);
        justSetCompanyManual.current = false;
      } else if (retryCount < 4) {
        // Se não encontrou, tenta novamente com backoff
        console.log(`Tentativa ${retryCount + 1} de localizar empresa no banco...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return ensureCompany(retryCount + 1);
      } else {
        // Se após todas as tentativas não houver empresa, limpamos apenas se não houver um ID manual
        if (!justSetCompanyManual.current) {
          setCompanyId(null);
          setMembershipRole(null);
          setCompanyName(null);
        }
        setLoadingCompany(false);
      }
    } catch (err) {
      console.warn('Erro ao buscar empresa:', err);
      setLoadingCompany(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          updateUserState(session.user);
          await ensureCompany();
        }
      } catch (err) {
        console.error('Erro na inicialização da autenticação:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        updateUserState(session.user);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await ensureCompany();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCompanyId(null);
        setCompanyName(null);
        setMembershipRole(null);
        justSetCompanyManual.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [updateUserState, ensureCompany]);

  const setAuthenticatedCompany = (id: string, name: string, role: string) => {
    justSetCompanyManual.current = true;
    setCompanyId(id);
    setCompanyName(name);
    setMembershipRole(role);
    setLoadingCompany(false);

    // Proteção: após 8 segundos, permitimos que o 'ensure' volte a funcionar normalmente
    setTimeout(() => {
      justSetCompanyManual.current = false;
    }, 8000);
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
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: { emailRedirectTo: window.location.origin + '/' }
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
    justSetCompanyManual.current = false;
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Segurança...</p>
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
      setAuthenticatedCompany,
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
