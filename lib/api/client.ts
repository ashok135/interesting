/**
 * WooCommerce REST API base client
 *
 * Supports two authentication modes (auto-detected from env vars):
 *  1. Consumer Key/Secret  → WC_CONSUMER_KEY + WC_CONSUMER_SECRET
 *  2. Application Password → WC_APP_USER + WC_APP_PASSWORD  (recommended for LocalWP)
 *
 * LocalWP (Lightning server) often strips the Authorization header from
 * query-string auth. Application Passwords bypass this issue.
 */

let WC_URL = process.env.NEXT_PUBLIC_WC_URL || 'https://gusty-gravity.localsite.io';
if (WC_URL.includes('interesting.local') && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
  WC_URL = 'https://gusty-gravity.localsite.io';
}
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'ck_41bc01e3bd8cbef7ab775b9fed136778b1efd727';
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'cs_3b1595d0742b1850ed73df5cd4f8e3405e1212ad';
const APP_USER = process.env.WC_APP_USER || '';
const APP_PASSWORD = process.env.WC_APP_PASSWORD || '';
const TUNNEL_USER = process.env.WC_TUNNEL_USER || 'pizzas';
const TUNNEL_PASSWORD = process.env.WC_TUNNEL_PASSWORD || 'tender';

// Determine auth mode
const IS_TUNNEL = WC_URL.includes('localsite.io') || (TUNNEL_USER.length > 0 && TUNNEL_PASSWORD.length > 0);
const USE_APP_PASSWORD = !IS_TUNNEL && APP_USER.length > 0 && APP_PASSWORD.length > 0;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  cache?: RequestCache;
  revalidate?: number;
}

function buildAuthHeaders(): Record<string, string> {
  if (IS_TUNNEL) {
    // When using LocalWP Live Link tunnel, send tunnel credentials to pass the proxy
    const tunnelCreds = Buffer.from(`${TUNNEL_USER}:${TUNNEL_PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${tunnelCreds}` };
  }
  if (USE_APP_PASSWORD) {
    // Application Password: Basic auth with WP username + app password
    const credentials = Buffer.from(`${APP_USER}:${APP_PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${credentials}` };
  }
  // Consumer key/secret via query string (handled in buildUrl)
  return {};
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${WC_URL}/wp-json/wc/v3/${endpoint}`);

  // When using Tunnel or when NOT using app password, send consumer key/secret in query
  if (IS_TUNNEL || !USE_APP_PASSWORD) {
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

// In-memory cache for fast dev/SSR queries without waiting for LocalWP
const memoryCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function wcFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, cache = 'default', revalidate = 300 } = options;

  const url = buildUrl(endpoint, params);
  const cacheKey = `${method}:${url}`;

  // Serve from memory cache if available for GET, unless no-store is requested
  if (method === 'GET' && cache !== 'no-store') {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data as T;
    }
  }

  const authHeaders = buildAuthHeaders();

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
    let cleanMessage = `Request failed with status ${response.status}`;
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

  const data = await response.json() as T;
  if (method === 'GET' && cache !== 'no-store') {
    memoryCache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
  } else if (method !== 'GET') {
    // Invalidate cached GET queries on any creation or modification
    memoryCache.clear();
  }
  return data;
}

export function clearWcCache(): void {
  memoryCache.clear();
}
