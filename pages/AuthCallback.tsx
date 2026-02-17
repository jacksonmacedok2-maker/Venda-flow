
import React, { useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AuthCallbackProps {
  setActiveTab: (tab: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ setActiveTab }) => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      // 1. Limpa qualquer lixo de sessão que possa ter vindo no carregamento da página
      localStorage.clear();

      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Priorizamos o 'code' (Fluxo PKCE)
      const code = queryParams.get('code');
      // Token via fragmento (Fluxo Implícito - Padrão do Supabase se não configurado)
      const accessToken = hashParams.get('access_token');

      try {
        if (code) {
          // Valida o e-mail trocando o código pela sessão
          await supabase.auth.exchangeCodeForSession(code);
        } else if (accessToken) {
          // Se veio via fragmento, o Supabase já tentou logar, nós apenas confirmamos
          console.log("Validado via token de fragmento");
        } else {
          throw new Error("Nenhum código ou token encontrado");
        }
        
        // LOGOUT IMEDIATO: Desloga o usuário deste dispositivo (celular)
        // Isso garante que ele não entre no Dashboard aqui.
        await supabase.auth.signOut({ scope: 'global' });
        localStorage.clear(); // Limpeza dupla por segurança
        
        // Vai para a tela de Sucesso
        setActiveTab('/auth/confirmed');
      } catch (err) {
        console.error('Erro no callback:', err);
        setActiveTab('/auth/error');
      }
    };

    handleAuthCallback();
  }, [setActiveTab]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 text-center animate-in fade-in duration-700">
      <div className="relative">
        <div className="w-24 h-24 bg-brand-600/10 rounded-[2.5rem] flex items-center justify-center text-brand-600">
          <ShieldCheck size={48} className="animate-pulse" />
        </div>
        <div className="absolute inset-0 border-4 border-brand-600 border-t-transparent rounded-[2.5rem] animate-spin"></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
           <Loader2 size={16} className="animate-spin text-brand-600" />
           <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Verificando Credenciais</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold italic max-w-xs mx-auto leading-relaxed">
          Sincronizando chave de segurança com a nuvem Nexero...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
