
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';

const Invite: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setError('Token de acesso não identificado.');
        setLoading(false);
        return;
      }

      try {
        // Chamada RPC para validar o token anonimamente
        const { data, error: rpcError } = await supabase.rpc('get_invitation_by_token', { 
          p_token: token 
        });

        if (rpcError || !data || data.length === 0) {
          setError('Este convite é inválido, já foi utilizado ou está expirado.');
          setLoading(false);
          return;
        }

        const invite = data[0];

        // Se o token for válido, redirecionamos para a tela de Login/Signup
        // passando os dados via query params para o formulário se auto-preencher
        const redirectUrl = `/login?mode=SIGNUP&email=${encodeURIComponent(invite.invited_email)}&name=${encodeURIComponent(invite.invited_name)}&token=${token}`;
        
        // Simulamos um pequeno delay para a experiência visual "Cloud Sync"
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);

      } catch (err) {
        console.error('Erro na validação:', err);
        setError('Falha na comunicação com o servidor de segurança.');
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden">
         {/* Marca d'água de fundo */}
         <div className="absolute -top-10 -left-10 opacity-5 dark:opacity-[0.02] pointer-events-none">
            <Building2 size={200} />
         </div>
         
         <div className="relative z-10">
           <div className="flex items-center gap-3 mb-10 justify-center md:justify-start">
             <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={24} />
             </div>
             <h1 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Nexero <span className="text-brand-600">Enterprise</span></h1>
           </div>

           {loading ? (
             <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
               <div className="relative">
                 <div className="w-20 h-20 bg-brand-600/10 rounded-[2rem] flex items-center justify-center text-brand-600">
                   <Loader2 className="animate-spin" size={32} />
                 </div>
                 <div className="absolute -top-1 -right-1">
                   <Sparkles className="text-brand-500 animate-pulse" size={20} />
                 </div>
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Validando Acesso</h3>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest animate-pulse">Autenticando via Cloud Gateway...</p>
               </div>
             </div>
           ) : error ? (
             <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
               <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto">
                 <AlertCircle size={40} />
               </div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Acesso Negado</h2>
                 <p className="text-sm text-slate-500 font-medium italic mt-2">{error}</p>
               </div>

               <button 
                 onClick={() => window.location.href = '/login'}
                 className="w-full py-5 border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
               >
                 Ir para o Login
               </button>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-6 text-center animate-in zoom-in-95">
               <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-xl">
                 <ShieldCheck size={40} />
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Convite Confirmado</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Redirecionando para configuração de conta...</p>
               </div>
               <Loader2 className="animate-spin text-brand-600" size={24} />
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default Invite;
