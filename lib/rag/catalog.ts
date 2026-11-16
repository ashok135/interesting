/**
 * RAG Knowledge Base & Semantic Product Retriever
 * Fetches live catalog from WooCommerce, scores query relevance, and builds prompt context.
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

const STORE_POLICIES = [
  'Shipping: Free Express Delivery across India on all prepaid orders and orders above ₹499. Orders dispatch within 24 hours in airtight packaging.',
  'Returns: 7-Day Hassle-Free Replacement/Return for damaged or unsealed packages. Freshness and vacuum seal guaranteed.',
  'Payments: Supports Pay on Delivery (Cash on Delivery / UPI on Delivery) and Direct Instant UPI (Google Pay, PhonePe, Paytm).',
  'Purity Guarantee: 100% natural, farm-sourced, lab-tested, zero artificial preservatives, nitrogen-flushed gold airtight containers.',
];

// Semantic keyword dictionary for health goals and user intents
const INTENT_KEYWORD_MAP: Record<string, string[]> = {
  protein: ['almond', 'chia', 'pumpkin', 'chana', 'trail', 'walnut'],
  workout: ['trail', 'almond', 'pumpkin', 'chia', 'chana'],
  gym: ['trail', 'almond', 'pumpkin', 'chia', 'chana'],
  diabetes: ['chia', 'pumpkin', 'walnut', 'almond'],
  sugar: ['chia', 'pumpkin', 'walnut', 'almond'],
  heart: ['walnut', 'almond', 'chia', 'pistachio'],
  bp: ['walnut', 'almond', 'chia', 'pumpkin'],
  brain: ['walnut', 'almond', 'chia'],
  weight: ['chia', 'pumpkin', 'trail', 'millet'],
  diet: ['chia', 'pumpkin', 'trail', 'millet'],
  gift: ['hamper', 'box', 'casket', 'celebration', 'keepsake'],
  hampers: ['hamper', 'box', 'casket', 'celebration', 'keepsake'],
  diwali: ['hamper', 'box', 'casket', 'celebration', 'katli'],
  sweet: ['katli', 'laddu', 'chikki', 'dates', 'raisins'],
  dessert: ['katli', 'laddu', 'chikki', 'dates'],
  snack: ['chana', 'crisp', 'roasted', 'trail', 'millet', 'pistachio'],
  roasted: ['chana', 'crisp', 'pistachio', 'almond'],
};

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

function parsePrice(p: string | number | undefined): number {
  if (typeof p === 'number') return p;
  if (!p) return 0;
  const num = parseFloat(String(p).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

export async function retrieveRagContext(userQuery: string): Promise<RagContext> {
  const queryLower = userQuery.toLowerCase();
  const queryTokens = queryLower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  // Check budget constraints in query (e.g., "under 500", "under 1000", "below 1500")
  let maxBudget: number | null = null;
  const budgetMatch = queryLower.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // 1. Fetch live products from WooCommerce
  let allProducts: WooProduct[] = [];
  try {
    allProducts = await getProducts({ perPage: 100 });
  } catch (err) {
    console.error('RAG product fetch error:', err);
    allProducts = [];
  }

  // 2. Score each product based on query tokens & semantic intents
  const scoredProducts = allProducts.map((p) => {
    let score = 0;
    const nameLower = (p.name || '').toLowerCase();
    const descLower = stripHtml(p.short_description || p.description || '').toLowerCase();
    const catLower = (Array.isArray(p.categories) ? p.categories.map((c) => c.name).join(' ') : '').toLowerCase();
    const combined = `${nameLower} ${catLower} ${descLower}`;
    const priceNum = parsePrice(p.price);

    // Direct token matches
    for (const token of queryTokens) {
      if (nameLower.includes(token)) score += 10;
      if (catLower.includes(token)) score += 6;
      if (descLower.includes(token)) score += 3;
    }

    // Semantic intent expansions
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORD_MAP)) {
      if (queryTokens.includes(intent) || queryLower.includes(intent)) {
        for (const kw of keywords) {
          if (combined.includes(kw)) {
            score += 8;
          }
        }
      }
    }

    // Budget filtering / weighting
    if (maxBudget !== null) {
      if (priceNum > 0 && priceNum <= maxBudget) {
        score += 15; // prioritize products within budget
      } else if (priceNum > maxBudget) {
        score -= 20; // penalize products over budget
      }
    }

    // In-stock preference
    if (p.stock_status === 'instock') {
      score += 2;
    } else {
      score -= 5;
    }

    return { product: p, score };
  });

  // Sort descending by relevance score
  scoredProducts.sort((a, b) => b.score - a.score);

  // Take top 4 relevant items (if scores > 0, else top featured/best sellers)
  let topMatches = scoredProducts.filter((item) => item.score > 0).slice(0, 4);
  if (topMatches.length === 0) {
    topMatches = scoredProducts.slice(0, 3);
  }

  const retrievedProducts: RetrievedProduct[] = topMatches.map(({ product: p }) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    regular_price: p.regular_price || p.price,
    image: Array.isArray(p.images) && p.images[0]?.src ? p.images[0].src : '/images/categories/nuts.jpg',
    category: Array.isArray(p.categories) && p.categories[0]?.name ? p.categories[0].name : 'Dry Fruits & Seeds',
    description: stripHtml(p.short_description || p.description || '').slice(0, 180),
    stock_status: p.stock_status,
  }));

  // Match relevant store policies if mentioned
  const relevantPolicies = STORE_POLICIES.filter((policy) => {
    if (queryLower.includes('return') || queryLower.includes('refund') || queryLower.includes('replace')) {
      return policy.includes('Returns');
    }
    if (queryLower.includes('ship') || queryLower.includes('deliver') || queryLower.includes('track') || queryLower.includes('when')) {
      return policy.includes('Shipping');
    }
    if (queryLower.includes('cod') || queryLower.includes('pay') || queryLower.includes('upi') || queryLower.includes('cash')) {
      return policy.includes('Payments');
    }
    if (queryLower.includes('purity') || queryLower.includes('quality') || queryLower.includes('organic') || queryLower.includes('fresh')) {
      return policy.includes('Purity');
    }
    return false;
  });

  // Build clean text knowledge context for LLM prompt
  const productContextText = retrievedProducts
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}**\n` +
        `   - Price: ₹${p.price} (Regular: ₹${p.regular_price})\n` +
        `   - Category: ${p.category}\n` +
        `   - Status: ${p.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}\n` +
        `   - Highlights: ${p.description}\n` +
        `   - URL: /product/${p.slug}`
    )
    .join('\n\n');

  const policyContextText =
    relevantPolicies.length > 0
      ? `\n\n### Store Policies & Delivery Info:\n${relevantPolicies.join('\n')}`
      : `\n\n### Store Guarantee:\nFree Express Shipping on orders over ₹499. Vacuum-sealed farm-fresh guarantee.`;

  const formattedContext = `### Live Store Products from Interesting:\n${productContextText}${policyContextText}`;

  return {
    products: retrievedProducts,
    policies: relevantPolicies,
    formattedContext,
  };
}
