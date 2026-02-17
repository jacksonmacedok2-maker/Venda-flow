
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, ShoppingBag, Users, DollarSign, 
  Loader2, Filter, Download, ChevronRight, Package, UserCheck, AlertTriangle 
} from 'lucide-react';
import { biService, BIServiceData } from '../services/bi';
import { formatCurrency } from '../utils/helpers';

const COLORS = ['#0d9488', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899'];

type Period = 'today' | '7days' | '30days' | 'month' | 'custom';

const Reports: React.FC = () => {
  const [period, setPeriod] = useState<Period>('30days');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BIServiceData | null>(null);

  const getDates = (p: Period) => {
    const end = new Date();
    const start = new Date();
    
    switch (p) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(end.getDate() - 7);
        break;
      case '30days':
        start.setDate(end.getDate() - 30);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDates(period);
      const res = await biService.getDashboardData(start, end);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  if (loading && !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-brand-600" size={48} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Compilando Inteligência de Negócio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Bar with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Relatórios & BI</h2>
          <p className="text-sm text-slate-500 font-medium italic">Análise profunda do desempenho comercial Nexero.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {(['today', '7days', '30days', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p 
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === '7days' ? '7 Dias' : p === '30days' ? '30 Dias' : 'Este Mês'}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
          <button className="p-2 text-slate-400 hover:text-brand-600 transition-colors">
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          label="Faturamento Total" 
          value={formatCurrency(data?.summary.totalRevenue || 0)} 
          growth={data?.summary.growth || 0}
          icon={<DollarSign size={20} />} 
          color="brand"
        />
        <KPICard 
          label="Total de Pedidos" 
          value={data?.summary.orderCount.toString() || '0'} 
          icon={<ShoppingBag size={20} />} 
          color="sky"
        />
        <KPICard 
          label="Ticket Médio" 
          value={formatCurrency(data?.summary.averageTicket || 0)} 
          icon={<TrendingUp size={20} />} 
          color="indigo"
        />
        <KPICard 
          label="Clientes Ativos" 
          value={data?.summary.activeClients.toString() || '0'} 
          icon={<UserCheck size={20} />} 
          color="pink"
        />
        <KPICard 
          label="Conversão" 
          value="84%" 
          icon={<TrendingUp size={20} />} 
          color="amber"
          isPercent
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Evolution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Evolução de Receita</h3>
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
              <TrendingUp size={14} /> +12.5%
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesEvolution}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} tickFormatter={(v) => `R$${v}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(v: any) => [formatCurrency(v), 'Receita']}
                />
                <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 text-center">Formas de Pagamento</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {data?.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rankings and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Top 5 Produtos (Volume)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topProducts} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 10, 10, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Person */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Vendas por Vendedor</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.salesByPerson}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Ranking Clientes */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Top 10 Clientes</h3>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {data?.topClients.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                </div>
                <span className="text-sm font-black text-brand-600">{formatCurrency(c.total)}</span>
              </div>
            ))}
            {data?.topClients.length === 0 && (
              <div className="p-12 text-center text-slate-400 italic text-xs">Nenhuma venda identificada no período.</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Alertas de Estoque</h3>
            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest">Nível Crítico</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {data?.lowStock.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">SKU: {p.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-rose-500">{p.stock} un</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Mínimo: {p.min_stock}</p>
                </div>
              </div>
            ))}
            {data?.lowStock.length === 0 && (
              <div className="p-12 text-center text-emerald-500 italic text-xs flex flex-col items-center gap-2">
                <UserCheck size={32} />
                Todo o estoque está em dia!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, growth, icon, color, isPercent }: any) => {
  const colorMap: any = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 border-brand-100 dark:border-brand-500/20',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/20',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20',
    pink: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 border-pink-100 dark:border-pink-500/20',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl border ${colorMap[color]}`}>
          {icon}
        </div>
        {growth !== undefined && (
          <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {growth >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
      </div>
    </div>
  );
};

export default Reports;
