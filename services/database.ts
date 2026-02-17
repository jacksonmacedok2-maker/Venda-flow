
import { supabase } from './supabase';
import { Client, Order, Transaction, Product, OrderItem, CommercialSettings, CompanySettings, Invitation, InviteRole, OrderStatus } from '../types';

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
        if (item.type === 'CLIENT') await db.clients.create(item.payload, true);
        if (item.type === 'PRODUCT') await db.products.create(item.payload, true);
        if (item.type === 'ORDER') await db.orders.create(item.payload.order, item.payload.items);
      } catch (err) {
        remainingQueue.push(item);
      }
    }
    localStore.set(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);
  },

  team: {
    async getActiveCompanyId(): Promise<string | null> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', session.user.id)
        .eq('status', 'ACTIVE')
        .limit(1)
        .maybeSingle();

      // Se der erro ou não houver membership, retornamos o próprio ID do usuário 
      // como sendo o ID da empresa (Comportamento de OWNER inicial)
      if (error || !data) {
        return session.user.id;
      }
      return data.company_id;
    },

    async getInvitations(): Promise<Invitation[]> {
      const companyId = await this.getActiveCompanyId();
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      localStore.set(STORAGE_KEYS.INVITATIONS, data);
      return data;
    },

    async generateInvitation(email: string, role: InviteRole): Promise<Invitation> {
      const { data: { session } } = await supabase.auth.getSession();
      const companyId = await this.getActiveCompanyId();
      if (!session?.user || !companyId) throw new Error("Não autorizado");

      const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = {
        company_id: companyId,
        invited_email: email,
        role: role,
        status: 'PENDING',
        token: token,
        expires_at: expiresAt.toISOString(),
        created_by: session.user.id
      };

      const { data, error } = await supabase
        .from('invitations')
        .insert([invite])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async deleteInvitation(id: string) {
      const { error } = await supabase.from('invitations').delete().eq('id', id);
      if (error) throw error;
    }
  },

  company: {
    async getSettings(): Promise<CompanySettings | null> {
      try {
        if (navigator.onLine) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return null;

          const { data, error } = await supabase
            .from('company_settings')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (error) throw error;
          
          if (!data) {
            const { data: newData, error: createError } = await supabase
              .from('company_settings')
              .insert([{ user_id: session.user.id }])
              .select()
              .single();
            
            if (createError) throw createError;
            localStore.set(STORAGE_KEYS.COMPANY, newData);
            return newData;
          }

          localStore.set(STORAGE_KEYS.COMPANY, data);
          return data;
        }
      } catch (e) {
        console.error("Erro ao buscar dados da empresa:", e);
      }
      return localStore.get(STORAGE_KEYS.COMPANY);
    },

    async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings | null> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autenticado");

      const { id, user_id, created_at, updated_at, ...cleanSettings } = settings as any;

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('company_settings')
          .upsert({ ...cleanSettings, user_id: session.user.id })
          .select()
          .single();

        if (error) throw error;
        localStore.set(STORAGE_KEYS.COMPANY, data);
        return data;
      } else {
        const current = localStore.get(STORAGE_KEYS.COMPANY) || {};
        const updated = { ...current, ...cleanSettings };
        localStore.set(STORAGE_KEYS.COMPANY, updated);
        return updated;
      }
    },

    async uploadLogo(file: File): Promise<string> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autenticado");

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    }
  },

  commercial: {
    async getSettings(): Promise<CommercialSettings | null> {
      try {
        if (navigator.onLine) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return null;

          const { data, error } = await supabase
            .from('commercial_settings')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (error) throw error;
          
          if (!data) {
            const { data: newData, error: createError } = await supabase
              .from('commercial_settings')
              .insert([{ user_id: session.user.id }])
              .select()
              .single();
            
            if (createError) throw createError;
            localStore.set(STORAGE_KEYS.COMMERCIAL, newData);
            return newData;
          }

          localStore.set(STORAGE_KEYS.COMMERCIAL, data);
          return data;
        }
      } catch (e) {
        console.error("Erro ao buscar settings comerciais:", e);
      }
      return localStore.get(STORAGE_KEYS.COMMERCIAL);
    },

    async updateSettings(settings: Partial<CommercialSettings>): Promise<CommercialSettings | null> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autenticado");

      const { id, user_id, created_at, updated_at, ...cleanSettings } = settings as any;

      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('commercial_settings')
          .upsert({ ...cleanSettings, user_id: session.user.id })
          .select()
          .single();

        if (error) throw error;
        localStore.set(STORAGE_KEYS.COMMERCIAL, data);
        return data;
      } else {
        const current = localStore.get(STORAGE_KEYS.COMMERCIAL) || {};
        const updated = { ...current, ...cleanSettings };
        localStore.set(STORAGE_KEYS.COMMERCIAL, updated);
        return updated;
      }
    }
  },

  clients: {
    async getAll() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.CLIENTS, data);
          return data as Client[];
        }
      } catch (e) {}
      return localStore.get(STORAGE_KEYS.CLIENTS) || [];
    },
    async create(client: Partial<Client>, isSyncing = false) {
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
        user_id: session.user.id
      };

      if (!isSyncing) {
        const current = localStore.get(STORAGE_KEYS.CLIENTS) || [];
        localStore.set(STORAGE_KEYS.CLIENTS, [...current, { ...insertData, id: 'temp_' + Date.now() }]);
      }

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
    async getAll() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.PRODUCTS, data);
          return data as Product[];
        }
      } catch (e) {}
      return localStore.get(STORAGE_KEYS.PRODUCTS) || [];
    },
    async create(product: Partial<Product>, isSyncing = false) {
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
        user_id: session.user.id
      };

      if (!isSyncing) {
        const current = localStore.get(STORAGE_KEYS.PRODUCTS) || [];
        localStore.set(STORAGE_KEYS.PRODUCTS, [...current, { ...insertData, id: 'temp_' + Date.now() }]);
      }

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
    async getAll() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from('orders')
            .select('*, clients(name), order_items(*)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.ORDERS, data);
          return data;
        }
      } catch (e) {}
      return localStore.get(STORAGE_KEYS.ORDERS) || [];
    },

    async getNextCode(): Promise<string> {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 'PED-000000';

      const { data, error } = await supabase
        .from('order_sequences')
        .select('current_value')
        .eq('user_id', session.user.id)
        .single();

      let nextVal = 1;
      if (error && error.code === 'PGRST116') {
        await supabase.from('order_sequences').insert({ user_id: session.user.id, current_value: 1 });
      } else if (data) {
        nextVal = data.current_value + 1;
        await supabase.from('order_sequences').update({ current_value: nextVal }).eq('user_id', session.user.id);
      }

      return `PED-${nextVal.toString().padStart(6, '0')}`;
    },

    async create(order: Partial<Order>, items: OrderItem[]) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Não autenticado");

      if (navigator.onLine) {
        const code = await this.getNextCode();

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{ 
            client_id: order.client_id,
            total_amount: order.total_amount,
            subtotal: order.subtotal || order.total_amount,
            discount_total: order.discount_total || 0,
            status: order.status,
            salesperson: order.salesperson,
            payment_method: order.payment_method,
            notes: order.notes,
            code,
            user_id: session.user.id 
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        const itemsToInsert = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          total_price: item.total_price
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        // Fix: Use OrderStatus.COMPLETED enum value for comparison instead of string literal 'COMPLETED'
        if (order.status === OrderStatus.COMPLETED) {
          for (const item of items) {
            const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
            if (prod) {
              await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.product_id);
            }
          }
        }

        return orderData;
      } else {
        localStore.addToQueue('ORDER', { order, items });
        return { id: 'offline_temp', ...order };
      }
    }
  },

  finance: {
    async getTransactions() {
      try {
        if (navigator.onLine) {
          const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
          if (error) throw error;
          localStore.set(STORAGE_KEYS.FINANCE, data);
          return data as Transaction[];
        }
      } catch (e) {}
      return localStore.get(STORAGE_KEYS.FINANCE) || [];
    },
    async createTransaction(transaction: Partial<Transaction>) {
      if (navigator.onLine) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error("Não autenticado");
        const { data, error } = await supabase.from('transactions').insert([{ ...transaction, user_id: session.user.id, date: new Date().toISOString() }]).select();
        if (error) throw error;
        return data[0];
      }
    }
  },

  async getDashboardStats() {
    try {
      if (navigator.onLine) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return { dailySales: 0, outOfStockItems: 0, pendingOrders: 0, monthlyRevenue: 0 };
        const today = new Date();
        today.setHours(0,0,0,0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // Fix: Use OrderStatus.COMPLETED enum value for query equality check instead of string literal 'COMPLETED'
        const { data: ordersToday } = await supabase.from('orders').select('total_amount').gte('created_at', today.toISOString()).eq('status', OrderStatus.COMPLETED);
        const { data: ordersMonth } = await supabase.from('orders').select('total_amount').gte('created_at', firstDayOfMonth.toISOString()).eq('status', OrderStatus.COMPLETED);
        const { data: productsStock } = await supabase.from('products').select('stock');
        return {
          dailySales: ordersToday?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0,
          monthlyRevenue: ordersMonth?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0,
          outOfStockItems: productsStock?.filter(p => p.stock <= 0).length || 0,
          pendingOrders: 0
        };
      }
    } catch (e) {}
    return { dailySales: 0, monthlyRevenue: 0, outOfStockItems: 0, pendingOrders: 0 };
  }
};
