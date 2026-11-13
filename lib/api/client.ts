/**
 * WooCommerce REST API Base Client (Production Ready)
 *
 * Provides authenticated communication with the production WooCommerce REST API.
 * Base Endpoint: https://intersting.duckdns.org/wp-json/wc/v3
 */

const WC_BASE_URL = (process.env.WC_URL || process.env.NEXT_PUBLIC_WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || '';
const APP_USER = process.env.WC_APP_USER || '';
const APP_PASSWORD = process.env.WC_APP_PASSWORD || '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  cache?: RequestCache;
  revalidate?: number;
}

function buildHeaders(): Record<string, string> {
  // 1. Primary Auth: WooCommerce Consumer Key / Secret Basic Auth over HTTPS
  if (CONSUMER_KEY && CONSUMER_SECRET) {
    const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    return { Authorization: `Basic ${creds}` };
  }

  // 2. Fallback Auth: WordPress Application Password
  if (APP_USER && APP_PASSWORD) {
    const credentials = Buffer.from(`${APP_USER}:${APP_PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${credentials}` };
  }

  return {};
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${WC_BASE_URL}/wp-json/wc/v3/${endpoint}`);

  // Query parameter fallback if consumer credentials are used
  if (CONSUMER_KEY && CONSUMER_SECRET) {
    url.searchParams.set('consumer_key', CONSUMER_KEY);
    url.searchParams.set('consumer_secret', CONSUMER_SECRET);
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

// In-memory cache for fast dev/SSR queries
const memoryCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function wcFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, cache = 'default', revalidate = 300 } = options;

  const cacheKey = `${method}:${endpoint}:${JSON.stringify(params || {})}`;

  // Serve from memory cache if available for GET
  if (method === 'GET' && cache !== 'no-store') {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data as T;
    }
  }

  const url = buildUrl(endpoint, params);
  const authHeaders = buildHeaders();

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    cache: cache === 'no-store' ? 'no-store' : undefined,
    next: cache === 'no-store' ? { revalidate: 0 } : { revalidate },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    let cleanMessage = `Request to WooCommerce (${endpoint}) failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.message) {
        cleanMessage = parsed.message.replace(/<[^>]*>/g, '').trim();
      }
    } catch {
      cleanMessage = errorText.replace(/<[^>]*>/g, '').trim() || cleanMessage;
    }
    const err = new Error(cleanMessage);
    (err as unknown as { status: number }).status = response.status;
    throw err;
  }

  let data: T;
  try {
    const text = await response.text();
    data = text ? (JSON.parse(text) as T) : ({} as T);
  } catch (err) {
    console.error(`Failed to parse JSON response for ${endpoint}:`, err);
    data = [] as unknown as T;
  }

  if (method === 'GET' && cache !== 'no-store') {
    memoryCache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
  } else if (method !== 'GET') {
    memoryCache.clear();
  }

  return data;
}

export function clearWcCache(): void {
  memoryCache.clear();
}
