
import React, { useState } from 'react';
import { Menu, Bell, User, Cloud, CloudOff, LogOut, ChevronDown, BarChart, Search, LayoutDashboard, ShoppingCart, Store, Package, Settings } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../constants';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOnline: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isOnline, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { settings, t } = useAppSettings();
  const { user, hasPermission } = useAuth();
  const isCompact = settings.sidebarCompact;

  const visibleNavItems = NAVIGATION_ITEMS.filter(item => 
    !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  // Itens para a barra inferior (Mobile)
  const bottomNavItems = [
    { key: 'dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { key: 'pos', path: '/pos', icon: <Store size={20} />, permission: 'POS' },
    { key: 'orders', path: '/orders', icon: <ShoppingCart size={20} />, permission: 'ORDERS' },
    { key: 'products', path: '/products', icon: <Package size={20} />, permission: 'PRODUCTS' },
    { key: 'settings', path: '/settings', icon: <Settings size={20} />, permission: 'SETTINGS' },
  ].filter(item => !item.permission || hasPermission(item.permission as any));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden font-sans">
      {/* Sidebar - Desktop Only */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-surface-900 text-slate-300 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCompact ? 'w-20' : 'w-64'}
        hidden md:flex flex-col border-r border-slate-800 shadow-xl
      `}>
        <div className={`h-16 flex items-center px-6 border-b border-slate-800 ${isCompact ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center shrink-0 shadow-lg shadow-brand-600/20">
              <BarChart size={18} className="text-white" />
            </div>
            {!isCompact && <span className="text-lg font-bold tracking-tight text-white leading-tight uppercase">Nexero</span>}
          </div>
        </div>

        <nav className="mt-6 px-3 space-y-1 flex-1">
          {visibleNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setActiveTab(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                ${activeTab === item.path ? 'bg-brand-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}
                ${isCompact ? 'justify-center' : ''}
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCompact && <span>{t(item.key as any)}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-sm font-bold">
              <LogOut size={18} /> {!isCompact && 'Sair'}
           </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        <header className="h-14 md:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-black text-xs">N</div>
            <h1 className="md:hidden text-sm font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Nexero</h1>
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 w-64">
              <Search size={14} className="text-slate-400 mr-2" />
              <input type="text" placeholder="Pesquisar..." className="bg-transparent border-none text-[10px] w-full focus:outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
               {isOnline ? (
                  <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                    <Cloud size={14} />
                  </span>
                ) : (
                  <span className="text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-1.5 rounded-full border border-amber-100 dark:border-amber-500/20">
                    <CloudOff size={14} />
                  </span>
                )}
            </div>

            <button className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <div className="w-7 h-7 rounded bg-brand-600 flex items-center justify-center text-white text-[10px] font-black">
                {user?.name.charAt(0)}
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-[60] md:hidden">
        {bottomNavItems.map(item => (
          <button
            key={item.path}
            onClick={() => setActiveTab(item.path)}
            className={`flex flex-col items-center justify-center w-14 h-full gap-1 transition-colors ${activeTab === item.path ? 'text-brand-600' : 'text-slate-400'}`}
          >
            <div className={`${activeTab === item.path ? 'scale-110' : ''} transition-transform`}>{item.icon}</div>
            <span className="text-[8px] font-black uppercase tracking-widest">{t(item.key as any).substring(0, 8)}</span>
            {activeTab === item.path && <div className="w-1 h-1 bg-brand-600 rounded-full absolute bottom-1" />}
          </button>
        ))}
      </div>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setIsProfileOpen(false)}>
          <div className="absolute top-14 right-4 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
               <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user?.name}</p>
               <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{user?.role}</p>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <User size={16} /> Perfil
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
