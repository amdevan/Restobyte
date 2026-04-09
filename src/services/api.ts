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
  price: number;
  imageUrl?: string;
  isVegetarian?: boolean;
  category?: BackendCategory | null;
  variations?: BackendVariation[];
};

function mapMenuItem(it: BackendMenuItem): MenuItem {
  const variations: Variation[] = (it.variations || []).map(v => ({ name: v.name, price: v.price }));
  return {
    id: it.id,
    name: it.name,
    description: it.description,
    price: it.price,
    variations,
    category: it.category?.name || 'Uncategorized',
    imageUrl: it.imageUrl,
    isVegetarian: it.isVegetarian,
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

export async function getMenuItems(outletId?: string): Promise<MenuItem[]> {
  const url = outletId ? `/menu-items?outletId=${outletId}` : '/menu-items';
  const data = await fetchJson<BackendMenuItem[]>(url);
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

export type SaasWebsiteContent = {
  header: { logoUrl: string; navLinks: Array<{ label: string; href: string }> };
  footer: { copyright: string; columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>; socialLinks: Array<{ platform: string; url: string }> };
  seo: { title: string; description: string; faviconUrl: string };
  hero: { title: string; subtitle: string; imageUrl: string };
  trustedByLogos: string[];
  statistics: Array<{ label: string; value: string }>;
  features: Array<{ id: string; title: string; description: string; icon: string }>;
  cta: { title: string; subtitle: string; buttonText: string };
  pricing: Array<{ id: string; name: string; price: string; features: string[]; isPopular?: boolean }>;
  testimonials: Array<{ id: string; name: string; role: string; content: string; avatarUrl: string; rating: number }>;
  blogPosts: Array<{ id: string; title: string; excerpt: string; date: string; imageUrl: string; author: string }>;
};

export async function getSaasWebsiteContent(): Promise<{ content: SaasWebsiteContent }> {
  return fetchJson<{ content: SaasWebsiteContent }>('/saas-website-content');
}
