
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, User, Building, Search, ArrowLeft, Landmark, Loader2, Zap, Cpu, Shield, Check, KeyRound, ArrowRight, Inbox, RefreshCw, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchCnpjData } from '../utils/helpers';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD' | 'WAITING_CONFIRMATION';

const Login: React.FC = () => {
  const { login, signUp, resendConfirmation, resetPassword, isAuthenticated } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [documentType, setDocumentType] = useState<'CPF' | 'CNPJ'>('CNPJ');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    companyName: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forcedMode = params.get('mode');
    const invitedEmail = params.get('email');
    const invitedName = params.get('name');
    
    if (forcedMode === 'SIGNUP') {
      setMode('SIGNUP');
      if (invitedEmail) {
        setSignupData(prev => ({ 
          ...prev, 
          email: invitedEmail, 
          name: invitedName || '',
          companyName: 'Equipe Nexero' // Nome temporário para convidados
        }));
      }
    }

    if (isAuthenticated) {
      setIsRedirecting(true);
      const redirectPath = params.get('redirect');
      if (redirectPath) {
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1500);
      }
    }
  }, [isAuthenticated]);

  const resetUIStates = () => {
    setIsLoading(false);
    setError('');
    setSuccessMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const metadata = {
        name: signupData.name,
        companyName: signupData.companyName,
        phone: signupData.phone,
        document: signupData.document,
        documentType: documentType
      };

      const needsConfirmation = await signUp(signupData.email, signupData.password, metadata);
      
      setIsLoading(false);
      
      if (needsConfirmation) {
        setMode('WAITING_CONFIRMATION');
      } else {
        setSuccessMessage('Instância configurada com sucesso! Redirecionando...');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setError('');
    try {
      await resendConfirmation(signupData.email);
      setSuccessMessage('Novo link enviado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar e-mail.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await resetPassword(email);
      setSuccessMessage('Link de recuperação enviado.');
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação.');
      setIsLoading(false);
    }
  };

  const lookupCnpj = async () => {
    const cleanCnpj = signupData.document.replace(/\D/g, '');
    setIsSearchingCnpj(true);
    setError('');

    try {
      const data = await fetchCnpjData(cleanCnpj);
      setSignupData(prev => ({
        ...prev,
        companyName: data.razao_social || data.nome_fantasia || '',
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone,
        email: data.email || prev.email
      }));
    } catch (err: any) {
      setError('CNPJ não encontrado.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const isCnpjReady = documentType === 'CNPJ' && signupData.document.replace(/\D/g, '').length === 14;
  const showConfirmError = signupData.confirmPassword.length > 0 && signupData.password !== signupData.confirmPassword;

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden">
        <div className="flex flex-col items-center gap-8 animate-in zoom-in-95 duration-700">
          <div className="relative">
            <div className="w-32 h-32 bg-brand-600 rounded-[3rem] flex items-center justify-center text-white shadow-2xl shadow-brand-600/40 animate-bounce">
              <Zap size={64} className="fill-current" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center text-white shadow-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Aguarde...</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs italic mx-auto">Sincronizando sua infraestrutura Nexero.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-slate-900 to-slate-900 z-0" />
        <div className="relative z-10 flex flex-col justify-between p-20 w-full text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-600/30">
              <Zap size={28} className="text-white fill-current" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">NEXERO</h1>
          </div>
          <div className="space-y-10">
            <h2 className="text-7xl font-black leading-[0.9] tracking-tighter">
              Gestão <br/><span className="text-brand-500">Inteligente.</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-md leading-relaxed italic border-l-4 border-brand-600 pl-6">
              A evolução do seu negócio começa com dados precisos.
            </p>
          </div>
        </div>
      </div>

      {/* Auth Content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto bg-white dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8 py-8">
          
          <div className="text-center md:text-left">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter leading-tight uppercase italic">
                  {mode === 'LOGIN' ? 'Login' : mode === 'SIGNUP' ? 'Cadastro' : mode === 'WAITING_CONFIRMATION' ? 'Quase lá' : 'Senha'}
                </h3>
              </div>
              {(mode !== 'LOGIN' && mode !== 'WAITING_CONFIRMATION') && (
                <button 
                  onClick={() => { setMode('LOGIN'); resetUIStates(); }} 
                  className="text-brand-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-all py-2"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 p-5 rounded-3xl flex items-center gap-4 text-emerald-600 mb-6">
              <Check size={20} className="shrink-0" />
              <p className="text-xs font-bold leading-relaxed">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-100 dark:border-rose-500/20 p-5 rounded-3xl flex items-center gap-4 text-rose-600 mb-6 animate-in shake">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div className="max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
            {mode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="email" required placeholder="seu@email.com" className="w-full pl-14 pr-5 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-3xl focus:outline-none transition-all text-slate-800 dark:text-white font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                    <button type="button" onClick={() => setMode('FORGOT_PASSWORD')} className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Esqueceu?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full pl-14 pr-14 py-5 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-3xl focus:outline-none transition-all text-slate-800 dark:text-white font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600">
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-6 bg-brand-600 text-white rounded-3xl font-black text-xs flex items-center justify-center gap-4 shadow-xl shadow-brand-600/20 active:scale-95 transition-all uppercase tracking-widest">
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Acessar Nexero</>}
                </button>
                <button type="button" onClick={() => setMode('SIGNUP')} className="w-full py-5 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white rounded-3xl font-black text-[10px] uppercase tracking-widest">Criar Nova Conta</button>
              </form>
            )}

            {mode === 'SIGNUP' && (
              <form onSubmit={handleSignupSubmit} className="space-y-6">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                  <button type="button" onClick={() => setDocumentType('CNPJ')} className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${documentType === 'CNPJ' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>CNPJ</button>
                  <button type="button" onClick={() => setDocumentType('CPF')} className={`flex-1 py-3 text-[9px] font-black rounded-xl transition-all uppercase tracking-widest ${documentType === 'CPF' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>CPF</button>
                </div>

                <div className="space-y-4">
                  <InputField label={documentType} value={signupData.document} onChange={(e: any) => setSignupData({...signupData, document: e.target.value})} placeholder={documentType === 'CNPJ' ? "00.000.000/0001-00" : "000.000.000-00"} />
                  {documentType === 'CNPJ' && isCnpjReady && (
                    <button type="button" onClick={lookupCnpj} disabled={isSearchingCnpj} className="w-full py-3 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                      {isSearchingCnpj ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} Buscar Dados da Empresa
                    </button>
                  )}
                  <InputField label="Nome / Empresa" value={signupData.companyName} onChange={(e: any) => setSignupData({...signupData, companyName: e.target.value, name: e.target.value})} placeholder="Ex: Nexero LTDA" />
                  <InputField label="E-mail" type="email" value={signupData.email} onChange={(e: any) => setSignupData({...signupData, email: e.target.value})} placeholder="seu@email.com" />
                  <InputField label="Senha" type="password" value={signupData.password} onChange={(e: any) => setSignupData({...signupData, password: e.target.value})} placeholder="Mín. 6 caracteres" />
                  <InputField label="Confirmar Senha" type="password" value={signupData.confirmPassword} onChange={(e: any) => setSignupData({...signupData, confirmPassword: e.target.value})} placeholder="Repita a senha" />
                </div>

                <button type="submit" disabled={isLoading || showConfirmError} className="w-full py-6 bg-brand-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-600/20 active:scale-95 transition-all">
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
                </button>
              </form>
            )}

            {mode === 'WAITING_CONFIRMATION' && (
              <div className="space-y-8 text-center py-4">
                <div className="w-24 h-24 bg-brand-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                  <Inbox size={48} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Confirme seu E-mail</h4>
                  <p className="text-sm text-slate-500 mt-2 font-medium italic">Enviamos um link para: <span className="text-brand-600 font-black">{signupData.email}</span></p>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                    <Info size={14} /> Importante
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed italic">
                    Não recebeu? Verifique sua pasta de **Spam**. O link de ativação expira em breve.
                  </p>
                </div>

                <div className="space-y-4">
                  <button onClick={() => { setEmail(signupData.email); setMode('LOGIN'); }} className="w-full py-5 bg-brand-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg">Já confirmei meu e-mail</button>
                  <button onClick={handleResendEmail} disabled={isResending} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-600 flex items-center justify-center gap-2 mx-auto">
                    {isResending ? <RefreshCw className="animate-spin" size={12} /> : <RefreshCw size={12} />} Reenviar link de ativação
                  </button>
                </div>
              </div>
            )}

            {mode === 'FORGOT_PASSWORD' && (
              <form onSubmit={handleForgotSubmit} className="space-y-6">
                <InputField label="Seu E-mail" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="seu@email.com" />
                <button type="submit" disabled={isLoading} className="w-full py-6 bg-brand-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Enviar Link de Recuperação</button>
              </form>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Nexero Cloud Platform &copy; 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, placeholder, value, onChange, type = "text" }: any) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
    <input 
      type={type} 
      required
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-brand-600 rounded-[1.25rem] focus:outline-none transition-all text-sm font-bold text-slate-800 dark:text-white"
    />
  </div>
);

export default Login;
