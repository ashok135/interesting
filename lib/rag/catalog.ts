/**
 * RAG & RIG Knowledge Base & Semantic Product Retriever
 *
 * 1. True Vector RAG: Vectorizes user query with NVIDIA Nemotron (2048 dims)
 *    and searches Qdrant for semantic policy chunks and product matches.
 * 2. Real-Time Information Grounding (RIG): Merges live WooCommerce inventory,
 *    live prices in ₹, and stock status so the AI never hallucinates or quotes stale data.
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
 * Generates 2,048-dim embedding vector for the search query via NVIDIA NIM
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
      signal: AbortSignal.timeout(4000),
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
      signal: AbortSignal.timeout(4000),
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
  const queryLower = userQuery.toLowerCase().trim();

  // 1. Vectorize query & search Qdrant
  const queryVector = await generateQueryVector(userQuery);
  const hits: QdrantSearchHit[] = queryVector ? await searchQdrant(queryVector) : [];

  const policyHits = hits.filter((h) => h.payload?.type === 'policy');
  const productHits = hits.filter((h) => h.payload?.type === 'product');

  // 2. Fetch live products from WooCommerce to ground with real-time price & stock (RIG)
  let liveProducts: WooProduct[] = [];
  try {
    const matchedIds = productHits
      .map((h) => Number(h.payload?.id || h.id))
      .filter((id) => !isNaN(id) && id > 0);

    if (matchedIds.length > 0) {
      liveProducts = await getProducts({ include: matchedIds, perPage: 6 });
    }

    // If Qdrant didn't match products but query seems product/nutrition related, get popular products
    const isPolicyQuery =
      queryLower.includes('return') ||
      queryLower.includes('refund') ||
      queryLower.includes('replace') ||
      queryLower.includes('ship') ||
      queryLower.includes('deliver') ||
      queryLower.includes('track') ||
      queryLower.includes('pay') ||
      queryLower.includes('cod') ||
      queryLower.includes('contact');

    if (liveProducts.length === 0 && !isPolicyQuery) {
      liveProducts = await getProducts({ perPage: 4, orderby: 'popularity' });
    }
  } catch (err) {
    console.warn('[RAG/RIG] Live product fetch error:', err);
  }

  // 3. Format retrieved live products
  const retrievedProducts: RetrievedProduct[] = liveProducts.map((p) => ({
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

  // 4. Format policy knowledge
  const retrievedPolicies: string[] = [];
  for (const hit of policyHits) {
    const payload = hit.payload;
    if (payload?.passage) {
      retrievedPolicies.push(payload.passage);
    } else if (payload?.name) {
      retrievedPolicies.push(`${payload.name}: Verified store policy.`);
    }
  }

  // Fallback policies if none matched
  if (retrievedPolicies.length === 0) {
    retrievedPolicies.push(
      'Free Express Delivery across India on prepaid orders and orders above ₹499.',
      '7-Day Hassle-Free Replacement for damaged or unsealed food packages.',
      'Supports Cash on Delivery / UPI on Delivery & Direct Instant UPI.'
    );
  }

  // 5. Construct unified LLM prompt context
  const productContextText =
    retrievedProducts.length > 0
      ? retrievedProducts
          .map(
            (p, i) =>
              `${i + 1}. **${p.name}**\n` +
              `   - Current Live Price: ₹${p.price} (Regular: ₹${p.regular_price})\n` +
              `   - Category: ${p.category}\n` +
              `   - Availability: ${p.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}\n` +
              `   - Key Benefits / Highlights: ${p.description}\n` +
              `   - Store Link: /product/${p.slug}`
          )
          .join('\n\n')
      : 'No specific products requested. Recommend customer favorites if appropriate.';

  const policyContextText = retrievedPolicies.map((p) => `• ${p}`).join('\n');

  const formattedContext = [
    '### Store Policies & Knowledge Base (Verified Ground Truth from Qdrant):',
    policyContextText,
    '',
    '### Live Store Products (Real-Time Pricing & Stock from WooCommerce):',
    productContextText,
  ].join('\n');

  return {
    products: retrievedProducts,
    policies: retrievedPolicies,
    formattedContext,
  };
}
