/**
 * Smart RAG & RIG Engine with Intent-Based Query Routing
 *
 * 1. Intent Router:
 *    - GREETING: Bypasses Vector DB & WooCommerce completely (Instant reply in ~1s, 0 cards).
 *    - ORDER TRACKING: Bypasses Vector DB, gives /account & helpline (Fast, 0 cards).
 *    - STORE POLICY: Searches Qdrant for policy chunks only (0 cards).
 *    - PRODUCT SEARCH: Searches Qdrant for products + applies budget filters (e.g. "under 500").
 *      Returns rich product cards ONLY when the customer asks for products!
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

export type QueryIntent = 'contact' | 'order_tracking' | 'policy' | 'product_search' | 'greeting';

interface QueryClassification {
  intent: QueryIntent;
  maxBudget: number | null;
}

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

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
 * Classifies customer query using priority intent hierarchy
 */
function classifyQuery(userQuery: string): QueryClassification {
  const q = userQuery.toLowerCase().trim();

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

  if (isContactQuery) {
    return { intent: 'contact', maxBudget };
  }

  // 3. Priority 2: Order tracking / account status
  const isOrderQuery =
    q.includes('order') ||
    q.includes('track') ||
    q.includes('tracking') ||
    q.includes('invoice') ||
    q.includes('my purchase') ||
    q.includes('courier');

  if (isOrderQuery) {
    return { intent: 'order_tracking', maxBudget };
  }

  // 4. Priority 3: Store Policies (Returns, Shipping, Payment, PIN code)
  const isPolicyQuery =
    q.includes('return') ||
    q.includes('refund') ||
    q.includes('replace') ||
    q.includes('replacement') ||
    q.includes('ship') ||
    q.includes('shipping') ||
    q.includes('deliver') ||
    q.includes('delivery') ||
    q.includes('pin code') ||
    q.includes('pincode') ||
    q.includes('payment') ||
    q.includes('pay ') ||
    q.includes('cod') ||
    q.includes('upi') ||
    q.includes('cash on delivery') ||
    q.includes('cancel') ||
    q.includes('cancellation');

  if (isPolicyQuery) {
    return { intent: 'policy', maxBudget };
  }

  // 4. Priority 3: Product Search / Nutrition / Food Recommendation
  const isProductQuery =
    maxBudget !== null ||
    q.includes('seed') ||
    q.includes('nut') ||
    q.includes('cashew') ||
    q.includes('kaju') ||
    q.includes('almond') ||
    q.includes('badam') ||
    q.includes('walnut') ||
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
    q.includes('hamper') ||
    q.includes('box') ||
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

  if (isProductQuery) {
    return { intent: 'product_search', maxBudget };
  }

  // 5. Default: Pure Greeting / Small Talk
  return { intent: 'greeting', maxBudget: null };
}

/**
 * Generates 2,048-dim embedding vector via NVIDIA NIM
 */
async function generateQueryVector(query: string): Promise<number[] | null> {
  if (!NVIDIA_API_KEY) return null;

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
    return data?.data?.[0]?.embedding || null;
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
 * Searches Qdrant collection for semantic policy & product matches
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
      }),
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      console.warn(`[Qdrant Search] HTTP error (${res.status})`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data?.result) ? data.result : [];
  } catch (err) {
    console.warn('[Qdrant Search] Search fetch error:', err);
    return [];
  }
}

export async function retrieveRagContext(userQuery: string): Promise<RagContext> {
  const { intent, maxBudget } = classifyQuery(userQuery);

  // =========================================================================
  // 1. FAST PATH: CONTACT & CUSTOMER SUPPORT HELPLINE
  // Direct verified phone, WhatsApp, email, hours. Instant reply in ~1s. 0 cards.
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
  // 2. FAST PATH: GREETINGS & SMALL TALK
  // Bypasses Vector DB & WooCommerce completely. Instant reply in ~1s. 0 cards.
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
        '• Role: Tara, AI Concierge for Interesting pantry.',
        '• CRITICAL INSTRUCTION: Reply in ONLY 1 or 2 crisp, warm sentences (MAX 25 words!). Example: "Hello! 🌿 Welcome to Interesting. I am Tara, your wellness concierge. How may I assist you today?"',
        '• Do NOT write long paragraphs. Quick action cards are already provided below for the customer to tap.',
      ].join('\n'),
    };
  }

  // =========================================================================
  // 2. FAST PATH: ORDER TRACKING & ACCOUNT INQUIRIES
  // Bypasses Vector DB & WooCommerce. Direct accurate guidance. 0 cards.
  // =========================================================================
  if (intent === 'order_tracking') {
    return {
      products: [],
      policies: [
        'Orders dispatch within 24 hours via Express Bluedart / Delhivery in airtight tamper-proof packaging.',
        'Live tracking links are sent automatically via SMS and WhatsApp upon courier dispatch.',
        'Customers can view real-time order history, invoices, and tracking anytime under [My Account > Orders](/account).',
        'Concierge Helpline & WhatsApp: +91 91763 67777 (Mon-Sat, 10 AM - 7 PM) or hello@interesting.co.in.',
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
  // 3. STORE POLICIES (Returns, Shipping, Payment, PIN code, Contact)
  // Searches Qdrant for policy chunks only. ZERO product cards.
  // =========================================================================
  if (intent === 'policy') {
    const queryVector = await generateQueryVector(userQuery);
    const hits = queryVector ? await searchQdrant(queryVector) : [];
    const policyHits = hits.filter((h) => h.payload?.type === 'policy');

    const retrievedPolicies: string[] = [];
    for (const hit of policyHits) {
      if (hit.payload?.passage) {
        retrievedPolicies.push(hit.payload.passage);
      }
    }

    if (retrievedPolicies.length === 0) {
      retrievedPolicies.push(
        'Shipping: Free Express Delivery across India on prepaid orders and orders above ₹499. Orders dispatch within 24 hours.',
        'Returns: 7-Day Hassle-Free Replacement for damaged or unsealed food packages. Full refund processed within 48 hours to original payment mode or UPI.',
        'Payments: Supports Pay on Delivery (Cash on Delivery / UPI on Delivery) and Direct Instant UPI (Google Pay, PhonePe, Paytm).'
      );
    }

    return {
      products: [], // Zero product cards for policy queries!
      policies: retrievedPolicies,
      suggestions: [
        '📦 Where is my order?',
        '🌰 Best seeds under ₹500',
        '📞 Contact Customer Support',
      ],
      formattedContext: [
        '### Customer Intent: Store Policy / Delivery / Payment / Return Inquiry',
        '### Store Policies & Knowledge (Verified Direct Ground Truth from Qdrant):',
        ...retrievedPolicies.map((p) => `• ${p}`),
        '',
        'Instruction: Answer concisely in 2-3 short bullet points based on the policies above. Keep words brief and neat. DO NOT recommend products.',
      ].join('\n'),
    };
  }

  // =========================================================================
  // 4. PRODUCT RECOMMENDATIONS & NUTRITION SEARCH
  // Searches Qdrant for products, applies budget filters, attaches cards!
  // =========================================================================
  const queryVector = await generateQueryVector(userQuery);
  const hits = queryVector ? await searchQdrant(queryVector) : [];
  const productHits = hits.filter((h) => h.payload?.type === 'product');

  const matchedIds = productHits
    .map((h) => Number(h.payload?.id || h.id))
    .filter((id) => !isNaN(id) && id > 0);

  let liveProducts: WooProduct[] = [];
  try {
    if (matchedIds.length > 0) {
      liveProducts = await getProducts({ include: matchedIds, perPage: 6 });
    } else {
      liveProducts = await getProducts({ search: userQuery, perPage: 4 });
    }
  } catch (err) {
    console.warn('[RAG/RIG] Live product fetch error:', err);
  }

  // Apply budget filter if customer requested (e.g. "under 500")
  if (maxBudget !== null) {
    const budgeted = liveProducts.filter((p) => {
      const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
      return !isNaN(priceNum) && priceNum <= maxBudget;
    });
    if (budgeted.length > 0) {
      liveProducts = budgeted;
    }
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
              `${i + 1}. **${p.name}**\n` +
              `   - Current Live Price: ₹${p.price} (Regular: ₹${p.regular_price})\n` +
              `   - Category: ${p.category}\n` +
              `   - Availability: ${p.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}\n` +
              `   - Health Benefits / Highlights: ${p.description}\n` +
              `   - Store Link: /product/${p.slug}`
          )
          .join('\n\n')
      : `No items found matching the exact budget of ₹${maxBudget}. Recommend the closest wholesome alternative.`;

  return {
    products: retrievedProducts, // Product cards shown ONLY here!
    policies: [],
    formattedContext: [
      '### Customer Intent: Product Recommendation & Nutrition Search',
      maxBudget ? `### Customer Budget: Under ₹${maxBudget} (Prioritize products within this budget)` : '',
      '### Live Store Products from Interesting (Real-Time In-Stock):',
      productContextText,
      '',
      'Instruction: In ONLY 1 or 2 short sentences (under 40 words!), recommend the top matching item(s) with price in ₹ and key benefit. Visual cards appear below, so keep text response very brief and direct!',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
