
import React, { useState, useEffect } from 'react';
import { Users2, UserPlus, Mail, Shield, CheckCircle2, Copy, Trash2, Clock, Loader2, AlertCircle, X, ChevronRight, Share2, User, Building2, UserMinus, Link2, Pencil, Check } from 'lucide-react';
import { db } from '../services/database';
import { Invitation, InviteRole, Membership } from '../types';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  'OWNER': 'PROPRIETÁRIO',
  'ADMIN': 'ADMINISTRADOR',
  'SELLER': 'VENDEDOR',
  'VIEWER': 'VISUALIZADOR'
};

const Team: React.FC = () => {
  const { companyId } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');
  const [members, setMembers] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('SELLER');
  const [error, setError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Inline Edit State
  const [editingInviteId, setEditingInviteId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchData = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const [membersData, invitesData] = await Promise.all([
        db.team.getMembers(companyId),
        db.team.getInvitations(companyId)
      ]);
      setMembers(membersData);
      setInvitations(invitesData);
    } catch (err) {
      console.error('Erro ao buscar dados da equipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('O e-mail é obrigatório.');
    if (!companyId) return setError('Identificação da empresa não encontrada.');
    
    setIsGenerating(true);
    setError('');
    try {
      const invite = await db.team.generateInvitation(companyId, email, name || null, role);
      const link = `${window.location.origin}/auth/invite?token=${invite.token}`;
      setGeneratedLink(link);
      fetchData();
    } catch (err: any) {
      console.error('Falha ao gerar convite:', err);
      setError(err.message || 'Erro inesperado ao gerar convite.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (token: string, id: string) => {
    const link = `${window.location.origin}/auth/invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemoveMember = async (id: string, name?: string) => {
    if (confirm(`ATENÇÃO: Deseja remover o acesso de ${name || 'este membro'}? Esta ação revogará instantaneamente todas as permissões no app.`)) {
      try {
        await db.team.removeMember(id);
        fetchData();
      } catch (err) {
        console.error('Erro ao remover membro:', err);
        alert('Erro ao remover membro.');
      }
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (deletingId) return;
    if (confirm('Deseja cancelar este convite? O link de acesso será invalidado imediatamente.')) {
      setDeletingId(id);
      console.log(`Iniciando exclusão do convite ID: ${id}`);
      try {
        await db.team.deleteInvitation(id);
        console.log('Convite excluído com sucesso.');
        fetchData();
      } catch (err: any) {
        console.error('Erro ao excluir convite:', err);
        alert(`Falha ao excluir convite: ${err.message || 'Erro desconhecido'}`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const startEditInvite = (invite: Invitation) => {
    setEditingInviteId(invite.id);
    setEditingName(invite.invited_name || '');
  };

  const cancelEditInvite = () => {
    setEditingInviteId(null);
    setEditingName('');
  };

  const handleUpdateInviteName = async (id: string) => {
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await db.team.updateInvitationName(id, editingName);
      setEditingInviteId(null);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao atualizar nome do convite:', err);
      alert('Erro ao atualizar nome.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Gestão de Equipe</h2>
          <p className="text-sm text-slate-500 font-medium italic">Gerencie acessos e colabore com seu time na nuvem.</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setGeneratedLink(''); setName(''); setEmail(''); setError(''); }}
          className="bg-brand-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95 transition-all"
        >
          <UserPlus size={18} /> Convidar Colaborador
        </button>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('members')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-50'}`}
        >
          Membros Ativos ({members.length})
        </button>
        <button 
          onClick={() => setActiveTab('invites')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invites' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-50'}`}
        >
          Convites Pendentes ({invitations.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-brand-600" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando time...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {activeTab === 'members' ? (
                  members.map((member) => (
                    <div key={member.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{member.user_name || 'Membro do Time'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 border border-slate-200 dark:border-slate-700">
                              {ROLE_LABELS[member.role]}
                            </span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded flex items-center gap-1">
                               <CheckCircle2 size={10} /> Ativo
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {member.role !== 'OWNER' && (
                          <button 
                            onClick={() => handleRemoveMember(member.id, member.user_name)}
                            className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all group/btn flex items-center gap-2 border border-rose-100 dark:border-rose-500/20"
                            title="Revogar Acesso"
                          >
                             <UserMinus size={18} />
                             <span className="text-[9px] font-black uppercase tracking-widest hidden md:group-hover/btn:block">Revogar</span>
                          </button>
                        )}
                        {member.role === 'OWNER' && (
                           <div className="px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-brand-100">
                             Titular
                           </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  invitations.map((invite) => (
                    <div key={invite.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                          <Mail size={20} />
                        </div>
                        <div className="flex-1">
                          {editingInviteId === invite.id ? (
                            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200">
                               <input 
                                type="text"
                                className="bg-slate-50 dark:bg-slate-800 border-2 border-brand-500 rounded-lg px-3 py-1 text-sm font-bold w-48 focus:outline-none"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => { if(e.key === 'Enter') handleUpdateInviteName(invite.id); if(e.key === 'Escape') cancelEditInvite(); }}
                                autoFocus
                               />
                               <button onClick={() => handleUpdateInviteName(invite.id)} className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                                 {isSavingEdit ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                               </button>
                               <button onClick={cancelEditInvite} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg hover:bg-slate-300">
                                 <X size={16}/>
                               </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                               <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                 {invite.invited_name || <span className="text-slate-400 font-medium italic">Sem nome</span>}
                               </p>
                               <button 
                                onClick={() => startEditInvite(invite)} 
                                className="p-1 text-slate-400 hover:text-brand-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Editar Nome"
                               >
                                 <Pencil size={14} />
                               </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-medium text-slate-500 italic">{invite.invited_email}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                              {ROLE_LABELS[invite.role]}
                            </span>
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                               <Clock size={10} /> Pendente
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => copyToClipboard(invite.token, invite.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all border font-black text-[9px] uppercase tracking-widest ${
                            copiedId === invite.id 
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' 
                            : 'bg-white dark:bg-slate-800 text-brand-600 border-brand-100 dark:border-brand-500/20 hover:bg-brand-50 shadow-sm'
                          }`}
                          title="Copiar Link de Convite"
                        >
                           {copiedId === invite.id ? <CheckCircle2 size={16}/> : <Copy size={16} />}
                           <span>{copiedId === invite.id ? 'Copiado!' : 'Copiar Convite'}</span>
                        </button>

                        <button 
                          onClick={() => handleDeleteInvite(invite.id)}
                          disabled={deletingId === invite.id}
                          className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all rounded-xl border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
                          title="Cancelar Convite"
                        >
                           {deletingId === invite.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {(activeTab === 'members' ? members.length : invitations.length) === 0 && (
                  <div className="p-20 text-center opacity-40 flex flex-col items-center">
                    <Users2 className="mb-4" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum registro encontrado</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-brand-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-brand-600/20 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <h4 className="text-xl font-black uppercase tracking-tighter italic mb-4">Hierarquia de Acesso</h4>
                <div className="space-y-4">
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Shield size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">ADMINISTRADOR</p>
                        <p className="text-[9px] text-brand-100 font-medium leading-relaxed italic">Controle total sobre vendas, estoque e financeiro. Pode convidar novos membros.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Shield size={16}/></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">VENDEDOR</p>
                        <p className="text-[9px] text-brand-100 font-medium leading-relaxed italic">Foco operacional no PDV e Pedidos. Não visualiza o financeiro estratégico.</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-slate-400 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <AlertCircle size={18} className="text-amber-500" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">Segurança Cloud</p>
              </div>
              <p className="text-[10px] font-medium leading-relaxed italic">
                Ao revogar o acesso de um membro ou cancelar um convite, todas as chaves de autenticação do usuário são invalidadas no mesmo segundo para garantir a integridade dos seus dados.
              </p>
           </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserPlus size={24}/></div>
                 <div>
                   <h3 className="text-xl font-black uppercase tracking-tight italic">Convidar para Time</h3>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Expanda sua infraestrutura</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X size={20}/></button>
            </div>

            <div className="p-8 space-y-6">
               {error && (
                 <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-[11px] font-bold animate-in shake">
                    <AlertCircle size={18} /> {error}
                 </div>
               )}

               {!generatedLink ? (
                 <form onSubmit={handleGenerateInvite} className="space-y-6">
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do colaborador (opcional)</label>
                          <div className="relative">
                             <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                             <input 
                               type="text" 
                               placeholder="Ex: João da Silva"
                               className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 text-sm font-bold dark:text-white"
                               value={name}
                               onChange={(e) => setName(e.target.value)}
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                          <div className="relative">
                             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                             <input 
                               type="email" 
                               required
                               placeholder="colaborador@nexero.app"
                               className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 text-sm font-bold dark:text-white"
                               value={email}
                               onChange={(e) => setEmail(e.target.value)}
                             />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo de Atuação</label>
                       <div className="grid grid-cols-3 gap-2">
                          {['ADMIN', 'SELLER', 'VIEWER'].map(r => (
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
                              {ROLE_LABELS[r]}
                            </button>
                          ))}
                       </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-5 bg-brand-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
                      {isGenerating ? 'PROCESSANDO...' : 'GERAR CONVITE'}
                    </button>
                 </form>
               ) : (
                 <div className="space-y-6 text-center py-4 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/20 mb-4">
                       <CheckCircle2 size={40} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Sucesso!</h4>
                      <p className="text-xs text-slate-500 font-medium italic mt-1">O convite para <span className="text-brand-600 font-bold">{name || email}</span> foi gerado e está pronto para envio.</p>
                    </div>

                    <div className="relative group">
                       <input 
                        type="text" 
                        readOnly 
                        value={generatedLink}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-brand-500/30 rounded-2xl text-[10px] font-bold text-brand-600 dark:text-brand-400 overflow-hidden text-ellipsis pr-14"
                       />
                       <button 
                        onClick={() => { navigator.clipboard.writeText(generatedLink); alert('Link copiado!'); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-brand-700"
                       >
                         <Copy size={16}/>
                       </button>
                    </div>

                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Concluído
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
