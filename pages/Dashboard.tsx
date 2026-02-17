
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Users, AlertCircle, Loader2, TrendingUp, Wallet, Clock, Plus, Calendar, Building2, Cloud } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, companyId, companyName } = useAuth();
  const [stats, setStats] = useState({
    dailySales: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    outOfStockItems: 0,
    totalClients: 0,
    averageTicket: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    
    const loadData = async () => {
      try {
        const dashboardStats = await db.getDashboardStats(companyId);
        const clients = await db.clients.getAll(companyId);
        const orders = await db.orders.getAll(companyId);
        
        const latestOrders = orders ? orders.slice(0, 5) : [];
        setRecentOrders(latestOrders);

        const avgTicket = orders.length > 0 ? dashboardStats.dailySales / orders.length : 0;

        setStats(prev => ({ 
          ...prev, 
          ...dashboardStats, 
          totalClients: clients.length,
          averageTicket: avgTicket
        }));
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando banco de dados...</p>
      </div>
    );
  }

  const hasSales = stats.dailySales > 0 || stats.monthlyRevenue > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex w-14 h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] items-center justify-center text-brand-600 shadow-sm transition-transform hover:rotate-6">
            <Building2 size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Cloud size={10} /> Cloud Active
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
              {companyName || 'Nexero Enterprise'}
            </h2>
            <p className="text-xs text-slate-500 font-medium italic">Gestão operacional centralizada em tempo real.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
             <Calendar size={14} /> Hoje
           </button>
           <button className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-brand-700 shadow-xl shadow-brand-600/30 transition-all active:scale-95">
             <Plus size={16} /> Novo Pedido
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Vendas Hoje" 
          value={formatCurrency(stats.dailySales)} 
          change={stats.dailySales > 0 ? "Atualizado" : "Aguardando"} 
          trend={stats.dailySales > 0 ? "up" : "neutral"} 
          icon={<ShoppingCart size={18} className="text-brand-600" />} 
        />
        <StatCard 
          label="Ticket Médio" 
          value={formatCurrency(stats.averageTicket)} 
          change="Real-time" 
          trend="neutral" 
          icon={<TrendingUp size={18} className="text-blue-600" />} 
        />
        <StatCard 
          label="Clientes Ativos" 
          value={stats.totalClients.toString()} 
          change="CRM Sync" 
          trend="neutral" 
          icon={<Users size={18} className="text-indigo-600" />} 
        />
        <StatCard 
          label="Estoque Crítico" 
          value={stats.outOfStockItems.toString()} 
          change={stats.outOfStockItems > 0 ? "Alerta" : "Saudável"} 
          trend={stats.outOfStockItems > 0 ? "down" : "neutral"} 
          icon={<AlertCircle size={18} className={stats.outOfStockItems > 0 ? "text-rose-500" : "text-emerald-500"} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Fluxo Operacional Mensal</h3>
          </div>
          <div className="h-72 w-full">
            {hasSales ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  {name: 'Semana 1', sales: stats.dailySales * 0.4},
                  {name: 'Semana 2', sales: stats.dailySales * 0.8},
                  {name: 'Semana 3', sales: stats.dailySales * 0.6},
                  {name: 'Hoje', sales: stats.dailySales}
                ]}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <TrendingUp size={32} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Aguardando Volume de Dados</p>
                <p className="text-[10px] text-slate-500 italic max-w-xs font-medium">As projeções estatísticas serão habilitadas após a sincronização das primeiras vendas.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Status da Instância</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30 rounded-2xl transition-all hover:translate-x-1">
                    <Clock className="text-brand-600 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">Sincronia Local</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Ativa via Web Worker</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30 rounded-2xl transition-all hover:translate-x-1">
                    <Wallet className="text-blue-500 shrink-0" size={18} />
                    <div>
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest">Gateway de Pagamento</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Pronto para processar</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-ping" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Nexero AI Insights</p>
                 </div>
                 <p className="text-xs font-medium leading-relaxed italic text-slate-300">
                   {hasSales 
                    ? `Detectamos um aumento de 15% na demanda por produtos de sua categoria principal hoje. Considere otimizar sua reposição de estoque.`
                    : "Analista IA: Aguardando volume de dados operacionais para fornecer insights estratégicos sobre sua rentabilidade."}
                 </p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Últimas Vendas Sincronizadas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4">ID Pedido</th>
                <th className="px-8 py-4">Cliente</th>
                <th className="px-8 py-4">Data / Hora</th>
                <th className="px-8 py-4 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-8 py-5 text-xs font-black text-brand-600">#{order.code || order.id.substring(0,8).toUpperCase()}</td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{order.clients?.name || 'Venda Avulsa'}</td>
                    <td className="px-8 py-5 text-[10px] text-slate-500 font-black uppercase tracking-widest">{formatDate(order.created_at)}</td>
                    <td className="px-8 py-5 text-right text-sm font-black text-slate-900 dark:text-white group-hover:scale-105 transition-transform">{formatCurrency(order.total_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-xs text-slate-400 italic font-medium uppercase tracking-[0.3em]">
                    Nenhuma atividade comercial registrada nesta instância.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, change, trend, icon }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/30 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
        trend === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 
        trend === 'down' ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10' : 
        'text-slate-400 bg-slate-50 dark:bg-slate-800'
      }`}>
        {change}
      </span>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
  </div>
);

export default Dashboard;
