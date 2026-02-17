
import React from 'react';
import { CheckCircle2, Monitor, ArrowRight, Smartphone, ShieldCheck } from 'lucide-react';

interface AuthConfirmedProps {
  setActiveTab: (tab: string) => void;
}

const AuthConfirmed: React.FC<AuthConfirmedProps> = ({ setActiveTab }) => {
  const handleGoToLogin = () => {
    setActiveTab('/login');
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-1000">
      {/* Icone de Sucesso */}
      <div className="relative mb-6 md:mb-10">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-20 h-20 md:w-28 md:h-28 bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-500 rounded-[1.4rem] md:rounded-[1.8rem] flex items-center justify-center text-white">
            <CheckCircle2 size={32} md:size={48} strokeWidth={2.5} />
          </div>
        </div>
      </div>
      
      {/* Textos Principais */}
      <div className="space-y-4 mb-8 md:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full">
           <ShieldCheck size={12} className="text-emerald-500" />
           <span className="text-[8px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">E-mail verificado</span>
        </div>
        
        <h2 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
          Conta <br className="md:hidden"/> <span className="text-brand-600">Ativada.</span>
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto leading-relaxed italic text-sm md:text-base">
          Sua infraestrutura Nexero está pronta. O acesso agora é exclusivo para administradores.
        </p>
      </div>

      {/* Action Box */}
      <div className="w-full max-w-sm bg-slate-900 dark:bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-left space-y-6 relative overflow-hidden group">
        <div className="relative z-10 space-y-4 md:space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-600/20">
              <Monitor size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Passo Final</p>
              <p className="text-xs font-bold text-white dark:text-slate-900 leading-tight italic">
                Recomendamos o uso em Desktop para gestão de relatórios pesados.
              </p>
            </div>
          </div>

          <button 
            onClick={handleGoToLogin}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 md:py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            Acessar Login <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Footer Mobile Optimized */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-center gap-2 text-slate-400">
           <Smartphone size={14} className="opacity-50" />
           <p className="text-[8px] font-black uppercase tracking-widest">Controle móvel habilitado via PDV Nexero.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthConfirmed;
