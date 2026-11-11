/**
 * WooCommerce Customers API
 * Manages customer sync with WordPress/WooCommerce
 */

import { wcFetch } from '@/lib/api/client';
import type { WooOrder } from '@/types';

export interface WooCustomer {
  id: number;
  date_created: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  avatar_url?: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

export interface CreateCustomerData {
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  password?: string;
  avatar_url?: string;
}

/**
 * Finds a customer in WooCommerce by email
 */
export async function findCustomerByEmail(email: string): Promise<WooCustomer | null> {
  try {
    const customers = await wcFetch<WooCustomer[]>('customers', {
      params: {
        email: email.toLowerCase().trim(),
        role: 'all',
      },
      cache: 'no-store',
    });
    return customers[0] ?? null;
  } catch (error) {
    console.error('Error finding customer by email:', error);
    return null;
  }
}

/**
 * Fetches a WooCommerce customer directly by ID
 */
export async function getCustomerById(id: number): Promise<WooCustomer | null> {
  try {
    return await wcFetch<WooCustomer>(`customers/${id}`, {
      cache: 'no-store',
    });
  } catch (error) {
    console.error(`Error finding customer by ID ${id}:`, error);
    return null;
  }
}

/**
 * Verifies a customer's password directly against the WordPress authentication engine
 */
export async function verifyCustomerCredentials(emailOrUsername: string, password: string): Promise<boolean> {
  try {
    const prodWcUrl = (process.env.NEXT_PUBLIC_WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');
    const form = new URLSearchParams();
    form.set('log', emailOrUsername);
    form.set('pwd', password);
    form.set('rememberme', 'forever');

    const res = await fetch(`${prodWcUrl}/wp-login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      redirect: 'manual',
      cache: 'no-store',
    });

    const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie') || ''];
    const hasAuthCookie = cookies.some((c) => c && c.includes('wordpress_logged_in_'));

    return res.status === 302 && hasAuthCookie;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Creates a new customer in WooCommerce
 */
export async function createWooCustomer(data: CreateCustomerData): Promise<WooCustomer> {
  const username = data.username || data.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') + Math.floor(100 + Math.random() * 900);

  const payload: Record<string, unknown> = {
    email: data.email.toLowerCase().trim(),
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    username,
  };

  if (data.password) {
    payload.password = data.password;
  }

  return wcFetch<WooCustomer>('customers', {
    method: 'POST',
    body: payload,
    cache: 'no-store',
  });
}

/**
 * Gets or creates a customer (used by Google OAuth)
 */
export async function getOrCreateCustomer(data: CreateCustomerData): Promise<WooCustomer> {
  const existing = await findCustomerByEmail(data.email);
  if (existing) {
    return existing;
  }
  return createWooCustomer(data);
}

function normalizeOrder(order: WooOrder): WooOrder {
  if (!order || !order.line_items) return order;
  const prodWcUrl = (process.env.NEXT_PUBLIC_WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');
  order.line_items = order.line_items.map((item) => {
    if (item.image?.src && item.image.src.includes('/wp-content/uploads/')) {
      const match = item.image.src.match(/\/wp-content\/uploads\/(.+)$/);
      if (match) {
        item.image.src = `${prodWcUrl}/wp-content/uploads/${match[1]}`;
      }
    }
    return item;
  });
  return order;
}

/**
 * Fetches all past orders for a specific customer from WooCommerce
 */
export async function getCustomerOrders(customerId: number): Promise<WooOrder[]> {
  try {
    const orders = await wcFetch<WooOrder[]>('orders', {
      params: { customer: customerId, per_page: 20, orderby: 'date', order: 'desc' },
      cache: 'no-store',
    });
    return (orders || []).map(normalizeOrder);
  } catch (error) {
    console.error(`Error fetching orders for customer ${customerId}:`, error);
    return [];
  }
}

/**
 * Updates customer profile or address in WooCommerce
 */
export async function updateCustomer(
  customerId: number,
  data: Partial<WooCustomer> & { password?: string }
): Promise<WooCustomer> {
  return wcFetch<WooCustomer>(`customers/${customerId}`, {
    method: 'PUT',
    body: data,
    cache: 'no-store',
  });
}
