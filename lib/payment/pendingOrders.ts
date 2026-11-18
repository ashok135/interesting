import fs from 'fs';
import path from 'path';
import os from 'os';
import type { OrderPayload } from '@/types';

interface PendingEntry {
  orderData: OrderPayload;
  createdAt: number;
}

// In-memory cache for pending order payloads keyed by razorpay_order_id
const pendingOrders = new Map<string, PendingEntry>();

// Keep orders for 2 hours (120 mins)
const TTL_MS = 2 * 60 * 60 * 1000;
const CACHE_FILE = path.join(os.tmpdir(), 'intersting_pending_orders.json');

function readDiskCache(): Record<string, PendingEntry> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw) || {};
    }
  } catch (err) {
    console.warn('[PendingOrders] Failed to read disk cache:', err);
  }
  return {};
}

function writeDiskCache(cache: Record<string, PendingEntry>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  } catch (err) {
    console.warn('[PendingOrders] Failed to write disk cache:', err);
  }
}

export function setPendingOrder(razorpayOrderId: string, orderData: OrderPayload) {
  if (!razorpayOrderId) return;
  cleanExpired();

  const entry: PendingEntry = {
    orderData,
    createdAt: Date.now(),
  };

  pendingOrders.set(razorpayOrderId, entry);

  // Sync to disk cache so server restarts or separate worker instances don't drop payloads
  try {
    const disk = readDiskCache();
    disk[razorpayOrderId] = entry;
    writeDiskCache(disk);
  } catch (diskErr) {
    console.warn('[PendingOrders] Disk sync error:', diskErr);
  }
}

export function getPendingOrder(razorpayOrderId: string): OrderPayload | null {
  if (!razorpayOrderId) return null;

  // 1. Check memory cache first
  const entry = pendingOrders.get(razorpayOrderId);
  if (entry) {
    if (Date.now() - entry.createdAt > TTL_MS) {
      deletePendingOrder(razorpayOrderId);
      return null;
    }
    return entry.orderData;
  }

  // 2. Fallback to disk cache if memory was cleared or process restarted
  try {
    const disk = readDiskCache();
    const diskEntry = disk[razorpayOrderId];
    if (diskEntry) {
      if (Date.now() - diskEntry.createdAt > TTL_MS) {
        deletePendingOrder(razorpayOrderId);
        return null;
      }
      // Re-populate in-memory cache
      pendingOrders.set(razorpayOrderId, diskEntry);
      return diskEntry.orderData;
    }
  } catch (diskErr) {
    console.warn('[PendingOrders] Disk lookup error:', diskErr);
  }

  return null;
}

export function deletePendingOrder(razorpayOrderId: string) {
  if (!razorpayOrderId) return;
  pendingOrders.delete(razorpayOrderId);

  try {
    const disk = readDiskCache();
    if (disk[razorpayOrderId]) {
      delete disk[razorpayOrderId];
      writeDiskCache(disk);
    }
  } catch (diskErr) {
    console.warn('[PendingOrders] Disk delete error:', diskErr);
  }
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, value] of pendingOrders.entries()) {
    if (now - value.createdAt > TTL_MS) {
      pendingOrders.delete(key);
    }
  }

  try {
    const disk = readDiskCache();
    let changed = false;
    for (const key of Object.keys(disk)) {
      if (now - disk[key].createdAt > TTL_MS) {
        delete disk[key];
        changed = true;
      }
    }
    if (changed) {
      writeDiskCache(disk);
    }
  } catch {}
}
