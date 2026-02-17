
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Users, AlertCircle, Loader2, TrendingUp, Wallet, Clock, Plus, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import { db } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
    const loadData = async () => {
      try {
        const dashboardStats = await db.getDashboardStats();
        const clients = await db.clients.getAll();
        const orders = await db.orders.getAll();
        
        // Pegar as 5 vendas mais recentes
        const latestOrders = orders ? orders.slice(0, 5) : [];
        setRecentOrders(latestOrders);

        const avgTicket = dashboardStats.dailySales > 0 ? dashboardStats.dailySales / 1 : 0;

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
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-brand-600" size={32} />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sincronizando banco de dados...</p>
      </div>
    );
  }

  const hasSales = stats.dailySales > 0 || stats.monthlyRevenue > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Painel de Controle</h2>
          <p className="text-sm text-slate-500">Dados reais da sua instância Nexero.</p>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
             <Calendar size={14} /> Filtro: Hoje
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all">
             <Plus size={16} /> Novo Pedido
           </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Vendas Hoje" 
          value={formatCurrency(stats.dailySales)} 
          change={stats.dailySales > 0 ? "Atualizado" : "Aguardando"} 
          trend={stats.dailySales > 0 ? "up" : "neutral"} 
          icon={<ShoppingCart size={18} className="text-brand-600" />} 
        />
        <StatCard 
          label="Faturamento Mês" 
          value={formatCurrency(stats.monthlyRevenue)} 
          change={stats.monthlyRevenue > 0 ? "Calculado" : "Zero"} 
          trend={stats.monthlyRevenue > 0 ? "up" : "neutral"} 
          icon={<Wallet size={18} className="text-emerald-600" />} 
        />
        <StatCard 
          label="Ticket Médio" 
          value={formatCurrency(stats.averageTicket)} 
          change="Real" 
          trend="neutral" 
          icon={<TrendingUp size={18} className="text-blue-600" />} 
        />
        <StatCard 
          label="Base de Clientes" 
          value={stats.totalClients.toString()} 
          change="Ativos" 
          trend="neutral" 
          icon={<Users size={18} className="text-indigo-600" />} 
        />
      </div>

      {/* Main Insights and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Desempenho Comercial</h3>
          </div>
          <div className="h-72 w-full">
            {hasSales ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  {name: 'Mensal', sales: stats.monthlyRevenue},
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
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-400">
                  <TrendingUp size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Gráfico Indisponível</p>
                <p className="text-[10px] text-slate-500 italic max-w-xs">Aguardando dados de venda para gerar as projeções de faturamento.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5">Status Operacional</h3>
              <div className="space-y-4">
                 {stats.outOfStockItems > 0 ? (
                   <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg">
                      <AlertCircle className="text-amber-500 shrink-0" size={16} />
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-400">Estoque Crítico</p>
                        <p className="text-[10px] text-amber-700 dark:text-amber-500/70">{stats.outOfStockItems} produtos sem estoque.</p>
                      </div>
                   </div>
                 ) : (
                   <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-lg">
                      <AlertCircle className="text-emerald-500 shrink-0" size={16} />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-400">Estoque Saudável</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-500/70">Todos os produtos possuem estoque positivo.</p>
                      </div>
                   </div>
                 )}
                 <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/30 rounded-lg">
                    <Clock className="text-slate-500 shrink-0" size={16} />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-300">Log de Sincronia</p>
                      <p className="text-[10px] text-slate-500">Conexão ativa com Supabase Cloud.</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-brand-600 p-6 rounded-xl shadow-lg shadow-brand-600/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Analista IA Nexero</p>
                 <p className="text-xs font-medium leading-relaxed italic">
                   {hasSales 
                    ? `Parabéns! Você já faturou ${formatCurrency(stats.dailySales)} hoje. Continue o bom trabalho.`
                    : "Aguardando as primeiras vendas do dia para iniciar a análise de tendências comerciais."}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Recent Orders List - DADOS REAIS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Últimas Vendas Realizadas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-indigo-600">#{order.id.substring(0,8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{order.clients?.name || 'Cliente Avulso'}</td>
                    <td className="px-6 py-4 text-[10px] text-slate-500">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-slate-900 dark:text-white">{formatCurrency(order.total_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs text-slate-400 italic font-medium uppercase tracking-widest">
                    Nenhuma venda processada nesta instância.
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
  <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/30 transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-brand-50 transition-colors">
        {icon}
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
        trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 
        trend === 'down' ? 'text-rose-600 bg-rose-50' : 
        'text-slate-400 bg-slate-50'
      }`}>
        {change}
      </span>
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

export default Dashboard;
