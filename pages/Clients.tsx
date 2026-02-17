
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, UserRound, Mail, Phone, MapPin, Landmark, ArrowRight, X, Building, CheckCircle2, AlertCircle, Loader2, Sparkles, User } from 'lucide-react';
import { formatCurrency, generateId, fetchCnpjData, isValidCpf } from '../utils/helpers';
import { Client as ClientType } from '../types';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

const Clients: React.FC = () => {
  const { companyId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.clients.getAll(companyId);
      setClients(data);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [companyId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestão de Clientes</h2>
          <p className="text-slate-500 dark:text-slate-400">Sua base de dados comercial centralizada.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Nome, CPF/CNPJ ou e-mail..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 transition-colors">
            <Filter size={16} /> Filtros Avançados
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center">
              <Loader2 className="animate-spin inline-block text-brand-600 mb-2" size={32} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando clientes...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b dark:border-slate-800">
                  <th className="px-6 py-4">Nome / Documento</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">Endereço</th>
                  <th className="px-6 py-4 text-right">Crédito</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${client.type === 'PJ' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'}`}>
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{client.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{client.cnpj_cpf || 'S/ Doc'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"><Mail size={12}/> {client.email || '-'}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"><Phone size={12}/> {client.phone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 max-w-[180px] truncate">
                        <MapPin size={12} className="shrink-0 text-slate-400"/> {client.address || 'Não cadastrado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(client.credit_limit || 0)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors"><MoreHorizontal size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && clients.length === 0 && (
            <div className="p-20 text-center">
              <UserRound className="inline-block text-slate-200 mb-4" size={48} />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum cliente na base</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && companyId && <ClientModal companyId={companyId} onClose={() => setIsModalOpen(false)} onRefresh={fetchClients} />}
    </div>
  );
};

const ClientModal: React.FC<{ companyId: string, onClose: () => void, onRefresh: () => void }> = ({ companyId, onClose, onRefresh }) => {
  const [docType, setDocType] = useState<'PF' | 'PJ'>('PJ');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cnpj_cpf: '',
    email: '',
    phone: '',
    address: '',
    credit_limit: '0'
  });

  const handleLookup = async () => {
    if (docType !== 'PJ') return;
    const clean = formData.cnpj_cpf.replace(/\D/g, '');
    if (clean.length !== 14) {
      setError('CNPJ inválido.');
      return;
    }

    setIsSearching(true);
    setError('');
    try {
      const data = await fetchCnpjData(clean);
      setFormData(prev => ({
        ...prev,
        name: data.razao_social || data.nome_fantasia,
        address: data.logradouro ? `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio}/${data.uf}` : prev.address,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone
      }));
    } catch (err: any) {
      setError('CNPJ não localizado.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      setError('Nome é obrigatório.');
      return;
    }
    if (docType === 'PF' && !isValidCpf(formData.cnpj_cpf)) {
      setError('CPF inválido.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Fix: Passed companyId as the second argument
      await db.clients.create({
        name: formData.name,
        cnpj_cpf: formData.cnpj_cpf,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        type: docType,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        total_spent: 0
      }, companyId);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha na conexão com o banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Novo Cadastro de Cliente</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18}/></button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-lg flex items-center gap-3 text-rose-600 text-xs font-bold animate-in shake duration-300">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button onClick={() => setDocType('PJ')} className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 uppercase tracking-widest ${docType === 'PJ' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>Pessoa Jurídica</button>
            <button onClick={() => setDocType('PF')} className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all flex items-center gap-2 uppercase tracking-widest ${docType === 'PF' ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>Pessoa Física</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{docType === 'PJ' ? 'Razão Social' : 'Nome Completo'}</label>
              <input type="text" placeholder="Ex: Nome do Cliente" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-medium transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{docType}</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={docType === 'PJ' ? "00.000.000/0001-00" : "000.000.000-00"}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/10 text-sm font-medium transition-all"
                  value={formData.cnpj_cpf}
                  onChange={(e) => setFormData({...formData, cnpj_cpf: e.target.value})}
                />
                {docType === 'PJ' && formData.cnpj_cpf.replace(/\D/g, '').length === 14 && (
                  <button onClick={handleLookup} disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold bg-brand-600 text-white px-2 py-1 rounded hover:bg-brand-700">
                    {isSearching ? '...' : 'BUSCAR'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Telefone</label>
              <input type="text" placeholder="(00) 00000-0000" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input type="email" placeholder="cliente@empresa.com" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
              <input type="text" placeholder="Rua, Bairro, Cidade - UF" className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-800/20">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest">Descartar</button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-2 w-2/3 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16}/>}
            {isSaving ? 'Processando...' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Clients;
