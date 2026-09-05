/**
 * WooCommerce Orders API
 * Handles order creation and retrieval
 */

import { wcFetch } from '@/lib/api/client';
import type { OrderPayload, WooOrder } from '@/types';

export async function createOrder(payload: OrderPayload): Promise<WooOrder> {
  // If running in browser, proxy through server API route to securely use server credentials
  if (typeof window !== 'undefined') {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to place order. Please try again.');
    }
    return data.order as WooOrder;
  }

  // Server-side direct call
  return wcFetch<WooOrder>('orders', {
    method: 'POST',
    body: payload,
  });
}

export async function getOrder(orderId: number): Promise<WooOrder> {
  if (typeof window !== 'undefined') {
    const res = await fetch(`/api/orders?id=${orderId}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to fetch order details.');
    }
    return data.order as WooOrder;
  }

  return wcFetch<WooOrder>(`orders/${orderId}`);
}
