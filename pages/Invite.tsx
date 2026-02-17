
import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2, UserPlus, LogIn, Sparkles, Building2, UserCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InviteProps {
  setActiveTab: (tab: string) => void;
}

type InviteState = 'IDLE' | 'LOADING' | 'NOT_LOGGED' | 'READY' | 'SUCCESS' | 'ERROR';

const Invite: React.FC<InviteProps> = ({ setActiveTab }) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<InviteState>('LOADING');
  const [token, setToken] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);

    if (!t) {
      setState('ERROR');
      setErrorType('token_missing');
      return;
    }

    checkInvite(t);
  }, []);

  useEffect(() => {
    // Se o estado for carregado e mudar o status de autenticação, revalida a UI
    if (state !== 'LOADING' && state !== 'SUCCESS' && state !== 'ERROR') {
      if (!isAuthenticated) setState('NOT_LOGGED');
      else setState('READY');
    }
  }, [isAuthenticated]);

  const checkInvite = async (tokenStr: string) => {
    try {
      setState('LOADING');
      const { data, error } = await supabase
        .from('invitations')
        .select('*, company_id')
        .eq('token', tokenStr)
        .eq('status', 'PENDING')
        .single();

      if (error || !data) {
        setState('ERROR');
        setErrorType('invalid_or_expired_invite');
        return;
      }

      setInviteData(data);
      
      if (!isAuthenticated) {
        setState('NOT_LOGGED');
      } else {
        setState('READY');
      }
    } catch (err) {
      setState('ERROR');
      setErrorType('unknown');
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });

      if (error) {
        // Mapeamento de erros do Postgres para UI
        if (error.message.includes('email_mismatch')) {
          setState('ERROR');
          setErrorType('email_mismatch');
        } else if (error.message.includes('invalid_or_expired_invite')) {
          setState('ERROR');
          setErrorType('invalid_or_expired_invite');
        } else {
          throw error;
        }
        return;
      }

      setState('SUCCESS');
    } catch (err) {
      console.error(err);
      setState('ERROR');
      setErrorType('process_failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'LOADING':
        return (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-20 h-20 bg-brand-600/10 rounded-[2rem] flex items-center justify-center text-brand-600">
              <Loader2 className="animate-spin" size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">Validando Convite</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sincronizando com a Nuvem Nexero...</p>
            </div>
          </div>
        );

      case 'NOT_LOGGED':
        return (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-brand-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-brand-600/20">
                <ShieldCheck size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-tight">Você recebeu um convite!</h2>
                <p className="text-sm text-slate-500 font-medium italic mt-2">Para entrar na equipe de <span className="text-brand-600 font-black">{inviteData?.invited_email}</span>, você precisa estar logado na plataforma.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`}
                className="w-full py-5 bg-brand-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-brand-700 transition-all active:scale-95"
              >
                <LogIn size={18} /> Já tenho uma conta
              </button>
              <button 
                onClick={() => window.location.href = `/login?mode=SIGNUP&redirect=${encodeURIComponent(window.location.href)}`}
                className="w-full py-5 border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Criar Nova Conta
              </button>
            </div>
          </div>
        );

      case 'READY':
        return (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="p-8 bg-brand-50 dark:bg-brand-500/10 rounded-[2.5rem] border border-brand-100 dark:border-brand-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={48} /></div>
               <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-lg flex items-center justify-center text-brand-600">
                    <UserPlus size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 mb-1">Convite Disponível</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Entrar na Equipe</h3>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Você foi convidado como <span className="bg-brand-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">{inviteData?.role}</span></p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Vinculado ao e-mail: {user?.email}</p>
                  </div>
               </div>
            </div>

            <button 
              onClick={handleAccept}
              disabled={isProcessing}
              className="w-full py-6 bg-brand-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-brand-600/30 flex items-center justify-center gap-4 hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isProcessing ? 'PROCESSANDO...' : 'ACEITAR CONVITE'}
            </button>
          </div>
        );

      case 'SUCCESS':
        return (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
            <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-tight">Bem-vindo à Equipe!</h2>
              <p className="text-sm text-slate-500 font-medium italic mt-2">Convite aceito com sucesso. Agora você faz parte da operação.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                Abrir Painel Nexero <ArrowRight size={18} />
              </button>
            </div>
          </div>
        );

      case 'ERROR':
        return (
          <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto">
              <AlertCircle size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Ops! Algo deu errado.</h2>
              <p className="text-sm text-slate-500 font-medium italic mt-2">
                {errorType === 'email_mismatch' 
                  ? 'Este convite foi enviado para outro endereço de e-mail. Por favor, faça login com o e-mail correto.' 
                  : errorType === 'invalid_or_expired_invite' 
                  ? 'Este convite já foi aceito, expirou ou é inválido.'
                  : 'Não foi possível processar seu convite no momento. Tente novamente mais tarde.'}
              </p>
            </div>

            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full py-5 border-2 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Voltar ao Login
            </button>
          </div>
        );
    }
  };

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

           {renderContent()}
         </div>
      </div>
    </div>
  );
};

export default Invite;
