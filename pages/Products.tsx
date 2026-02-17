
import React, { useState, useEffect } from 'react';
import { Package, MoreVertical, TrendingDown, Layers, Search, Plus, Loader2, AlertCircle, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

const Products: React.FC = () => {
  const { companyId } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProducts = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.products.getAll(companyId);
      setProducts(data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [companyId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Catálogo de Produtos</h2>
          <p className="text-slate-500 dark:text-slate-400">Controle seu estoque e preços em tempo real na nuvem.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <Layers size={20} />
            Categorias
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder="Filtrar por nome ou SKU..." 
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 h-64 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
            <div key={product.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Package size={48} />
                  </div>
                )}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">Sem Estoque</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button className="p-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
              
              <div className="p-5">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">{product.category || 'Sem Categoria'}</p>
                <h4 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{product.name}</h4>
                <p className="text-xs text-slate-500 mb-4 uppercase">SKU: {product.sku || 'N/A'}</p>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Preço Venda</p>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(product.price)}</p>
                  </div>
                  <div className={`text-right ${product.stock < product.min_stock ? 'text-amber-600' : 'text-slate-500'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-tighter">Estoque</p>
                    <p className="text-sm font-bold">{product.stock} un</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Package className="inline-block text-slate-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-slate-400">Seu catálogo está vazio</h3>
          <p className="text-slate-500 mb-6">Comece cadastrando seu primeiro produto para sincronizar com a nuvem.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
          >
             Cadastrar Produto Agora
          </button>
        </div>
      )}

      {isModalOpen && companyId && <ProductModal companyId={companyId} onClose={() => setIsModalOpen(false)} onRefresh={fetchProducts} />}
    </div>
  );
};

const ProductModal: React.FC<{ companyId: string, onClose: () => void, onRefresh: () => void }> = ({ companyId, onClose, onRefresh }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    min_stock: '5',
    category: '',
    image_url: ''
  });

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      setError('Nome, preço e estoque inicial são obrigatórios.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Fix: Passed companyId as the second argument
      await db.products.create({
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        min_stock: parseInt(formData.min_stock),
        category: formData.category,
        image_url: formData.image_url
      }, companyId);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError('Erro ao salvar no banco de dados: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20"><Package size={24}/></div>
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Novo Produto</h3>
              <p className="text-xs text-slate-500 font-medium">Disponível imediatamente para venda no PDV.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
              <input 
                type="text" 
                placeholder="Ex: Óleo Motor 5W30" 
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">SKU / Código</label>
              <input 
                type="text" 
                placeholder="Ex: OL530" 
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all uppercase"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <input 
                type="text" 
                placeholder="Ex: Lubrificantes" 
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Preço de Venda (R$)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0,00" 
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Estoque Inicial</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Mínimo de Segurança</label>
              <input 
                type="number" 
                placeholder="5" 
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={formData.min_stock}
                onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">URL da Imagem (Opcional)</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="https://..." 
                  className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t dark:border-slate-800 flex gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]">Cancelar</button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-2 w-2/3 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest text-[10px] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16}/>}
            {isSaving ? 'SALVANDO...' : 'Confirmar Cadastro'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;
