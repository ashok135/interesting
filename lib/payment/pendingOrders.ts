import type { OrderPayload } from '@/types';

interface PendingEntry {
  orderData: OrderPayload;
  createdAt: number;
}

// In-memory cache for pending order payloads keyed by razorpay_order_id
const pendingOrders = new Map<string, PendingEntry>();

// Keep orders for 2 hours (120 mins)
const TTL_MS = 2 * 60 * 60 * 1000;

export function setPendingOrder(razorpayOrderId: string, orderData: OrderPayload) {
  if (!razorpayOrderId) return;
  cleanExpired();
  pendingOrders.set(razorpayOrderId, {
    orderData,
    createdAt: Date.now(),
  });
}

export function getPendingOrder(razorpayOrderId: string): OrderPayload | null {
  if (!razorpayOrderId) return null;
  const entry = pendingOrders.get(razorpayOrderId);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    pendingOrders.delete(razorpayOrderId);
    return null;
  }
  return entry.orderData;
}

export function deletePendingOrder(razorpayOrderId: string) {
  if (razorpayOrderId) {
    pendingOrders.delete(razorpayOrderId);
  }
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, value] of pendingOrders.entries()) {
    if (now - value.createdAt > TTL_MS) {
      pendingOrders.delete(key);
    }
  }
}
