
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, MoreHorizontal, User, Loader2, ShoppingCart, Printer, ShoppingBag, AlertCircle, CheckCircle2, Trash2, Calendar, X } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { OrderStatus, OrderItem, Product, Client, Order } from '../types';
import { db } from '../services/database';
import { printService } from '../services/print';
import { useAuth } from '../contexts/AuthContext';

const Orders: React.FC = () => {
  const { companyId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchOrders = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const data = await db.orders.getAll(companyId);
      setOrders(data);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [companyId]);

  const handlePrintOrder = async (order: any) => {
    const items = order.order_items || []; 
    await printService.printReceipt(order, items);
  };

  const filteredOrders = orders.filter(o => 
    (o.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter uppercase">Vendas Realizadas</h2>
          <p className="text-xs text-slate-500 font-medium italic">Histórico de transações sincronizado em tempo real.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-brand-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-brand-700 shadow-xl shadow-brand-600/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          <Plus size={18} /> Novo Pedido
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Pesquisar por cliente ou código..." 
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 text-xs font-bold transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin inline-block text-brand-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-brand-600 font-black text-[10px] shadow-inner border border-slate-100 dark:border-slate-700">
                      {order.clients?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest">#{order.code || order.id.substring(0,8).toUpperCase()}</p>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight uppercase truncate w-40">{order.clients?.name || 'Cliente Avulso'}</h4>
                    </div>
                 </div>
                 <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusStyle(order.status as OrderStatus)}`}>
                   {order.status}
                 </span>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Venda</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(order.total_amount)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatDate(order.created_at)}</p>
                  </div>
               </div>

               <div className="flex gap-2">
                 <button onClick={() => handlePrintOrder(order)} className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                   <Printer size={16}/> <span className="text-[9px] font-black uppercase">Recibo</span>
                 </button>
                 <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center gap-2">
                   <MoreHorizontal size={16}/> <span className="text-[9px] font-black uppercase">Detalhes</span>
                 </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="py-20 text-center text-slate-400">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma venda encontrada</p>
        </div>
      )}

      {isModalOpen && companyId && <OrderModal companyId={companyId} onClose={() => setIsModalOpen(false)} onRefresh={fetchOrders} />}
    </div>
  );
};

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.COMPLETED: return 'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    case OrderStatus.DRAFT: return 'text-slate-400 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700';
    default: return 'text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20';
  }
};

const OrderModal: React.FC<{ companyId: string, onClose: () => void, onRefresh: () => void }> = ({ companyId, onClose, onRefresh }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [c, p] = await Promise.all([db.clients.getAll(companyId), db.products.getAll(companyId)]);
        setClients(c);
        setProducts(p);
      } catch (err) {
        console.error("Erro ao carregar dados do modal:", err);
      }
    };
    loadData();
  }, [companyId]);

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  const handleSave = async () => {
    if (cart.length === 0) {
      setError('Adicione pelo menos um produto ao carrinho.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const order: Partial<Order> = {
        client_id: selectedClientId,
        total_amount: total,
        status: OrderStatus.COMPLETED,
        salesperson: 'Administrador',
        payment_method: 'DINHEIRO'
      };

      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.qty,
        unit_price: item.product.price,
        discount: 0,
        total_price: item.product.price * item.qty,
        name: item.product.name 
      }));

      await db.orders.create(order, items, companyId);
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o pedido.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ShoppingCart size={20}/></div>
            <h3 className="text-xl font-black uppercase tracking-tight">Novo Pedido Manual</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
                <AlertCircle size={18} /> {error}
              </div>
            )}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Selecionar Cliente</label>
              <select 
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-500/20 outline-none"
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(e.target.value || null)}
              >
                <option value="">Consumidor Final (Avulso)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Catálogo de Produtos</label>
              <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {products.map(p => (
                  <button 
                    key={p.id}
                    disabled={p.stock <= 0}
                    onClick={() => {
                      const existing = cart.find(c => c.product.id === p.id);
                      if (existing) {
                        setCart(cart.map(c => c.product.id === p.id ? {...c, qty: c.qty + 1} : c));
                      } else {
                        setCart([...cart, { product: p, qty: 1 }]);
                      }
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${p.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed border-transparent' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-brand-500/50 hover:bg-white dark:hover:bg-slate-800'}`}
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight">{p.name}</p>
                      <p className="text-[10px] text-slate-500">Estoque: {p.stock} un</p>
                    </div>
                    <span className="text-sm font-black text-brand-600">{formatCurrency(p.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-[2rem] flex flex-col shadow-xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Carrinho de Compras</h4>
            <div className="flex-1 space-y-4 overflow-y-auto mb-8 pr-2 custom-scrollbar min-h-[200px]">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-700/30">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase truncate w-32">{item.product.name}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{item.qty}x {formatCurrency(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black">{formatCurrency(item.product.price * item.qty)}</span>
                    <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-slate-500 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center opacity-30 italic py-10">
                  <ShoppingBag size={40} className="mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Vazio</p>
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-slate-800">
              <div className="flex justify-between items-end mb-8">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Líquido</span>
                <span className="text-3xl font-black tracking-tighter">{formatCurrency(total)}</span>
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving || cart.length === 0}
                className="w-full py-5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-600/30 transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {isSaving ? 'PROCESSANDO...' : 'FINALIZAR VENDA'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
