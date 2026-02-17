
import React, { useState, useEffect, useRef } from 'react';
import { Building2, Users, ShoppingBag, Box, Store, Wallet, Bell, Link2, Monitor, ChevronRight, Save, CheckCircle2, UserPlus, Trash2, Edit2, X, Lock, Cpu, Loader2, AlertCircle, ShoppingCart, Tag, CreditCard, Truck, Target, MapPin, Phone, Mail, Globe, Clock, Landmark, Camera } from 'lucide-react';
import { useAppSettings, ThemeMode } from '../contexts/AppSettingsContext';
import { Language } from '../i18n/translations';
import { User, UserRole, Permission, CommercialSettings, CompanySettings } from '../types';
import { generateId } from '../utils/helpers';
import { db } from '../services/database';

type SectionType = 'company' | 'users' | 'commercial' | 'inventory' | 'pos' | 'finance' | 'notifications' | 'integrations' | 'appearance';

// --- COMPONENTES AUXILIARES ---

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-10 pb-8 border-b border-slate-100 dark:border-slate-800/50">
    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 leading-relaxed">{subtitle}</p>
  </div>
);

const InputField = ({ label, placeholder, value, onChange, type = "text", icon }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">{icon}</div>}
      <input 
        type={type} 
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-sm font-bold text-slate-800 dark:text-slate-100 transition-all ${icon ? 'pl-12' : ''}`}
      />
    </div>
  </div>
);

const SelectField = ({ label, options, value, onChange, icon }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors z-10 pointer-events-none">{icon}</div>}
      <select 
        value={value}
        onChange={onChange}
        className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-all appearance-none ${icon ? 'pl-12' : ''}`}
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
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium italic">{description}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input 
        type="checkbox" 
        className="sr-only peer" 
        checked={checked} 
        onChange={onChange}
      />
      <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 shadow-inner"></div>
    </label>
  </div>
);

const SettingsCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children?: React.ReactNode }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-brand-600 shadow-sm border border-slate-100 dark:border-slate-800">
        {icon}
      </div>
      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{title}</h4>
    </div>
    {children}
  </div>
);

// --- FORMULÁRIOS DE SEÇÃO ---

const CompanySettingsSection = ({ settings, setSettings, isLoading, isSaving }: { settings: CompanySettings | null, setSettings: React.Dispatch<React.SetStateAction<CompanySettings | null>>, isLoading: boolean, isSaving: boolean }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (isLoading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acessando dados da empresa...</p>
      </div>
    );
  }

  if (!settings) return null;

  const update = (key: keyof CompanySettings, value: any) => {
    setSettings(prev => prev ? ({ ...prev, [key]: value }) : null);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A logo deve ter no máximo 2MB.');
      return;
    }

    setIsUploading(true);
    try {
      const url = await db.company.uploadLogo(file);
      update('logo_url', url);
    } catch (error) {
      console.error(error);
      alert('Erro ao realizar upload da logo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionHeader title="Dados da Empresa" subtitle="Mantenha as informações do seu negócio atualizadas para emissão de pedidos e branding." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Identificação */}
        <SettingsCard icon={<Landmark size={20} />} title="Identificação">
          <div className="space-y-6">
            <InputField 
              label="Nome Fantasia" 
              placeholder="Ex: Nexero Store" 
              value={settings.trade_name} 
              onChange={(e: any) => update('trade_name', e.target.value)} 
            />
            <InputField 
              label="Razão Social" 
              placeholder="Ex: Nexero LTDA" 
              value={settings.legal_name} 
              onChange={(e: any) => update('legal_name', e.target.value)} 
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="CNPJ / CPF" placeholder="00.000.000/0000-00" value={settings.document} onChange={(e: any) => update('document', e.target.value)} />
              <InputField label="Inscrição Estadual" placeholder="Isento" value={settings.state_registration} onChange={(e: any) => update('state_registration', e.target.value)} />
            </div>
          </div>
        </SettingsCard>

        {/* Branding */}
        <SettingsCard icon={<Camera size={20} />} title="Identidade Visual">
          <div className="flex flex-col items-center justify-center py-4 space-y-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                {isUploading ? (
                  <Loader2 className="animate-spin text-brand-600" />
                ) : settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo Empresa" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 size={40} className="text-slate-300" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-brand-700 transition-all"
              >
                <Camera size={18} />
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">Logo da Empresa</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1 italic">PNG ou JPG até 2MB. Recomendado 512x512px.</p>
              {settings.logo_url && (
                <button 
                  onClick={() => update('logo_url', '')}
                  className="mt-4 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                >
                  Remover Logotipo
                </button>
              )}
            </div>
          </div>
        </SettingsCard>

        {/* Contato */}
        <SettingsCard icon={<Phone size={20} />} title="Contato e Atendimento">
          <div className="space-y-6">
            <InputField label="E-mail Comercial" icon={<Mail size={18}/>} placeholder="atendimento@empresa.com" value={settings.email} onChange={(e: any) => update('email', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Telefone Fixo" icon={<Phone size={18}/>} placeholder="(00) 0000-0000" value={settings.phone} onChange={(e: any) => update('phone', e.target.value)} />
              <InputField label="WhatsApp" icon={<Users size={18}/>} placeholder="(00) 00000-0000" value={settings.whatsapp} onChange={(e: any) => update('whatsapp', e.target.value)} />
            </div>
          </div>
        </SettingsCard>

        {/* Endereço */}
        <SettingsCard icon={<MapPin size={20} />} title="Localização">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <InputField label="CEP" placeholder="00000-000" value={settings.cep} onChange={(e: any) => update('cep', e.target.value)} />
              </div>
              <div className="col-span-2">
                <InputField label="Rua / Logradouro" placeholder="Av. Principal" value={settings.street} onChange={(e: any) => update('street', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="Número" placeholder="S/N" value={settings.number} onChange={(e: any) => update('number', e.target.value)} />
              <InputField label="Bairro" placeholder="Centro" value={settings.district} onChange={(e: any) => update('district', e.target.value)} />
              <InputField label="Cidade" placeholder="São Paulo" value={settings.city} onChange={(e: any) => update('city', e.target.value)} />
            </div>
          </div>
        </SettingsCard>

        {/* Preferências Regionais */}
        <SettingsCard icon={<Globe size={20} />} title="Regionalização">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <SelectField 
                label="Moeda Padrão" 
                icon={<Wallet size={18}/>}
                options={[{ label: 'Real Brasileiro (R$)', value: 'BRL' }, { label: 'Dólar (US$)', value: 'USD' }]} 
                value={settings.currency} 
                onChange={(e: any) => update('currency', e.target.value)} 
              />
              <SelectField 
                label="Fuso Horário" 
                icon={<Clock size={18}/>}
                options={[
                  { label: 'Brasília (GMT-3)', value: 'America/Sao_Paulo' },
                  { label: 'Cuiabá (GMT-4)', value: 'America/Cuiaba' },
                  { label: 'Manaus (GMT-4)', value: 'America/Manaus' }
                ]} 
                value={settings.timezone} 
                onChange={(e: any) => update('timezone', e.target.value)} 
              />
            </div>
          </div>
        </SettingsCard>

        {/* Notas Adicionais */}
        <SettingsCard icon={<Edit2 size={20} />} title="Observações Internas">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Notas Gerais</label>
            <textarea 
              placeholder="Informações adicionais que aparecerão em notas fiscais ou cabeçalhos..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-sm font-bold text-slate-800 dark:text-slate-100 min-h-[120px] transition-all resize-none"
              value={settings.notes}
              onChange={(e: any) => update('notes', e.target.value)}
            />
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

const UsersSettingsForm = ({ t }: any) => {
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
          className="bg-brand-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95"
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
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-black shadow-sm border border-brand-100 dark:border-brand-500/10">
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
                      className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
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
              <Lock size={16} className="text-brand-500" /> Níveis de Acesso
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissionList.map(perm => (
                <button
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    formData.permissions.includes(perm.key)
                    ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-600/10'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">{perm.label}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.permissions.includes(perm.key) ? 'bg-white border-white' : 'border-slate-300'}`}>
                    {formData.permissions.includes(perm.key) && <CheckCircle2 size={12} className="text-brand-600" />}
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
            className="flex-2 w-2/3 py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95 text-xs uppercase tracking-widest"
          >
            {user ? 'Atualizar Membro' : 'Ativar Acesso'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CommercialSettingsSection = ({ settings, setSettings, isLoading }: { settings: CommercialSettings | null, setSettings: React.Dispatch<React.SetStateAction<CommercialSettings | null>>, isLoading: boolean }) => {
  if (isLoading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando configurações...</p>
      </div>
    );
  }

  if (!settings) return null;

  const update = (key: keyof CommercialSettings, value: any) => {
    setSettings(prev => prev ? ({ ...prev, [key]: value }) : null);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
      <SectionHeader title="Comercial & Vendas" subtitle="Configure as regras de negócio, limites de desconto, frete e faturamento da sua empresa." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SettingsCard icon={<ShoppingCart size={20} />} title="Regras de Venda">
           <div className="space-y-6">
             <InputField label="Valor Mínimo do Pedido (R$)" type="number" value={settings.minimum_order_value} onChange={(e: any) => update('minimum_order_value', parseFloat(e.target.value))} />
             <ToggleField label="Aprovação Automática" description="Aprovar pedidos imediatamente após a finalização." checked={settings.auto_approve_orders} onChange={(e: any) => update('auto_approve_orders', e.target.checked)} />
             <ToggleField label="Venda sem Estoque" description="Permitir que produtos com estoque zero sejam vendidos." checked={settings.allow_negative_stock} onChange={(e: any) => update('allow_negative_stock', e.target.checked)} />
             <InputField label="Alerta de Estoque Baixo (unidades)" type="number" value={settings.low_stock_threshold} onChange={(e: any) => update('low_stock_threshold', parseInt(e.target.value))} />
           </div>
        </SettingsCard>

        <SettingsCard icon={<Tag size={20} />} title="Políticas de Desconto">
          <div className="space-y-6">
            <InputField label="Desconto Máximo Permitido (%)" type="number" value={settings.max_discount_percent} onChange={(e: any) => update('max_discount_percent', parseFloat(e.target.value))} />
             <ToggleField label="Override Administrativo" description="Permitir que administradores ignorem o limite de desconto." checked={settings.allow_discount_override} onChange={(e: any) => update('allow_discount_override', e.target.checked)} />
             <div className="p-4 bg-brand-50 dark:bg-brand-500/10 rounded-2xl border border-brand-100 dark:border-brand-500/20 flex gap-3">
               <AlertCircle size={18} className="text-brand-600 shrink-0" />
               <p className="text-[10px] text-brand-700 dark:text-brand-400 leading-relaxed font-medium">
                 Dica: Limites de desconto protegem sua margem de lucro. O override deve ser usado apenas por supervisores.
               </p>
             </div>
          </div>
        </SettingsCard>

        <SettingsCard icon={<CreditCard size={20} />} title="Meios de Pagamento">
           <div className="space-y-6">
             <SelectField label="Meio de Pagamento Padrão" options={[{ label: 'PIX', value: 'PIX' }, { label: 'Cartão de Crédito', value: 'CARTAO' }, { label: 'Dinheiro', value: 'DINHEIRO' }, { label: 'Boleto Bancário', value: 'BOLETO' }]} value={settings.default_payment_method} onChange={(e: any) => update('default_payment_method', e.target.value)} />
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Métodos Habilitados no PDV</label>
                <div className="flex flex-wrap gap-2">
                  {['PIX', 'CARTAO', 'DINHEIRO', 'BOLETO'].map(m => (
                    <button 
                      key={m}
                      onClick={() => {
                        const current = settings.allowed_payment_methods || [];
                        const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
                        update('allowed_payment_methods', next);
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        (settings.allowed_payment_methods || []).includes(m)
                        ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
             </div>
           </div>
        </SettingsCard>

        <SettingsCard icon={<Box size={20} />} title="Numeração de Pedidos">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <InputField label="Prefixo" value={settings.order_code_prefix} onChange={(e: any) => update('order_code_prefix', e.target.value.toUpperCase())} />
               <InputField label="Dígitos" type="number" value={settings.order_code_padding} onChange={(e: any) => update('order_code_padding', parseInt(e.target.value))} />
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Exemplo de Código</p>
              <p className="text-2xl font-black text-white tracking-tighter">
                {settings.order_code_prefix}-{ '0'.repeat(settings.order_code_padding - 1) + '1' }
              </p>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('appearance');
  const { settings, updateSettings, t } = useAppSettings();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [commercialLocal, setCommercialLocal] = useState<CommercialSettings | null>(null);
  const [originalCommercial, setOriginalCommercial] = useState<CommercialSettings | null>(null);

  const [companyLocal, setCompanyLocal] = useState<CompanySettings | null>(null);
  const [originalCompany, setOriginalCompany] = useState<CompanySettings | null>(null);
  
  const [isDirty, setIsDirty] = useState(false);
  const [isCommercialDirty, setIsCommercialDirty] = useState(false);
  const [isCompanyDirty, setIsCompanyDirty] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (activeSection === 'commercial' && !commercialLocal) {
      loadCommercialSettings();
    }
    if (activeSection === 'company' && !companyLocal) {
      loadCompanySettings();
    }
  }, [activeSection]);

  const loadCommercialSettings = async () => {
    setIsLoading(true);
    const data = await db.commercial.getSettings();
    if (data) {
      setCommercialLocal(data);
      setOriginalCommercial(data);
    }
    setIsLoading(false);
  };

  const loadCompanySettings = async () => {
    setIsLoading(true);
    const data = await db.company.getSettings();
    if (data) {
      setCompanyLocal(data);
      setOriginalCompany(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (commercialLocal && originalCommercial) {
      const isChanged = JSON.stringify(commercialLocal) !== JSON.stringify(originalCommercial);
      setIsCommercialDirty(isChanged);
    }
  }, [commercialLocal, originalCommercial]);

  useEffect(() => {
    if (companyLocal && originalCompany) {
      const isChanged = JSON.stringify(companyLocal) !== JSON.stringify(originalCompany);
      setIsCompanyDirty(isChanged);
    }
  }, [companyLocal, originalCompany]);

  const handleSave = () => {
    updateSettings(localSettings);
    setIsDirty(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSaveCommercial = async () => {
    if (!commercialLocal) return;
    setIsLoading(true);
    try {
      const updated = await db.commercial.updateSettings(commercialLocal);
      if (updated) {
        setOriginalCommercial(updated);
        setCommercialLocal(updated);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyLocal) return;
    setIsLoading(true);
    try {
      const updated = await db.company.updateSettings(companyLocal);
      if (updated) {
        setOriginalCompany(updated);
        setCompanyLocal(updated);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar dados da empresa.');
    } finally {
      setIsLoading(false);
    }
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
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}
            `}
          >
            <Save size={18} /> {t('save_changes')}
          </button>
        )}

        {activeSection === 'commercial' && (
          <button 
            onClick={handleSaveCommercial}
            disabled={!isCommercialDirty || isLoading}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all uppercase text-[10px] tracking-widest
              ${isCommercialDirty 
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}
            `}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            SALVAR ALTERAÇÕES
          </button>
        )}

        {activeSection === 'company' && (
          <button 
            onClick={handleSaveCompany}
            disabled={!isCompanyDirty || isLoading}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all uppercase text-[10px] tracking-widest
              ${isCompanyDirty 
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}
            `}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            SALVAR DADOS DA EMPRESA
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
                  ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20 font-black' 
                  : 'text-slate-700 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:shadow-sm'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className={activeSection === item.id ? 'text-white' : 'text-brand-500'}>{item.icon}</span>
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
          
          {activeSection === 'users' && <UsersSettingsForm t={t} />}

          {activeSection === 'commercial' && (
            <CommercialSettingsSection 
              settings={commercialLocal} 
              setSettings={setCommercialLocal} 
              isLoading={isLoading} 
            />
          )}

          {activeSection === 'company' && (
            <CompanySettingsSection 
              settings={companyLocal} 
              setSettings={setCompanyLocal} 
              isLoading={isLoading} 
              isSaving={isLoading} 
            />
          )}

          {!['appearance', 'users', 'commercial', 'company'].includes(activeSection) && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
              <Cpu size={64} className="mb-4 animate-pulse" />
              <p className="text-sm font-black uppercase tracking-widest">Módulo em Integração</p>
              <p className="text-xs font-medium">Os recursos de {activeSection} estão sendo sincronizados com a nuvem.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
