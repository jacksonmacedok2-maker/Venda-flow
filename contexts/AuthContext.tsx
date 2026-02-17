
// Add React import to fix namespace errors for React.FC and React.ReactNode
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
  const [loading, setLoading] = useState(true); // Bloqueio inicial de sessão
  const [loadingCompany, setLoadingCompany] = useState(false); // Carregamento de metadados da empresa
  
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
      } else if (retryCount < 3) {
        // Tenta novamente se não achar, mas com delay menor
        setTimeout(() => ensureCompany(retryCount + 1), 1500);
      } else {
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
          // Chamamos ensureCompany sem o AWAIT para não travar a UI principal
          ensureCompany();
        }
      } catch (err) {
        console.error('Erro na inicialização da autenticação:', err);
      } finally {
        // Garantimos que o loading principal acabe em no máximo 1-2 segundos
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        updateUserState(session.user);
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          ensureCompany();
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
    setTimeout(() => { justSetCompanyManual.current = false; }, 5000);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, metadata: any): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          role: UserRole.ADMIN,
          permissions: ADMIN_PERMISSIONS
        },
        emailRedirectTo: window.location.origin + '/',
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
    ensureCompany();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-600"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-brand-600 rounded-full animate-ping"></div>
             </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] animate-pulse">Nexero Enterprise</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Validando Sessão de Segurança...</p>
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
