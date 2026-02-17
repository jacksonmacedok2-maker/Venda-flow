
import React, { useState } from 'react';
import { Building2, Loader2, ShieldCheck, Zap, ArrowRight, CheckCircle2, Search, User, Briefcase } from 'lucide-react';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { fetchCnpjData } from '../utils/helpers';

interface CreateCompanyModalProps {
  onSuccess: () => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ onSuccess }) => {
  const { setAuthenticatedCompany } = useAuth();
  const [docType, setDocType] = useState<'CNPJ' | 'CPF'>('CNPJ');
  const [document, setDocument] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (docType !== 'CNPJ') return;
    const cleanDoc = document.replace(/\D/g, '');
    if (cleanDoc.length !== 14) return setError('CNPJ deve ter 14 dígitos.');

    setSearching(true);
    setError('');
    try {
      const data = await fetchCnpjData(cleanDoc);
      setName(data.razao_social || data.nome_fantasia || '');
    } catch (err: any) {
      setError('Não foi possível localizar este CNPJ.');
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; 
    const trimmedName = name.trim();
    if (!trimmedName) return setError('O nome da empresa é obrigatório.');

    setLoading(true);
    setError('');
    
    try {
      // 1. Cria a empresa e o membership via RPC
      const newCompanyId = await db.team.createCompany(trimmedName);
      
      // 2. Inicializa as configurações da empresa IMEDIATAMENTE
      await db.company.updateSettings({
        company_id: newCompanyId,
        trade_name: trimmedName,
        legal_name: trimmedName,
        document: document.trim(),
      } as any);

      // 3. Inicializa configurações comerciais padrão
      await db.commercial.updateSettings({
        company_id: newCompanyId,
        minimum_order_value: 0,
        auto_approve_orders: true,
        order_code_prefix: 'PED',
        order_code_padding: 6
      } as any);
      
      // 4. Injeta os dados diretamente no AuthContext.
      setAuthenticatedCompany(newCompanyId, trimmedName, 'OWNER');
      
      // 5. Finaliza
      onSuccess();

    } catch (err: any) {
      console.error('Erro na criação:', err);
      setError(err.message || 'Erro ao criar empresa. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        <div className="relative h-40 bg-brand-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 -right-10 w-32 h-32 bg-brand-400 rounded-full blur-2xl animate-bounce delay-700" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2 text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shadow-xl border border-white/30">
              <Zap size={32} className="fill-current" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Bem-vindo à Nexero</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Configuração Inicial de Organização</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Dados da sua Empresa</h4>
            <p className="text-xs text-slate-500 font-medium italic">Selecione o tipo de documento e informe o número para começarmos.</p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-[10px] font-black uppercase tracking-widest animate-in shake">
              <ShieldCheck size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button 
                  type="button" 
                  onClick={() => setDocType('CNPJ')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${docType === 'CNPJ' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <Briefcase size={14} /> CNPJ
                </button>
                <button 
                  type="button" 
                  onClick={() => setDocType('CPF')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${docType === 'CPF' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}
                >
                  <User size={14} /> CPF
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Documento ({docType})</label>
                <div className="relative group">
                  <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    disabled={loading}
                    placeholder={docType === 'CNPJ' ? "00.000.000/0000-00" : "000.000.000-00"}
                    className="w-full pl-14 pr-14 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-600 rounded-2xl focus:outline-none transition-all text-sm font-bold disabled:opacity-50"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                  />
                  {docType === 'CNPJ' && (
                    <button 
                      type="button" 
                      onClick={handleLookup}
                      disabled={searching || loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:bg-slate-400 transition-colors"
                    >
                      {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome da Organização</label>
                <input 
                  type="text" 
                  required
                  disabled={loading}
                  placeholder="Ex: Minha Empresa de Sucesso"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-600 rounded-2xl focus:outline-none transition-all text-sm font-bold disabled:opacity-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !name.trim()}
              className="w-full py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-600/30 flex items-center justify-center gap-4 hover:bg-brand-700 active:scale-95 transition-all disabled:bg-slate-300"
            >
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
              {loading ? 'CONFIGURANDO...' : 'INICIAR AGORA'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-slate-400">
             <CheckCircle2 size={14} className="text-emerald-500" />
             <p className="text-[9px] font-black uppercase tracking-widest">Sincronização Cloud Ativada</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyModal;
