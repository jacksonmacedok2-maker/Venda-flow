
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import POS from './pages/POS';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import Reports from './pages/Reports';
import Team from './pages/Team';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import AuthConfirmed from './pages/AuthConfirmed';
import AuthError from './pages/AuthError';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/database';
import { Loader2, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  // Roteamento baseado em chaves internas para máxima compatibilidade
  const [activeKey, setActiveKey] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'dashboard';
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isAuthenticated, logout, hasPermission } = useAuth();

  // Sincroniza a chave ativa com o hash da URL para permitir "F5"
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveKey(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (key: string) => {
    setActiveKey(key);
    window.location.hash = key;
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await db.syncPendingData();
      setIsSyncing(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      db.syncPendingData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const renderContent = () => {
    // Tratamento de páginas de autenticação (URL baseada em Path ainda para Callbacks do Supabase)
    const path = window.location.pathname;
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    if (queryParams.has('error') || hashParams.has('error')) return <AuthError setActiveTab={() => navigateTo('dashboard')} />;
    if (queryParams.has('code') || hashParams.has('access_token')) return <AuthCallback setActiveTab={() => navigateTo('dashboard')} />;
    if (path.includes('/auth/confirmed')) return <AuthConfirmed setActiveTab={() => navigateTo('dashboard')} />;

    if (!isAuthenticated) {
      return <Login />;
    }

    // Switch baseado na CHAVE de estado
    switch (activeKey) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return hasPermission('ORDERS') ? <Orders /> : <AccessDenied />;
      case 'clients':
        return hasPermission('CLIENTS') ? <Clients /> : <AccessDenied />;
      case 'pos':
        return hasPermission('POS') ? <POS /> : <AccessDenied />;
      case 'team':
        return hasPermission('TEAM') ? <Team /> : <AccessDenied />;
      case 'products':
        return hasPermission('PRODUCTS') ? <Products /> : <AccessDenied />;
      case 'inventory':
        return hasPermission('INVENTORY') ? <Inventory /> : <AccessDenied />;
      case 'finance':
        return hasPermission('FINANCE') ? <Finance /> : <AccessDenied />;
      case 'reports':
        return hasPermission('REPORTS') ? <Reports /> : <AccessDenied />;
      case 'settings':
        return hasPermission('SETTINGS') ? <Settings /> : <AccessDenied />;
      default:
        return <Dashboard />;
    }
  };

  const isAuthPage = !isAuthenticated || window.location.pathname.includes('/auth/');

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {renderContent()}
      </div>
    );
  }

  return (
    <Layout activeTab={activeKey} setActiveTab={navigateTo} isOnline={isOnline} onLogout={logout}>
      {isSyncing && (
        <div className="fixed bottom-20 right-4 z-[100] bg-brand-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
        </div>
      )}
      <div className="pb-10 md:pb-0 h-full">
        {renderContent()}
      </div>
    </Layout>
  );
};

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-6">
      <ShieldCheck size={40} />
    </div>
    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">Acesso Restrito</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 italic font-medium">Você não possui as permissões necessárias para este módulo.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <AppSettingsProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AppSettingsProvider>
  );
};

export default App;
