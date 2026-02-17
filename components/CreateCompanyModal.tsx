
import React, { useState } from 'react';
import { Building2, Plus, Loader2, Sparkles, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { db } from '../services/database';

interface CreateCompanyModalProps {
  onSuccess: () => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('O nome da empresa é obrigatório.');

    setLoading(true);
    setError('');
    try {
      await db.team.createCompany(name.trim());
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar empresa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header Decorativo */}
        <div className="relative h-48 bg-brand-600 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 -right-10 w-32 h-32 bg-brand-400 rounded-full blur-2xl animate-bounce delay-700" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4 text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center shadow-xl border border-white/30">
              <Zap size={40} className="fill-current" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">Seja Bem-vindo!</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Configure sua instância Nexero</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="text-center space-y-2">
            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Crie sua Empresa</h4>
            <p className="text-sm text-slate-500 font-medium italic">Para começar a gerenciar suas vendas e estoque, precisamos configurar sua organização principal.</p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in shake">
              <ShieldCheck size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome da Organização</label>
              <div className="relative">
                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Minha Empresa de Sucesso"
                  className="w-full pl-14 pr-5 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-brand-600 rounded-3xl focus:outline-none transition-all text-slate-800 dark:text-white font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-6 bg-brand-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-600/30 flex items-center justify-center gap-4 hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                {loading ? 'CONFIGURANDO...' : 'INICIAR AGORA'}
              </button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-2 text-slate-400">
             <CheckCircle2 size={14} className="text-emerald-500" />
             <p className="text-[9px] font-black uppercase tracking-widest">Infraestrutura Multi-Tenant Ativada</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompanyModal;
