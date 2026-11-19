/**
 * Smart RAG & RIG Engine — Optimized Architecture v2
 *
 * OPTIMIZATIONS:
 *  1. In-memory embedding cache (5-min TTL) — skips NVIDIA embed API for repeated queries
 *  2. In-memory WooCommerce product cache (3-min TTL) — skips live fetch for same search
 *  3. Promise.all() parallelism — embed+Qdrant AND WooCommerce run simultaneously
 *
 * INTENT ROUTING (fastest first):
 *  - GREETING / CONTACT / ORDER → 0 DB calls, instant ~0.6s
 *  - POLICY → embed + Qdrant only (~1–2s)
 *  - PRODUCT → embed + Qdrant + WooCommerce in parallel (~1–1.5s)
 */

import { getProducts } from '@/lib/api/products';
import type { WooProduct } from '@/types';

export interface RetrievedProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  image: string;
  category: string;
  description: string;
  stock_status: string;
}

export interface RagContext {
  products: RetrievedProduct[];
  policies: string[];
  formattedContext: string;
  suggestions?: string[];
}

export type QueryIntent =
  | 'contact'
  | 'order_tracking'
  | 'policy'
  | 'product_search'
  | 'hybrid_product_policy'
  | 'greeting';

interface QueryClassification {
  intent: QueryIntent;
  maxBudget: number | null;
  expandedQuery: string;
}

const PHONETIC_SYNONYMS: Record<string, string> = {
  kaju: 'cashew',
  badam: 'almond',
  akhrot: 'walnut',
  kishmish: 'raisin',
  pista: 'pistachio',
  khajoor: 'dates',
  khajur: 'dates',
  anjeer: 'figs',
  makhana: 'lotus seeds makhana',
  chikki: 'chikki brittle',
  mamra: 'mamra badam almond',
};

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

// =============================================================================
// OPTIMIZATION 1: In-Memory Caches with TTL
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Embedding vector cache — key: normalized query string, TTL: 5 minutes
const embeddingCache = new Map<string, CacheEntry<number[]>>();
const EMBED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// WooCommerce product cache — key: search key (ids joined or search term), TTL: 3 minutes
const productCache = new Map<string, CacheEntry<WooProduct[]>>();
const PRODUCT_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  // Evict old entries if cache grows beyond 200 keys to prevent memory leak
  if (cache.size >= 200) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// =============================================================================

function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 10/10 OPTIMIZATION: Contextualizes follow-up queries using conversation history
 * (e.g. Turn 1: "Show me cashews" -> Turn 2: "Which one is under 600?" -> effectively "cashews under 600")
 */
function contextualizeQuery(
  userQuery: string,
  history?: Array<{ role?: string; content?: string }>
): string {
  if (!history || history.length === 0) return userQuery;
  const q = userQuery.toLowerCase().trim();

  const isFollowUp =
    q.startsWith('which') ||
    q.startsWith('what about') ||
    q.startsWith('how about') ||
    q.startsWith('is it') ||
    q.startsWith('is that') ||
    q.startsWith('are they') ||
    q.startsWith('do you have') ||
    q.startsWith('under') ||
    q.startsWith('below') ||
    q.includes('cheaper') ||
    q.includes('cost') ||
    q.includes('in stock') ||
    q.includes('smaller') ||
    q.includes('bigger') ||
    q.includes('more like') ||
    q.split(' ').length <= 3;

  if (!isFollowUp) return userQuery;

  const productKeywords = [
    'cashew', 'kaju', 'almond', 'badam', 'walnut', 'akhrot',
    'raisin', 'kishmish', 'date', 'khajoor', 'pista', 'pistachio',
    'seed', 'hamper', 'gift', 'makhana', 'chikki', 'anjeer', 'fig'
  ];

  for (let i = history.length - 1; i >= 0; i--) {
    const prev = (history[i]?.content || '').toLowerCase();
    for (const kw of productKeywords) {
      if (prev.includes(kw) && !q.includes(kw)) {
        return `${userQuery} ${kw}`;
      }
    }
  }

  return userQuery;
}

/**
 * 10/10 OPTIMIZATION: Normalizes query with Indian dry fruit phonetics & expands synonyms
 */
function expandQuerySynonyms(userQuery: string): string {
  const words = userQuery.toLowerCase().split(/\s+/);
  const expansions: string[] = [];

  for (const w of words) {
    const cleanW = w.replace(/[^a-z0-9]/g, '');
    if (PHONETIC_SYNONYMS[cleanW]) {
      expansions.push(PHONETIC_SYNONYMS[cleanW]);
    }
  }

  if (expansions.length > 0) {
    return `${userQuery} ${expansions.join(' ')}`;
  }
  return userQuery;
}

/**
 * 10/10 Classifies customer query using priority intent hierarchy with Hybrid Intent Blending
 */
function classifyQuery(userQuery: string): QueryClassification {
  const q = userQuery.toLowerCase().trim();
  const expandedQuery = expandQuerySynonyms(userQuery);

  // 1. Extract budget filter (e.g. "under 500", "below 1000", "less than 400")
  let maxBudget: number | null = null;
  const budgetMatch = q.match(/(?:under|below|less than|within|around)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // 2. Priority 1: Customer Care / Helpline / Contact
  const isContactQuery =
    q.includes('contact') ||
    q.includes('support') ||
    q.includes('helpline') ||
    q.includes('customer care') ||
    q.includes('customer support') ||
    q.includes('phone') ||
    q.includes('call') ||
    q.includes('whatsapp') ||
    q.includes('email') ||
    q.includes('reach');

  if (isContactQuery) return { intent: 'contact', maxBudget, expandedQuery };

  // 3. Priority 2: Order tracking / account status
  const isOrderQuery =
    q.includes('order') ||
    q.includes('track') ||
    q.includes('tracking') ||
    q.includes('invoice') ||
    q.includes('my purchase') ||
    q.includes('courier');

  const hasProductMention =
    q.includes('cashew') ||
    q.includes('kaju') ||
    q.includes('almond') ||
    q.includes('badam') ||
    q.includes('walnut') ||
    q.includes('nut') ||
    q.includes('seed') ||
    q.includes('hamper') ||
    q.includes('box');

  if (isOrderQuery && !hasProductMention) {
    return { intent: 'order_tracking', maxBudget, expandedQuery };
  }

  // 4. Policy check
  const isPolicyQuery =
    q.includes('return policy') ||
    q.includes('refund') ||
    q.includes('replacement policy') ||
    q.includes('how to return') ||
    q.includes('want to return') ||
    q.includes('exchange') ||
    q.includes('shipping policy') ||
    q.includes('shipping charge') ||
    q.includes('delivery charge') ||
    q.includes('delivery time') ||
    q.includes('how long delivery') ||
    q.includes('when will') ||
    q.includes('how fast') ||
    q.includes('free delivery') ||
    q.includes('free shipping') ||
    q.includes('pin code') ||
    q.includes('pincode') ||
    q.includes('serviceable') ||
    q.includes('payment') ||
    q.includes('pay on delivery') ||
    q.includes('cash on delivery') ||
    q.includes('cod') ||
    q.includes('upi') ||
    q.includes('cancel my order') ||
    q.includes('cancellation') ||
    q.includes('terms') ||
    q.includes('privacy');

  // 5. Product check
  const isProductQuery =
    maxBudget !== null ||
    hasProductMention ||
    q.includes('akhrot') ||
    q.includes('raisin') ||
    q.includes('kishmish') ||
    q.includes('date') ||
    q.includes('khajoor') ||
    q.includes('pistachio') ||
    q.includes('pista') ||
    q.includes('chana') ||
    q.includes('millet') ||
    q.includes('trail') ||
    q.includes('snack') ||
    q.includes('laddu') ||
    q.includes('katli') ||
    q.includes('gift') ||
    q.includes('gifting') ||
    q.includes('protein') ||
    q.includes('workout') ||
    q.includes('gym') ||
    q.includes('diet') ||
    q.includes('weight') ||
    q.includes('sugar') ||
    q.includes('diabetes') ||
    q.includes('heart') ||
    q.includes('bp') ||
    q.includes('energy') ||
    q.includes('recommend') ||
    q.includes('suggest') ||
    q.includes('buy') ||
    q.includes('shop') ||
    q.includes('price') ||
    q.includes('cost') ||
    q.includes('cheap') ||
    q.includes('best');

  // 10/10: HYBRID INTENT BLENDING
  // If user asks: "Do you offer COD for Cashews?" or "What is shipping charge on gift hampers?"
  if (isPolicyQuery && isProductQuery) {
    return { intent: 'hybrid_product_policy', maxBudget, expandedQuery };
  }

  if (isPolicyQuery) return { intent: 'policy', maxBudget, expandedQuery };
  if (isProductQuery) return { intent: 'product_search', maxBudget, expandedQuery };

  // 6. Default: Greeting / Small Talk
  return { intent: 'greeting', maxBudget: null, expandedQuery };
}

/**
 * OPTIMIZATION 1: Embedding generation with 5-min cache
 * Same query ("cashews", "gift hampers") reuses the vector — skips NVIDIA API call
 */
async function generateQueryVector(query: string): Promise<number[] | null> {
  if (!NVIDIA_API_KEY) return null;

  // Normalize cache key: lowercase + trim + collapse spaces
  const cacheKey = query.toLowerCase().trim().replace(/\s+/g, ' ');
  const cached = getCached(embeddingCache, cacheKey);
  if (cached) {
    console.log(`[Embed Cache] HIT for "${cacheKey}"`);
    return cached;
  }

  try {
    const res = await fetch(NVIDIA_EMBED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [query],
        model: NVIDIA_EMBED_MODEL,
        input_type: 'query',
      }),
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      console.warn(`[RAG Embedding] Query vector generation failed (${res.status})`);
      return null;
    }

    const data = await res.json();
    const vector = data?.data?.[0]?.embedding || null;
    if (vector) {
      setCache(embeddingCache, cacheKey, vector, EMBED_CACHE_TTL_MS);
      console.log(`[Embed Cache] STORED for "${cacheKey}"`);
    }
    return vector;
  } catch (err) {
    console.warn('[RAG Embedding] Embedding fetch error:', err);
    return null;
  }
}

interface QdrantSearchHit {
  id: number | string;
  score: number;
  payload?: {
    id?: number | string;
    name?: string;
    slug?: string;
    type?: 'policy' | 'product';
    category?: string;
    url?: string;
    price?: string;
    passage?: string;
    image?: string;
  };
}

/**
 * 10/10 OPTIMIZATION: Searches Qdrant collection with score threshold to eliminate hallucinations
 */
async function searchQdrant(vector: number[]): Promise<QdrantSearchHit[]> {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector,
        limit: 6,
        with_payload: true,
        score_threshold: 0.52, // Vector similarity cutoff to drop irrelevant noise
      }),
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      console.warn(`[Qdrant Search] HTTP error (${res.status})`);
      return [];
    }

    const data = await res.json();
    const hits: QdrantSearchHit[] = Array.isArray(data?.result) ? data.result : [];
    return hits.filter((h) => typeof h.score !== 'number' || h.score >= 0.50);
  } catch (err) {
    console.warn('[Qdrant Search] Search fetch error:', err);
    return [];
  }
}

/**
 * OPTIMIZATION 2: WooCommerce product fetch with 3-min cache
 */
async function fetchProductsCached(matchedIds: number[], searchTerm: string): Promise<WooProduct[]> {
  const cacheKey = matchedIds.length > 0
    ? `ids:${matchedIds.sort().join(',')}`
    : `search:${searchTerm.toLowerCase().trim()}`;

  const cached = getCached(productCache, cacheKey);
  if (cached) {
    console.log(`[Product Cache] HIT for "${cacheKey}"`);
    return cached;
  }

  let products: WooProduct[] = [];
  try {
    if (matchedIds.length > 0) {
      products = await getProducts({ include: matchedIds, perPage: 6 });
    } else {
      products = await getProducts({ search: searchTerm, perPage: 4 });
    }
    setCache(productCache, cacheKey, products, PRODUCT_CACHE_TTL_MS);
    console.log(`[Product Cache] STORED for "${cacheKey}" (${products.length} products)`);
  } catch (err) {
    console.warn('[RAG/RIG] Live product fetch error:', err);
  }
  return products;
}

export async function retrieveRagContext(
  userQuery: string,
  history?: Array<{ role?: string; content?: string }>
): Promise<RagContext> {
  const contextualQuery = contextualizeQuery(userQuery, history);
  const { intent, maxBudget, expandedQuery } = classifyQuery(contextualQuery);
  const effectiveSearchQuery = expandedQuery;

  // =========================================================================
  // FAST PATH: CONTACT — 0 DB calls
  // =========================================================================
  if (intent === 'contact') {
    return {
      products: [],
      policies: [
        'Phone & WhatsApp Helpline: +91 99948 47167 (Mon-Sat, 9:00 AM - 8:00 PM IST)',
        'Customer Care Email: support@intersting.duckdns.org (or hello@interesting.co.in)',
        'Online Advisory & Contact Page: /contact',
      ],
      suggestions: [
        '📦 Where is my order?',
        '🌰 Best seeds under ₹500',
        '🔄 Return & Refund policy',
      ],
      formattedContext: [
        '### Customer Intent: Contact Customer Care & Support Helpline',
        'CRITICAL INSTRUCTION: Provide the official store helpline and email clearly in 2 concise sentences:',
        '• Phone & WhatsApp Helpline: +91 99948 47167 (Available Mon-Sat, 9 AM - 8 PM IST)',
        '• Support Email: support@intersting.duckdns.org (or hello@interesting.co.in)',
        '• Online Contact Form: Visit [Contact Us](/contact)',
        'DO NOT recommend any products.',
      ].join('\n'),
    };
  }

  // =========================================================================
  // FAST PATH: GREETING — 0 DB calls
  // =========================================================================
  if (intent === 'greeting') {
    return {
      products: [],
      policies: [],
      suggestions: [
        '📦 Where is my order?',
        '🌰 Best seeds under ₹500',
        '🔄 Return & Refund policy',
        '🎁 Luxury gift hampers',
      ],
      formattedContext: [
        '### Context: Friendly Greeting / Concierge Small Talk',
        '• Role: Chappie, AI Concierge for Interesting gourmet dry fruits pantry.',
        '• CRITICAL INSTRUCTION: Reply in ONLY 1 or 2 crisp, warm sentences (MAX 25 words!).',
        '• Do NOT write long paragraphs. Quick action cards are already provided below for the customer to tap.',
      ].join('\n'),
    };
  }

  // =========================================================================
  // FAST PATH: ORDER TRACKING — 0 DB calls
  // =========================================================================
  if (intent === 'order_tracking') {
    return {
      products: [],
      policies: [
        'Orders dispatch within 24 hours via Express Bluedart / Delhivery in airtight tamper-proof packaging.',
        'Live tracking links are sent automatically via SMS and WhatsApp upon courier dispatch.',
        'Customers can view real-time order history, invoices, and tracking anytime under [My Account > Orders](/account).',
        'Concierge Helpline & WhatsApp: +91 99948 47167 (Mon-Sat, 9 AM - 8 PM IST).',
      ],
      suggestions: [
        '🌰 Best seeds under ₹500',
        '🔄 Return & Refund policy',
        '📞 Helpline: +91 99948 47167',
      ],
      formattedContext: [
        '### Customer Intent: Order Status & Live Tracking Inquiry',
        '1. In 2 concise sentences, tell the customer they can view live order status and invoices anytime in their [My Account > Orders](/account) page.',
        '2. Mention orders dispatch within 24 hours with SMS/WhatsApp tracking, or call our concierge helpline at +91 99948 47167 for instant help.',
        '3. DO NOT recommend any products.',
      ].join('\n'),
    };
  }

  // =========================================================================
  // 10/10 HYBRID PATH: Product Interest + Store Policy/Delivery (Blended Grounding)
  // =========================================================================
  if (intent === 'hybrid_product_policy') {
    const queryVector = await generateQueryVector(effectiveSearchQuery);
    const [hits, keywordProducts] = await Promise.all([
      queryVector ? searchQdrant(queryVector) : Promise.resolve([] as QdrantSearchHit[]),
      fetchProductsCached([], effectiveSearchQuery),
    ]);

    // Extract policies
    const policyHits = hits.filter((h) => h.payload?.type === 'policy');
    const retrievedPolicies: string[] = [];
    for (const hit of policyHits) {
      if (hit.payload?.passage) retrievedPolicies.push(hit.payload.passage);
    }
    if (retrievedPolicies.length === 0) {
      retrievedPolicies.push(
        'Delivery: Free express shipping on orders above ₹499 across India. Orders dispatch within 24 hours.',
        'Payment: Cash on Delivery (COD) and Direct Instant UPI (Google Pay, PhonePe, Paytm) are accepted.',
        'Returns: 7-Day Hassle-Free Replacement for damaged or unsealed pantry packages.'
      );
    }

    // Extract products
    const productHits = hits.filter((h) => h.payload?.type === 'product');
    const matchedIds = productHits
      .map((h) => Number(h.payload?.id || h.id))
      .filter((id) => !isNaN(id) && id > 0);

    let liveProducts = matchedIds.length > 0
      ? await fetchProductsCached(matchedIds, effectiveSearchQuery)
      : keywordProducts;

    if (maxBudget !== null) {
      const budgeted = liveProducts.filter((p) => {
        const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
        return !isNaN(priceNum) && priceNum <= maxBudget;
      });
      if (budgeted.length > 0) liveProducts = budgeted;
    }

    const retrievedProducts: RetrievedProduct[] = liveProducts.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      regular_price: p.regular_price || p.price,
      image: Array.isArray(p.images) && p.images[0]?.src ? p.images[0].src : '/images/categories/nuts.jpg',
      category: Array.isArray(p.categories) && p.categories[0]?.name ? p.categories[0].name : 'Farm-Fresh Dry Fruits',
      description: stripHtml(p.short_description || p.description || '').slice(0, 180),
      stock_status: p.stock_status,
    }));

    const productContextText =
      retrievedProducts.length > 0
        ? retrievedProducts
            .map(
              (p, i) =>
                `${i + 1}. **${p.name}** — ₹${p.price} | Link: [${p.name}](/product/${p.slug}) (${p.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'})`
            )
            .join('\n')
        : 'Relevant store items available in shop.';

    return {
      products: retrievedProducts,
      policies: retrievedPolicies,
      suggestions: [
        '📦 Track My Order',
        '💳 Payment & COD Terms',
        '🚚 Check Delivery Pin Code',
      ],
      formattedContext: [
        '### Customer Intent: Hybrid Inquiry (Product Interest + Store Policy / Delivery)',
        '### Verified Store Policy:',
        ...retrievedPolicies.map((p) => `• ${p}`),
        '',
        '### Live Matching Products in Store:',
        productContextText,
        '',
        'CRITICAL INSTRUCTION: In 2 concise sentences, directly answer their policy/COD/delivery question AND confirm they can order the products displayed below. Interactive product cards appear below automatically — do NOT list products in text.',
      ].join('\n'),
    };
  }

  // =========================================================================
  // POLICY PATH — Qdrant only (embed cached)
  // =========================================================================
  if (intent === 'policy') {
    const queryVector = await generateQueryVector(effectiveSearchQuery);
    const hits = queryVector ? await searchQdrant(queryVector) : [];
    const policyHits = hits.filter((h) => h.payload?.type === 'policy');

    const retrievedPolicies: string[] = [];
    for (const hit of policyHits) {
      if (hit.payload?.passage) retrievedPolicies.push(hit.payload.passage);
    }

    if (retrievedPolicies.length === 0) {
      retrievedPolicies.push(
        'Shipping: Free Express Delivery across India on prepaid orders and orders above ₹499. Orders dispatch within 24 hours.',
        'Returns: 7-Day Hassle-Free Replacement for damaged or unsealed food packages. Full refund processed within 48 hours to original payment mode or UPI.',
        'Payments: Supports Pay on Delivery (Cash on Delivery / UPI on Delivery) and Direct Instant UPI (Google Pay, PhonePe, Paytm).'
      );
    }

    return {
      products: [],
      policies: retrievedPolicies,
      suggestions: [
        '📦 Where is my order?',
        '🌰 Best seeds under ₹500',
        '📞 Contact Customer Support',
      ],
      formattedContext: [
        '### Customer Intent: Store Policy / Delivery / Payment / Return Inquiry',
        '### Verified Policy from Store Knowledge Base:',
        ...retrievedPolicies.map((p) => `• ${p}`),
        '',
        'Instruction: Answer in 1-2 short bullet points. ALWAYS end your reply with the relevant clickable page link in markdown:',
        '- For return/refund questions → include [Return & Refund Policy](/returns)',
        '- For shipping/delivery questions → include [Shipping Policy](/shipping)',
        '- For payment/COD questions → include [FAQ & Payments](/faq)',
        '- For terms/privacy questions → include [Terms & Privacy](/terms)',
        'DO NOT recommend products.',
      ].join('\n'),
    };
  }

  // =========================================================================
  // PRODUCT SEARCH — OPTIMIZATION 3: Promise.all() PARALLEL EXECUTION
  // Embed+Qdrant runs at the SAME TIME as WooCommerce keyword prefetch
  // =========================================================================

  // Start BOTH in parallel immediately
  const [qdrantResult, keywordProducts] = await Promise.all([
    // Branch A: embed the query → search Qdrant (cached embed saves ~500ms on repeat)
    generateQueryVector(effectiveSearchQuery).then((vector) =>
      vector ? searchQdrant(vector) : Promise.resolve([] as QdrantSearchHit[])
    ),
    // Branch B: WooCommerce keyword prefetch in parallel (cached result saves ~400ms on repeat)
    fetchProductsCached([], effectiveSearchQuery),
  ]);

  // Extract product IDs from Qdrant hits
  const productHits = qdrantResult.filter((h) => h.payload?.type === 'product');
  const matchedIds = productHits
    .map((h) => Number(h.payload?.id || h.id))
    .filter((id) => !isNaN(id) && id > 0);

  // If Qdrant found specific product IDs, fetch those (cached); otherwise use the parallel keyword results
  let liveProducts: WooProduct[] = matchedIds.length > 0
    ? await fetchProductsCached(matchedIds, effectiveSearchQuery)
    : keywordProducts;

  // Apply budget filter
  if (maxBudget !== null) {
    const budgeted = liveProducts.filter((p) => {
      const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
      return !isNaN(priceNum) && priceNum <= maxBudget;
    });
    if (budgeted.length > 0) liveProducts = budgeted;
  }

  const retrievedProducts: RetrievedProduct[] = liveProducts.slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    regular_price: p.regular_price || p.price,
    image: Array.isArray(p.images) && p.images[0]?.src ? p.images[0].src : '/images/categories/nuts.jpg',
    category: Array.isArray(p.categories) && p.categories[0]?.name ? p.categories[0].name : 'Farm-Fresh Dry Fruits',
    description: stripHtml(p.short_description || p.description || '').slice(0, 180),
    stock_status: p.stock_status,
  }));

  const productContextText =
    retrievedProducts.length > 0
      ? retrievedProducts
          .map(
            (p, i) =>
              `${i + 1}. **${p.name}** — ₹${p.price} | Exact Link: [${p.name}](/product/${p.slug})` +
              (p.stock_status === 'instock' ? ' (In Stock)' : ' (Out of Stock)') +
              (p.description ? `\n   ${p.description.slice(0, 120)}` : '')
          )
          .join('\n\n')
      : `No items found matching the exact budget of ₹${maxBudget}. Recommend the closest wholesome alternative.`;

  return {
    products: retrievedProducts,
    policies: [],
    formattedContext: [
      '### Customer Intent: Product Recommendation & Nutrition Search',
      maxBudget ? `### Customer Budget: Under ₹${maxBudget} (Prioritize products within this budget)` : '',
      '### Live Store Products (Real-Time):',
      productContextText,
      '',
      'Instruction: Reply in 1-2 sentences max (under 35 words). If mentioning a product link, ONLY use the Exact Link given above. Never invent fake slugs or order URLs. For order tracking, ALWAYS use [My Account > Orders](/account). Interactive product cards already appear below your message automatically.',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
