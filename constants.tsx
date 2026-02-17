
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Package, DollarSign, Settings, Store, Megaphone, ClipboardList, UserRound, BarChart3, Users2 } from 'lucide-react';
import { Permission } from './types';

export interface NavItem {
  key: string;
  path: string;
  icon: React.ReactNode;
  requiredPermission?: Permission;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/', icon: <LayoutDashboard size={20} strokeWidth={2} /> },
  { key: 'orders', path: '/orders', icon: <ShoppingCart size={20} strokeWidth={2} />, requiredPermission: 'ORDERS' },
  { key: 'pos', path: '/pos', icon: <Store size={20} strokeWidth={2} />, requiredPermission: 'POS' },
  { key: 'team', path: '/team', icon: <Users2 size={20} strokeWidth={2} />, requiredPermission: 'TEAM' },
  { key: 'clients', path: '/clients', icon: <UserRound size={20} strokeWidth={2} />, requiredPermission: 'CLIENTS' },
  { key: 'products', path: '/products', icon: <Package size={20} strokeWidth={2} />, requiredPermission: 'PRODUCTS' },
  { key: 'inventory', path: '/inventory', icon: <ClipboardList size={20} strokeWidth={2} />, requiredPermission: 'INVENTORY' },
  { key: 'finance', path: '/finance', icon: <DollarSign size={20} strokeWidth={2} />, requiredPermission: 'FINANCE' },
  { key: 'reports', path: '/reports', icon: <BarChart3 size={20} strokeWidth={2} />, requiredPermission: 'REPORTS' },
  { key: 'settings', path: '/settings', icon: <Settings size={20} strokeWidth={2} />, requiredPermission: 'SETTINGS' },
];

export const APP_THEME = {
  primary: 'brand-600',
  primaryHover: 'brand-700',
  secondary: 'slate-600',
  success: 'emerald-600',
  danger: 'rose-600',
  warning: 'amber-500',
};
