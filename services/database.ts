
import { supabase } from './supabase';
import { Client, Order, Transaction, Product, OrderItem, CommercialSettings, CompanySettings, Invitation, InviteRole, OrderStatus, Membership } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'nexero_cache_clients',
  PRODUCTS: 'nexero_cache_products',
  ORDERS: 'nexero_cache_orders',
  FINANCE: 'nexero_cache_finance',
  COMMERCIAL: 'nexero_cache_commercial',
  COMPANY: 'nexero_cache_company',
  INVITATIONS: 'nexero_cache_invitations',
  SYNC_QUEUE: 'nexero_sync_queue'
};

const localStore = {
  get: (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  set: (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  },
  addToQueue: (type: string, payload: any) => {
    const queue = localStore.get(STORAGE_KEYS.SYNC_QUEUE) || [];
    queue.push({ id: Math.random().toString(36).substr(2, 9), type, payload, timestamp: Date.now() });
    localStore.set(STORAGE_KEYS.SYNC_QUEUE, queue);
  }
};

export const db = {
  async syncPendingData() {
    if (!navigator.onLine) return;
    const queue = localStore.get(STORAGE_KEYS.SYNC_QUEUE) || [];
    if (queue.length === 0) return;

    const remainingQueue = [];
    for (const item of queue) {
      try {
        if (item.type === 'CLIENT') await db.clients.create(item.payload, item.payload.company_id, true);
        if (item.type === 'PRODUCT') await db.products.create(item.payload, item.payload.company_id, true);
        if (item.type === 'ORDER') await db.orders.create(item.payload.order, item.payload.items, item.payload.order.company_id);
      } catch (err) {
        remainingQueue.push(item);
      }
    }
    localStore.set(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);
  },

  team: {
    async getMembership(): Promise<Membership | null> {
      try {
        const { data: authData } = await supabase.auth.getSession();
        const user = authData.session?.user;
        if (!user) return null;

        const { data, error } = await supabase
          .from('memberships')
          .select('*, companies(name)')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) return null;
        return data;
      } catch (e) {
        return null;
      }
    },

    async createCompany(name: string): Promise<string> {
      const { data, error } = await supabase.rpc('create_company_for_owner', { 
        p_company_name: name 
      });
      if (error) throw new Error(error.message);
      return data;
    },

    async getInvitations(companyId: string): Promise<Invitation[]> {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async generateInvitation(companyId: string, email: string, role: string): Promise<Invitation> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autorizado");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          company_id: companyId,
          invited_email: email.trim().toLowerCase(),
          role: role as InviteRole,
          status: 'PENDING',
          expires_at: expiresAt.toISOString(),
          created_by: session.user.id
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },

    // Fix: Added missing deleteInvitation method
    async deleteInvitation(id: string): Promise<void> {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  clients: {
    async getAll(companyId?: string) {
      if (!companyId) return [];
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId)
            .order('name', { ascending: true });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.CLIENTS, data);
          return data as Client[];
        }
      } catch (e) {}
      return (localStore.get(STORAGE_KEYS.CLIENTS) || []).filter((c: any) => c.company_id === companyId);
    },
    async create(client: Partial<Client>, companyId: string, isSyncing = false) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Usuário não autenticado");

      const insertData = {
        name: client.name,
        cnpj_cpf: client.cnpj_cpf,
        email: client.email,
        phone: client.phone,
        address: client.address,
        credit_limit: client.credit_limit || 0,
        type: client.type,
        user_id: session.user.id,
        company_id: companyId
      };

      if (navigator.onLine) {
        const { data, error } = await supabase.from('clients').insert([insertData]).select();
        if (error) throw error;
        return data[0];
      } else if (!isSyncing) {
        localStore.addToQueue('CLIENT', insertData);
      }
    }
  },

  products: {
    async getAll(companyId?: string) {
      if (!companyId) return [];
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId)
            .order('name', { ascending: true });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.PRODUCTS, data);
          return data as Product[];
        }
      } catch (e) {}
      return (localStore.get(STORAGE_KEYS.PRODUCTS) || []).filter((p: any) => p.company_id === companyId);
    },
    async create(product: Partial<Product>, companyId: string, isSyncing = false) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Usuário não autenticado");

      const insertData = {
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        min_stock: product.min_stock,
        category: product.category,
        image_url: product.image_url,
        user_id: session.user.id,
        company_id: companyId
      };

      if (navigator.onLine) {
        const { data, error } = await supabase.from('products').insert([insertData]).select();
        if (error) throw error;
        return data[0];
      } else if (!isSyncing) {
        localStore.addToQueue('PRODUCT', insertData);
      }
    }
  },

  orders: {
    async getAll(companyId?: string) {
      if (!companyId) return [];
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from('orders')
            .select('*, clients(name), order_items(*)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.ORDERS, data);
          return data;
        }
      } catch (e) {}
      return (localStore.get(STORAGE_KEYS.ORDERS) || []).filter((o: any) => o.company_id === companyId);
    },

    async getNextCode(companyId: string): Promise<string> {
      const { data, error } = await supabase
        .from('order_sequences')
        .select('current_value')
        .eq('company_id', companyId)
        .maybeSingle();

      let nextVal = 1;
      if (!data) {
        await supabase.from('order_sequences').insert({ company_id: companyId, current_value: 1 });
      } else {
        nextVal = data.current_value + 1;
        await supabase.from('order_sequences').update({ current_value: nextVal }).eq('company_id', companyId);
      }
      return `PED-${nextVal.toString().padStart(6, '0')}`;
    },

    async create(order: Partial<Order>, items: OrderItem[], companyId: string) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autenticado");

      if (navigator.onLine) {
        const code = await this.getNextCode(companyId);
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{ 
            ...order,
            code,
            user_id: session.user.id,
            company_id: companyId
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        const itemsToInsert = items.map(item => ({ ...item, order_id: orderData.id }));
        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        return orderData;
      }
    }
  },

  finance: {
    // Fix: Added missing getTransactions method
    async getTransactions(): Promise<Transaction[]> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  },

  commercial: {
    async getSettings() {
      const membership = await db.team.getMembership();
      if (!membership) return null;
      const { data, error } = await supabase
        .from('commercial_settings')
        .select('*')
        .eq('company_id', membership.company_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async updateSettings(settings: Partial<CommercialSettings>) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autenticado");
      if (!settings.company_id) throw new Error("ID da empresa ausente.");

      const { data, error } = await supabase
        .from('commercial_settings')
        .upsert({ ...settings, user_id: session.user.id }, { onConflict: 'company_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  company: {
    async getSettings() {
      const membership = await db.team.getMembership();
      if (!membership) return null;
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', membership.company_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async updateSettings(settings: Partial<CompanySettings>) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autenticado");
      if (!settings.company_id) throw new Error("ID da empresa ausente.");

      const { data, error } = await supabase
        .from('company_settings')
        .upsert({ ...settings, user_id: session.user.id }, { onConflict: 'company_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async uploadLogo(file: File) {
      const membership = await db.team.getMembership();
      if (!membership) throw new Error("No membership found");
      const fileExt = file.name.split('.').pop();
      const filePath = `logos/${membership.company_id}/logo-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('company-assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('company-assets').getPublicUrl(filePath);
      return data.publicUrl;
    }
  },

  async getDashboardStats(companyId: string) {
    if (!companyId) return { dailySales: 0, outOfStockItems: 0, pendingOrders: 0, monthlyRevenue: 0 };
    try {
      if (navigator.onLine) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const { data: ordersToday } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('company_id', companyId)
          .gte('created_at', today.toISOString())
          .eq('status', OrderStatus.COMPLETED);
        
        const { data: productsStock } = await supabase
          .from('products')
          .select('stock')
          .eq('company_id', companyId);
          
        return {
          dailySales: ordersToday?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0,
          monthlyRevenue: 0, // Pode ser calculado similarmente
          outOfStockItems: productsStock?.filter(p => p.stock <= 0).length || 0,
          pendingOrders: 0
        };
      }
    } catch (e) {}
    return { dailySales: 0, monthlyRevenue: 0, outOfStockItems: 0, pendingOrders: 0 };
  }
};
