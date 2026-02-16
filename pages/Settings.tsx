
import React, { useState, useEffect } from 'react';
import { Building2, Users, ShoppingBag, Box, Store, Wallet, Bell, Link2, Monitor, ChevronRight, Save, CheckCircle2, UserPlus, Trash2, Edit2, X, Lock, Cpu } from 'lucide-react';
import { useAppSettings, ThemeMode } from '../contexts/AppSettingsContext';
import { Language } from '../i18n/translations';
import { User, UserRole, Permission } from '../types';
import { generateId } from '../utils/helpers';

type SectionType = 'company' | 'users' | 'commercial' | 'inventory' | 'pos' | 'finance' | 'notifications' | 'integrations' | 'appearance';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('appearance');
  const { settings, updateSettings, t } = useAppSettings();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const changed = 
      localSettings.theme !== settings.theme || 
      localSettings.language !== settings.language || 
      localSettings.sidebarCompact !== settings.sidebarCompact;
    setIsDirty(changed);
  }, [localSettings, settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setIsDirty(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const menuItems = [
    { id: 'appearance', label: t('system_interface'), icon: <Monitor size={18} /> },
    { id: 'users', label: t('users_permissions'), icon: <Users size={18} /> },
    { id: 'company', label: 'Dados da Empresa', icon: <Building2 size={18} /> },
    { id: 'commercial', label: 'Comercial & Vendas', icon: <ShoppingBag size={18} /> },
    { id: 'inventory', label: 'Estoque & Produtos', icon: <Box size={18} /> },
    { id: 'pos', label: 'Ponto de Venda (PDV)', icon: <Store size={18} /> },
    { id: 'finance', label: 'Financeiro', icon: <Wallet size={18} /> },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={18} /> },
    { id: 'integrations', label: 'Integrações & API', icon: <Link2 size={18} /> },
  ];

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={20} /> {t('saved_success')}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter uppercase">Configurações</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium italic">Customização do ambiente Nexero Enterprise.</p>
        </div>
        {activeSection === 'appearance' && (
          <button 
            onClick={handleSave}
            disabled={!isDirty}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all uppercase text-[10px] tracking-widest
              ${isDirty 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}
            `}
          >
            <Save size={18} /> {t('save_changes')}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
        <div className="w-full md:w-72 space-y-1 shrink-0 overflow-y-auto pb-4 pr-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SectionType)}
              className={`
                w-full flex items-center justify-between p-4 rounded-2xl transition-all
                ${activeSection === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 font-black' 
                  : 'text-slate-50 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={activeSection === item.id ? 'text-white' : 'text-indigo-500'}>{item.icon}</span>
                <span className="text-xs uppercase tracking-wider">{item.label}</span>
              </div>
              {activeSection === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-y-auto p-4 md:p-10 transition-colors">
          {activeSection === 'appearance' && (
            <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionHeader title={t('system_interface')} subtitle={t('system_interface_sub')} />
              <div className="space-y-6">
                <SelectField 
                  label={t('theme_visual')} 
                  options={[
                    { label: t('theme_auto'), value: 'system' },
                    { label: t('theme_light'), value: 'light' },
                    { label: t('theme_dark'), value: 'dark' }
                  ]}
                  value={localSettings.theme}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setLocalSettings(prev => ({ ...prev, theme: e.target.value as ThemeMode }))
                  }
                />
                <SelectField 
                  label={t('language')} 
                  options={[
                    { label: 'Português (Brasil)', value: 'pt-BR' },
                    { label: 'English (US)', value: 'en' }
                  ]}
                  value={localSettings.language}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setLocalSettings(prev => ({ ...prev, language: e.target.value as Language }))
                  }
                />
                <ToggleField 
                  label={t('compact_sidebar')} 
                  description={t('compact_sidebar_sub')} 
                  checked={localSettings.sidebarCompact}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setLocalSettings(prev => ({ ...prev, sidebarCompact: e.target.checked }))
                  }
                />
              </div>
            </div>
          )}
          
          {activeSection === 'users' && <UsersSettingsForm />}

          {!['appearance', 'users'].includes(activeSection) && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
              <Cpu size={64} className="mb-4 animate-pulse-slow" />
              <p className="text-sm font-black uppercase tracking-widest">Módulo em Integração</p>
              <p className="text-xs font-medium">Os recursos de {activeSection} estão sendo sincronizados com a nuvem.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-10 pb-8 border-b border-slate-100 dark:border-slate-800/50">
    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 leading-relaxed">{subtitle}</p>
  </div>
);

const InputField = ({ label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all"
    />
  </div>
);

const SelectField = ({ label, options, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <select 
        value={value}
        onChange={onChange}
        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-all appearance-none"
      >
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronRight size={16} className="rotate-90" />
      </div>
    </div>
  </div>
);

const ToggleField = ({ label, description, checked, onChange }: any) => (
  <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 transition-all hover:bg-white dark:hover:bg-slate-800 group">
    <div className="pr-4">
      <p className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">{label}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium italic">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked} 
        onChange={onChange}
      />
      <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
    </label>
  </div>
);

const UsersSettingsForm: React.FC = () => {
  const { t } = useAppSettings();
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vendaflow_users_v1');
    if (saved) return JSON.parse(saved);
    return [
      { 
        id: '1', 
        name: 'Administrador Nexero', 
        email: 'admin@nexero.app', 
        role: UserRole.ADMIN, 
        active: true, 
        permissions: ['FINANCE', 'INVENTORY', 'PRODUCTS', 'ORDERS', 'POS', 'SETTINGS', 'REPORTS'] 
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    localStorage.setItem('vendaflow_users_v1', JSON.stringify(users));
  }, [users]);

  const handleDelete = (id: string) => {
    if (id === '1') return alert('O administrador principal não pode ser removido.');
    if (confirm('Deseja realmente remover este usuário?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleSaveUser = (user: User) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      setUsers([...users, { ...user, id: generateId() }]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <SectionHeader 
          title={t('users_permissions')} 
          subtitle="Gerencie sua equipe e controle quem pode acessar cada módulo do Nexero." 
        />
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <UserPlus size={18} /> {t('add_user')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('name')}</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('role')}</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('status')}</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-sm border border-indigo-100 dark:border-indigo-500/10">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">{user.name}</p>
                      <p className="text-xs text-slate-500 font-medium italic">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${user.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {user.active ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === '1'}
                      className={`p-2 transition-colors ${user.id === '1' ? 'text-slate-200 cursor-not-allowed opacity-30' : 'text-slate-400 hover:text-rose-600'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveUser} 
        />
      )}
    </div>
  );
};

const UserModal: React.FC<{ user: User | null, onClose: () => void, onSave: (user: User) => void }> = ({ user, onClose, onSave }) => {
  const { t } = useAppSettings();
  const [formData, setFormData] = useState<User>(user || {
    id: '',
    name: '',
    email: '',
    role: UserRole.SELLER,
    active: true,
    permissions: ['ORDERS', 'POS']
  });

  const permissionList: { key: Permission, label: string }[] = [
    { key: 'FINANCE', label: t('access_finance') },
    { key: 'INVENTORY', label: t('access_inventory') },
    { key: 'PRODUCTS', label: t('access_products') },
    { key: 'ORDERS', label: t('access_orders') },
    { key: 'POS', label: t('access_pos') },
    { key: 'SETTINGS', label: t('access_settings') },
    { key: 'REPORTS', label: t('access_reports') },
  ];

  const togglePermission = (perm: Permission) => {
    const has = formData.permissions.includes(perm);
    if (has) {
      setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...formData.permissions, perm] });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{user ? t('edit_user') : t('add_user')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-sm"><X size={24} /></button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-5">
            <InputField 
              label={t('name')} 
              placeholder="Ex: João Silva" 
              value={formData.name} 
              onChange={(e: any) => setFormData({...formData, name: e.target.value})} 
            />
            <InputField 
              label={t('email')} 
              placeholder="Ex: joao@nexero.app" 
              value={formData.email} 
              onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField 
              label={t('role')} 
              options={Object.values(UserRole).map(role => ({ label: role, value: role }))}
              value={formData.role}
              onChange={(e: any) => setFormData({...formData, role: e.target.value as UserRole})}
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('status')}</label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setFormData({...formData, active: true})}
                  className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-tighter ${formData.active ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {t('active')}
                </button>
                <button 
                  onClick={() => setFormData({...formData, active: false})}
                  className={`flex-1 py-2.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-tighter ${!formData.active ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {t('inactive')}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-widest">
              <Lock size={16} className="text-indigo-500" /> Níveis de Acesso
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionList.map(perm => (
                <button
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    formData.permissions.includes(perm.key)
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">{perm.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.permissions.includes(perm.key) ? 'bg-white border-white' : 'border-slate-300'}`}>
                    {formData.permissions.includes(perm.key) && <CheckCircle2 size={12} className="text-indigo-600" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-white/50 text-xs uppercase tracking-widest">Cancelar</button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-2 w-2/3 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            {user ? 'Atualizar Membro' : 'Ativar Acesso'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
