
import { supabase } from './supabase';
import { Order, Product, Client } from '../types';

export interface BISummary {
  totalRevenue: number;
  orderCount: number;
  averageTicket: number;
  activeClients: number;
  growth: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface BIServiceData {
  summary: BISummary;
  salesEvolution: ChartData[];
  paymentMethods: ChartData[];
  topProducts: ChartData[];
  salesByPerson: ChartData[];
  topClients: { name: string; total: number }[];
  lowStock: Product[];
}

export const biService = {
  async getDashboardData(startDate: string, endDate: string): Promise<BIServiceData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Não autenticado");

    // 1. Buscar Pedidos no período
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*, clients(name), order_items(*)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('user_id', session.user.id);

    if (ordersError) throw ordersError;

    // 2. Buscar Pedidos do período anterior (para cálculo de crescimento)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - diff).toISOString();
    const prevEnd = new Date(start.getTime()).toISOString();

    const { data: prevOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', prevStart)
      .lt('created_at', prevEnd)
      .eq('user_id', session.user.id);

    // 3. Buscar Todos os Clientes e Produtos (para contextos globais)
    const [{ data: clients }, { data: products }] = await Promise.all([
      supabase.from('clients').select('id').eq('user_id', session.user.id),
      supabase.from('products').select('*').eq('user_id', session.user.id)
    ]);

    // Processamento de Dados
    const totalRevenue = (orders || []).reduce((acc, o) => acc + Number(o.total_amount), 0);
    const prevTotalRevenue = (prevOrders || []).reduce((acc, o) => acc + Number(o.total_amount), 0);
    const growth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
    
    const orderCount = orders?.length || 0;
    const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0;
    const activeClientsCount = new Set(orders?.map(o => o.client_id).filter(Boolean)).size;

    // Evolução de Vendas (Agrupado por Dia)
    const salesMap: Record<string, number> = {};
    orders?.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      salesMap[date] = (salesMap[date] || 0) + Number(o.total_amount);
    });
    const salesEvolution = Object.entries(salesMap).map(([name, value]) => ({ name, value }));

    // Formas de Pagamento
    const payMap: Record<string, number> = {};
    orders?.forEach(o => {
      const m = o.payment_method || 'Outros';
      payMap[m] = (payMap[m] || 0) + 1;
    });
    const paymentMethods = Object.entries(payMap).map(([name, value]) => ({ name, value }));

    // Top Produtos
    const prodMap: Record<string, number> = {};
    orders?.forEach(o => {
      o.order_items?.forEach((item: any) => {
        prodMap[item.name] = (prodMap[item.name] || 0) + (Number(item.quantity));
      });
    });
    const topProducts = Object.entries(prodMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Vendas por Vendedor
    const sellerMap: Record<string, number> = {};
    orders?.forEach(o => {
      const s = o.salesperson || 'Não Identificado';
      sellerMap[s] = (sellerMap[s] || 0) + Number(o.total_amount);
    });
    const salesByPerson = Object.entries(sellerMap).map(([name, value]) => ({ name, value }));

    // Top Clientes
    const clientRevMap: Record<string, number> = {};
    orders?.forEach(o => {
      const c = o.clients?.name || 'Consumidor Final';
      clientRevMap[c] = (clientRevMap[c] || 0) + Number(o.total_amount);
    });
    const topClients = Object.entries(clientRevMap)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      summary: {
        totalRevenue,
        orderCount,
        averageTicket,
        activeClients: activeClientsCount,
        growth
      },
      salesEvolution,
      paymentMethods,
      topProducts,
      salesByPerson,
      topClients,
      lowStock: (products || []).filter(p => p.stock <= p.min_stock)
    };
  }
};
