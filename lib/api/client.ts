/**
 * WooCommerce REST API base client
 *
 * Supports two authentication modes (auto-detected from target URL):
 *  1. LocalWP direct (http://interesting.local) → WordPress Application Password
 *  2. Live Link Tunnel (*.localsite.io) → Tunnel Basic Auth + Consumer Key/Secret
 */

const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'ck_41bc01e3bd8cbef7ab775b9fed136778b1efd727';
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'cs_3b1595d0742b1850ed73df5cd4f8e3405e1212ad';
const APP_USER = process.env.WC_APP_USER || 'ashok';
const APP_PASSWORD = process.env.WC_APP_PASSWORD || 'G4J1 hiEc rSBt ALs7 Ftyh 6mBf';
const TUNNEL_USER = process.env.WC_TUNNEL_USER || 'pizzas';
const TUNNEL_PASSWORD = process.env.WC_TUNNEL_PASSWORD || 'tender';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  cache?: RequestCache;
  revalidate?: number;
}

function getCandidateBaseUrls(): string[] {
  const envUrl = (process.env.WC_URL || process.env.NEXT_PUBLIC_WC_URL || '').replace(/\/$/, '');
  const isVercel = Boolean(process.env.VERCEL);

  const list: string[] = [];
  if (isVercel) {
    if (envUrl && !envUrl.includes('.local')) list.push(envUrl);
    list.push('https://gusty-gravity.localsite.io');
  } else {
    // Local dev: prefer direct lightning server domain
    if (envUrl && envUrl.includes('.local')) list.push(envUrl);
    list.push('http://interesting.local');
    if (envUrl && !envUrl.includes('.local')) list.push(envUrl);
    list.push('https://gusty-gravity.localsite.io');
  }

  return Array.from(new Set(list.filter(Boolean)));
}

let preferredBaseUrl: string | null = null;

function buildUrlForBase(baseUrl: string, endpoint: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${baseUrl}/wp-json/wc/v3/${endpoint}`);
  const isTunnel = baseUrl.includes('localsite.io');

  if (isTunnel) {
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

function buildHeadersForBase(baseUrl: string): Record<string, string> {
  const isTunnel = baseUrl.includes('localsite.io');
  if (isTunnel && TUNNEL_USER && TUNNEL_PASSWORD) {
    const tunnelCreds = Buffer.from(`${TUNNEL_USER}:${TUNNEL_PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${tunnelCreds}` };
  }

  if (!isTunnel && APP_USER && APP_PASSWORD) {
    const credentials = Buffer.from(`${APP_USER}:${APP_PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${credentials}` };
  }

  return {};
}

// In-memory cache for fast dev/SSR queries without waiting for LocalWP
const memoryCache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function wcFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, cache = 'default', revalidate = 300 } = options;

  const candidates = getCandidateBaseUrls();
  const orderedUrls = preferredBaseUrl
    ? [preferredBaseUrl, ...candidates.filter((u) => u !== preferredBaseUrl)]
    : candidates;

  const cacheKey = `${method}:${endpoint}:${JSON.stringify(params || {})}`;

  // Serve from memory cache if available for GET
  if (method === 'GET' && cache !== 'no-store') {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      return cached.data as T;
    }
  }

  let lastError: Error | null = null;

  for (const baseUrl of orderedUrls) {
    try {
      const url = buildUrlForBase(baseUrl, endpoint, params);
      const authHeaders = buildHeadersForBase(baseUrl);

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
        let cleanMessage = `Request to ${baseUrl} failed with status ${response.status}`;
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
        lastError = err;
        // Try next candidate base URL
        continue;
      }

      const data = (await response.json()) as T;
      preferredBaseUrl = baseUrl;

      if (method === 'GET' && cache !== 'no-store') {
        memoryCache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
      } else if (method !== 'GET') {
        memoryCache.clear();
      }

      return data;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error(`All WooCommerce endpoints failed for ${endpoint}`);
}

export function clearWcCache(): void {
  memoryCache.clear();
}
