
export enum OrderStatus {
  PENDING = 'PENDENTE',
  COMPLETED = 'CONCLUÍDO',
  CANCELLED = 'CANCELADO',
  DRAFT = 'RASCUNHO'
}

export enum UserRole {
  ADMIN = 'Administrador',
  MANAGER = 'Gerente',
  SELLER = 'Vendedor',
  CASHIER = 'Operador de Caixa'
}

export type Permission = 'FINANCE' | 'INVENTORY' | 'PRODUCTS' | 'ORDERS' | 'POS' | 'SETTINGS' | 'REPORTS' | 'CLIENTS' | 'TEAM';

export type InviteRole = 'ADMIN' | 'SELLER' | 'VIEWER';

export interface Membership {
  id: string;
  company_id: string;
  user_id: string;
  role: 'OWNER' | 'ADMIN' | 'SELLER' | 'VIEWER';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  user_email?: string;
  user_name?: string;
  companies?: {
    name: string;
  };
}

export interface Invitation {
  id: string;
  company_id: string;
  invited_name: string;
  invited_email: string;
  role: InviteRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  token: string;
  expires_at: string;
  created_at: string;
  created_by: string;
  accepted_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  permissions: Permission[];
}

export interface Client {
  id: string;
  user_id?: string;
  company_id?: string;
  name: string;
  cnpj_cpf: string;
  email: string;
  phone: string;
  address: string;
  credit_limit: number;
  total_spent: number;
  type: 'PF' | 'PJ';
  created_at?: string;
}

export interface Product {
  id: string;
  user_id?: string;
  company_id?: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
  image_url: string;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
}

export interface Order {
  id: string;
  code: string;
  user_id?: string;
  company_id?: string;
  client_id: string | null;
  total_amount: number;
  discount_total: number;
  subtotal: number;
  status: OrderStatus;
  salesperson: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  clients?: { name: string };
  order_items?: OrderItem[];
}

export interface Transaction {
  id: string;
  user_id?: string;
  company_id?: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: 'PAID' | 'PENDING';
  date: string;
}

export interface CommercialSettings {
  id?: string;
  user_id?: string;
  company_id?: string;
  minimum_order_value: number;
  auto_approve_orders: boolean;
  allow_negative_stock: boolean;
  low_stock_threshold: number;
  max_discount_percent: number;
  allow_discount_override: boolean;
  default_payment_method: string;
  allowed_payment_methods: string[];
  default_price_table: string;
  enable_multiple_price_tables: boolean;
  enable_credit_limit: boolean;
  default_credit_limit: number;
  order_code_prefix: string;
  order_code_padding: number;
  enable_freight: boolean;
  freight_mode: 'EMBUTIDO' | 'SEPARADO';
  default_freight_value: number;
  enable_sales_goals: boolean;
  monthly_goal: number;
}

export interface CompanySettings {
  id?: string;
  user_id?: string;
  company_id?: string;
  trade_name: string;
  legal_name: string;
  document: string;
  state_registration: string;
  phone: string;
  email: string;
  whatsapp: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  timezone: string;
  notes: string;
  logo_url: string;
}
