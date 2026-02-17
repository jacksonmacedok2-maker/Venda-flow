
import React, { useState, useEffect } from 'react';
import { Users2, UserPlus, Mail, Shield, CheckCircle2, Copy, Trash2, Clock, Loader2, AlertCircle, X, ChevronRight, Share2 } from 'lucide-react';
import { db } from '../services/database';
import { Invitation, InviteRole } from '../types';
import { formatDate } from '../utils/helpers';

const Team: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('SELLER');
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await db.team.getInvitations();
      setInvitations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('O e-mail é obrigatório.');
    
    setIsGenerating(true);
    setError('');
    try {
      const invite = await db.team.generateInvitation(email, role);
      const link = `${window.location.origin}/auth/invite?token=${invite.token}`;
      setGeneratedLink(link);
      fetchInvitations();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar convite.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteInvite = async (id: string) => {
    if (confirm('Deseja cancelar este convite?')) {
      try {
        await db.team.deleteInvitation(id);
        fetchInvitations();
      } catch (err) {
        alert('Erro ao excluir convite.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Gestão de Equipe</h2>
          <p className="text-sm text-slate-500 font-medium italic">Expanda sua operação convidando novos membros.</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setGeneratedLink(''); setEmail(''); }}
          className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95 transition-all"
        >
          <UserPlus size={18} /> Convidar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Convites Ativos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Convites Gerados</h3>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                {invitations.length} Total
              </span>
            </div>

            {loading ? (
              <div className="p-20 text-center">
                <Loader2 className="animate-spin inline-block text-brand-600" size={32} />
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {invitations.map((invite) => (
                  <div key={invite.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${invite.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{invite.invited_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-700">
                            {invite.role}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${
                            invite.status === 'ACCEPTED' ? 'text-emerald-500 bg-emerald-50' : 'text-amber-500 bg-amber-50'
                          }`}>
                            {invite.status === 'PENDING' ? <Clock size={10}/> : <CheckCircle2 size={10}/>}
                            {invite.status === 'PENDING' ? 'Pendente' : 'Aceito'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right">
                       <div className="hidden md:block">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Criado em</p>
                         <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{formatDate(invite.created_at)}</p>
                       </div>
                       <button 
                        onClick={() => handleDeleteInvite(invite.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                ))}

                {invitations.length === 0 && (
                  <div className="p-20 text-center opacity-40">
                    <Users2 className="mx-auto mb-4" size={48} />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhum convite ativo</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Resumo de Permissões */}
        <div className="space-y-6">
           <div className="bg-brand-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-brand-600/20 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <h4 className="text-xl font-black uppercase tracking-tighter italic mb-4">Hierarquia Nexero</h4>
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Shield size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase">ADMIN</p>
                        <p className="text-[9px] text-brand-100 font-medium leading-relaxed italic">Controle total sobre vendas, estoque, financeiro e configurações da empresa.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Shield size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase">SELLER (Vendedor)</p>
                        <p className="text-[9px] text-brand-100 font-medium leading-relaxed italic">Acesso ao PDV e visualização de pedidos. Sem permissões de gestão.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Shield size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase">VIEWER (Auditores)</p>
                        <p className="text-[9px] text-brand-100 font-medium leading-relaxed italic">Apenas leitura de relatórios e BI. Não pode editar dados ou vender.</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Modal de Convite */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserPlus size={24}/></div>
                 <div>
                   <h3 className="text-xl font-black uppercase tracking-tight italic">Novo Convite</h3>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Expansão de equipe Nexero</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><X size={20}/></button>
            </div>

            <div className="p-8 space-y-6">
               {error && (
                 <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-bold">
                    <AlertCircle size={18} /> {error}
                 </div>
               )}

               {!generatedLink ? (
                 <form onSubmit={handleGenerateInvite} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail do Funcionário</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                          <input 
                            type="email" 
                            required
                            placeholder="exemplo@empresa.com"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 text-sm font-bold"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Permissão</label>
                       <div className="grid grid-cols-3 gap-2">
                          {(['ADMIN', 'SELLER', 'VIEWER'] as InviteRole[]).map(r => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRole(r)}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                role === r 
                                ? 'bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-600/20' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                       </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" /> : <Share2 size={18} />}
                      {isGenerating ? 'PROCESSANDO...' : 'GERAR CONVITE'}
                    </button>
                 </form>
               ) : (
                 <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20 mb-4">
                       <CheckCircle2 size={40} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Link Gerado!</h4>
                      <p className="text-xs text-slate-500 font-medium italic mt-1">Copie o link abaixo e envie para o funcionário.</p>
                    </div>

                    <div className="relative group">
                       <input 
                        type="text" 
                        readOnly 
                        value={generatedLink}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-brand-500/30 rounded-2xl text-[10px] font-bold text-brand-600 dark:text-brand-400 overflow-hidden text-ellipsis pr-14"
                       />
                       <button 
                        onClick={copyToClipboard}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                       >
                         {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                       </button>
                    </div>

                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                    >
                      Fechar e Voltar
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
