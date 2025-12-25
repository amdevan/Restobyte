import type { MenuItem, Variation } from '@/types';
import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

type BackendVariation = {
  name: string;
  price: number;
};

type BackendCategory = {
  id: string;
  name: string;
};

type BackendMenuItem = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isVeg?: boolean;
  category?: BackendCategory | null;
  variations?: BackendVariation[];
};

function mapMenuItem(it: BackendMenuItem): MenuItem {
  const variations: Variation[] = (it.variations || []).map(v => ({ name: v.name, price: v.price }));
  return {
    id: it.id,
    name: it.name,
    description: it.description,
    variations,
    category: it.category?.name || 'Uncategorized',
    imageUrl: it.imageUrl,
    isVeg: it.isVeg,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const data = await fetchJson<BackendMenuItem[]>('/menu-items');
  return data.map(mapMenuItem);
}

export async function getCategories(): Promise<BackendCategory[]> {
  return fetchJson<BackendCategory[]>('/categories');
}

// Generic fetchers for broader website access data
export type BackendCustomer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type BackendOrderItem = {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  menuItem?: BackendMenuItem;
};

export type BackendOrder = {
  id: string;
  createdAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | string;
  customer?: BackendCustomer | null;
  items?: BackendOrderItem[];
};

export async function getCustomers(): Promise<BackendCustomer[]> {
  return fetchJson<BackendCustomer[]>('/customers');
}

export async function getOrders(): Promise<BackendOrder[]> {
  return fetchJson<BackendOrder[]>('/orders');
}
