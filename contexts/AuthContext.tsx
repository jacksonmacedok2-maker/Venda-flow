
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permission } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: any) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updateUserState(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        updateUserState(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserState = (supabaseUser: any) => {
    const metadata = supabaseUser.user_metadata || {};
    setUser({
      id: supabaseUser.id,
      name: metadata.companyName || metadata.name || supabaseUser.email?.split('@')[0],
      email: supabaseUser.email || '',
      role: (metadata.role as UserRole) || UserRole.ADMIN,
      active: true,
      permissions: (metadata.permissions as Permission[]) || ['FINANCE', 'INVENTORY', 'PRODUCTS', 'ORDERS', 'POS', 'SETTINGS', 'REPORTS', 'CLIENTS']
    });
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    if (data.user) {
      updateUserState(data.user);
    }
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
          permissions: ['FINANCE', 'INVENTORY', 'PRODUCTS', 'ORDERS', 'POS', 'SETTINGS', 'REPORTS', 'CLIENTS']
        }
      }
    });

    if (error) throw error;
    
    // Sucesso imediato: Se houver sessão, o usuário é logado na hora.
    if (data.session) {
      updateUserState(data.user);
      return false; 
    }
    
    // Se não houver sessão imediata mas houver usuário, retornamos true indicando sucesso de criação.
    return !!(data.user && !data.session);
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
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;
    return user.permissions.includes(permission);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Estabelecendo Conexão Segura...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signUp, 
      resetPassword,
      logout, 
      refreshSession,
      isAuthenticated: !!user, 
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
