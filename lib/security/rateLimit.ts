import { NextRequest } from 'next/server';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitStore {
  timestamps: number[];
}

const ipMap = new Map<string, RateLimitStore>();
const MAX_TRACKED_IPS = 10000;

// Periodically clean up entries older than 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanOldEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS && ipMap.size < MAX_TRACKED_IPS) return;
  lastCleanup = now;

  for (const [ip, store] of ipMap.entries()) {
    store.timestamps = store.timestamps.filter((t) => now - t < windowMs);
    if (store.timestamps.length === 0) {
      ipMap.delete(ip);
    }
  }

  // Hard cap to prevent memory exhaustion if flooded with spoofed headers
  if (ipMap.size >= MAX_TRACKED_IPS) {
    const oldestKey = ipMap.keys().next().value;
    if (oldestKey) ipMap.delete(oldestKey);
  }
}

export function getClientIp(req: NextRequest): string {
  // Prefer proxy-set single IP headers when present (e.g., Vercel x-real-ip, Cloudflare)
  const realIp = req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip');
  if (realIp) return realIp.trim().slice(0, 64);

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return '127.0.0.1';
}

export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = { limit: 30, windowMs: 60 * 1000 }
): { allowed: boolean; remaining: number; resetSec: number } {
  cleanOldEntries(config.windowMs);

  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let store = ipMap.get(ip);
  if (!store) {
    store = { timestamps: [] };
    ipMap.set(ip, store);
  }

  // Filter timestamps within the current sliding window
  store.timestamps = store.timestamps.filter((t) => t > windowStart);

  if (store.timestamps.length >= config.limit) {
    const oldest = store.timestamps[0];
    const resetSec = Math.ceil((oldest + config.windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSec: Math.max(1, resetSec),
    };
  }

  store.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.limit - store.timestamps.length,
    resetSec: Math.ceil(config.windowMs / 1000),
  };
}
