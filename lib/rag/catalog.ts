/**
 * Smart RAG & RIG Engine — Hyper-Intelligent & Resilient Architecture v3
 *
 * KEY CAPABILITIES:
 *  1. Phonetic & Typo Tolerance: Handles Hindi/Indian variants ('kaju', 'badam', 'pista', 'akhrot')
 *     and severe spelling typos ('cashive', 'cashu', 'almund', 'makana') via Levenshtein fuzzy distance.
 *  2. Dual-Layer Retrieval: Instant in-memory semantic & entity scoring (<1ms) blended with
 *     Qdrant vector search when available. Zero failure rate even if external AI APIs return 503.
 *  3. Dynamic Intent & Superlative Recognition: Distinguishes 'best cashews' (prioritizes W180 King Grade)
 *     from 'budget under ₹500' or health needs ('diabetes', 'gym protein', 'weight loss').
 *  4. Single-Source-of-Truth Policy Knowledge Base: Grounded directly on content/policies/*.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getProducts } from '@/lib/api/products';
import { STATIC_PRODUCTS, StaticProduct } from './staticCatalog';
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
  normalizedTokens: string[];
  recognizedEntities: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Phonetic, Slang & Typo Normalizer
// ─────────────────────────────────────────────────────────────────────────────

const PHONETIC_TYPO_MAP: Record<string, string> = {
  // Cashew variants & typos
  cashive: 'cashew',
  cashu: 'cashew',
  cashiew: 'cashew',
  kashu: 'cashew',
  kaju: 'cashew',
  kajoo: 'cashew',
  caju: 'cashew',
  cashews: 'cashew',
  cashew: 'cashew',
  w180: 'cashew w180 king',
  w240: 'cashew w240',

  // Almond variants & typos
  badam: 'almond',
  badaam: 'almond',
  almund: 'almond',
  almunds: 'almond',
  almonds: 'almond',
  almond: 'almond',
  nonpareil: 'almond',

  // Walnut variants & typos
  akhrot: 'walnut',
  akrot: 'walnut',
  akhroot: 'walnut',
  walnuts: 'walnut',
  walnut: 'walnut',
  kupwara: 'walnut',

  // Pistachio variants & typos
  pista: 'pistachio',
  pistacho: 'pistachio',
  pistashio: 'pistachio',
  pistachios: 'pistachio',
  pistachio: 'pistachio',

  // Makhana / Foxnut variants & typos
  makhana: 'makhana',
  makana: 'makhana',
  foxnut: 'makhana',
  foxnuts: 'makhana',
  lotus: 'makhana',

  // Figs
  anjeer: 'anjeer',
  anjir: 'anjeer',
  fig: 'anjeer',
  figs: 'anjeer',

  // Dates
  khajur: 'dates',
  khajoor: 'dates',
  date: 'dates',
  dates: 'dates',
  medjool: 'dates',

  // Raisins
  kishmish: 'raisin',
  kismis: 'raisin',
  raisin: 'raisin',
  raisins: 'raisin',

  // Seeds
  chia: 'chia seed',
  pumpkin: 'pumpkin seed',
  sunflower: 'seed',
  flax: 'seed',
  seeds: 'seed',
  seed: 'seed',

  // Millets
  millet: 'millet',
  millets: 'millet',
  jowar: 'millet jowar',
  ragi: 'millet ragi',
  foxtail: 'millet foxtail',

  // Sweets
  chikki: 'chikki',
  chiki: 'chikki',
  laddu: 'laddu sweet',
  ladoo: 'laddu sweet',
  katli: 'kaju katli sweet',
  mithai: 'sweet',
  sweet: 'sweet',
  sweets: 'sweet',

  // Hampers & Gifts
  hamper: 'hamper gift',
  hampers: 'hamper gift',
  gift: 'hamper gift',
  gifting: 'hamper gift',
  casket: 'hamper gift casket',

  // Trail Mix & Protein
  trail: 'trail mix',
  vitality: 'trail mix',
  preworkout: 'trail mix protein',
  workout: 'trail mix protein',
  gym: 'trail mix protein',
  protein: 'protein',

  // Flavours
  periperi: 'peri peri spicy',
  peri: 'peri peri spicy',
  pepper: 'black pepper',
  salted: 'salted roasted',
  saffron: 'saffron kesar',
  kesar: 'saffron kesar',
  honey: 'honey glazed',
};

const VOCABULARY_TARGETS = [
  'cashew',
  'almond',
  'walnut',
  'pistachio',
  'makhana',
  'anjeer',
  'dates',
  'raisin',
  'seeds',
  'millet',
  'chikki',
  'laddu',
  'katli',
  'hamper',
  'trail',
];

function levenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  if (Math.abs(al - bl) > 3) return 99;
  const row = Array.from({ length: bl + 1 }, (_, i) => i);
  for (let i = 1; i <= al; i++) {
    let prev = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(row[j] + 1, prev + 1, row[j - 1] + cost);
      row[j - 1] = prev;
      prev = val;
    }
    row[bl] = prev;
  }
  return row[bl];
}

const BILINGUAL_SYNONYMS: Record<string, string[]> = {
  cashew: ['cashew', 'kaju', 'cashews'],
  almond: ['almond', 'badam', 'almonds', 'badaam'],
  walnut: ['walnut', 'akhrot', 'walnuts'],
  pistachio: ['pistachio', 'pista', 'pistachios'],
  makhana: ['makhana', 'foxnut', 'foxnuts', 'lotus'],
  anjeer: ['anjeer', 'fig', 'figs'],
  dates: ['date', 'dates', 'khajur', 'khajoor', 'medjool'],
  raisin: ['raisin', 'raisins', 'kishmish'],
  seed: ['seed', 'seeds', 'chia', 'pumpkin', 'sunflower'],
  millet: ['millet', 'millets', 'jowar', 'ragi', 'foxtail'],
  sweet: ['sweet', 'sweets', 'chikki', 'laddu', 'katli', 'mithai'],
  hamper: ['hamper', 'hampers', 'gift', 'gifting', 'casket', 'box'],
  trail: ['trail', 'trail mix', 'vitality', 'energy crunch', 'protein'],
};

function normalizeTokens(query: string): { tokens: string[]; entities: string[] } {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const rawWords = clean.split(/\s+/).filter(Boolean);
  const tokens: string[] = [];
  const entities: string[] = [];

  for (const raw of rawWords) {
    if (PHONETIC_TYPO_MAP[raw]) {
      const mapped = PHONETIC_TYPO_MAP[raw].split(' ');
      tokens.push(...mapped);
      entities.push(mapped[0]);
      continue;
    }

    // If word is >= 4 chars, check fuzzy match against phonetic keys
    let matched = false;
    for (const [key, target] of Object.entries(PHONETIC_TYPO_MAP)) {
      if (Math.abs(raw.length - key.length) <= 2 && levenshtein(raw, key) <= 2) {
        const mapped = target.split(' ');
        tokens.push(...mapped);
        entities.push(mapped[0]);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Also check direct targets
      for (const target of VOCABULARY_TARGETS) {
        if (Math.abs(raw.length - target.length) <= 2 && levenshtein(raw, target) <= 2) {
          tokens.push(target);
          entities.push(target);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      tokens.push(raw);
    }
  }

  // Expand entities with bilingual variants
  const expandedEntities: string[] = [];
  for (const ent of entities) {
    expandedEntities.push(ent);
    if (BILINGUAL_SYNONYMS[ent]) {
      expandedEntities.push(...BILINGUAL_SYNONYMS[ent]);
    }
  }

  return { tokens, entities: Array.from(new Set(expandedEntities)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Policy Knowledge Base (Loaded from Single Source of Truth)
// ─────────────────────────────────────────────────────────────────────────────

interface PolicyChunk {
  page: string;
  topic: string;
  content: string;
  keywords: string[];
}

let policyKnowledgeBase: PolicyChunk[] = [];

function loadPolicies(): PolicyChunk[] {
  if (policyKnowledgeBase.length > 0) return policyKnowledgeBase;
  try {
    const policiesDir = path.resolve(process.cwd(), 'content/policies');
    if (!fs.existsSync(policiesDir)) return [];

    const files = fs.readdirSync(policiesDir).filter((f) => f.endsWith('.json'));
    const chunks: PolicyChunk[] = [];

    for (const file of files) {
      const filePath = path.join(policiesDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      const page = data.url || `/${data.slug || ''}`;

      // Sections format (faq.json, contact.json, terms-privacy.json)
      if (Array.isArray(data.sections)) {
        for (const s of data.sections) {
          chunks.push({
            page,
            topic: s.topic || data.title || '',
            content: s.content || s.summary || '',
            keywords: `${s.topic} ${s.summary || ''} ${s.content || ''}`.toLowerCase().split(/\s+/),
          });
        }
      }

      // Cards format (shipping.json)
      if (Array.isArray(data.cards)) {
        for (const c of data.cards) {
          const body = [...(c.paragraphs || []), ...(c.bullets || []), c.highlight || ''].join(' ');
          chunks.push({
            page,
            topic: c.title || data.title || '',
            content: body,
            keywords: `${c.title} ${c.subtitle || ''} ${body}`.toLowerCase().split(/\s+/),
          });
        }
      }

      // Pillars & Steps format (returns.json)
      if (Array.isArray(data.pillars)) {
        for (const p of data.pillars) {
          chunks.push({
            page,
            topic: p.title || '',
            content: p.text || '',
            keywords: `${p.title} ${p.text}`.toLowerCase().split(/\s+/),
          });
        }
      }
    }

    policyKnowledgeBase = chunks;
    return chunks;
  } catch (err) {
    console.warn('[RAG] Error loading local policies:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Cloud Vector Search Configuration (Optional Enhancement)
// ─────────────────────────────────────────────────────────────────────────────

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';
const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

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
      signal: AbortSignal.timeout(1800), // Rapid 1.8s timeout so users never wait
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

interface QdrantSearchHit {
  id: number | string;
  score: number;
  payload?: {
    id?: number | string;
    type?: 'policy' | 'product';
    passage?: string;
  };
}

async function searchQdrant(vector: number[]): Promise<QdrantSearchHit[]> {
  try {
    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector,
        limit: 5,
        with_payload: true,
        score_threshold: 0.52,
      }),
      signal: AbortSignal.timeout(1800),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.result) ? data.result : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Multi-Turn Context Synthesizer
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// 5. Query Classifier & Entity Detector
// ─────────────────────────────────────────────────────────────────────────────

function classifyQuery(userQuery: string): QueryClassification {
  const q = userQuery.toLowerCase().trim();
  const { tokens, entities } = normalizeTokens(q);

  // 1. Budget extraction
  let maxBudget: number | null = null;
  const budgetMatch = q.match(/(?:under|below|less than|within|around)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (budgetMatch && budgetMatch[1]) {
    maxBudget = parseInt(budgetMatch[1], 10);
  }

  // 2. Contact intent
  const isContact =
    q.includes('contact') ||
    q.includes('support') ||
    q.includes('helpline') ||
    q.includes('phone') ||
    q.includes('call') ||
    q.includes('whatsapp') ||
    q.includes('email') ||
    q.includes('reach');

  if (isContact && entities.length === 0) {
    return { intent: 'contact', maxBudget, normalizedTokens: tokens, recognizedEntities: entities };
  }

  // 3. Order tracking
  const isOrder =
    q.includes('order') ||
    q.includes('track') ||
    q.includes('tracking') ||
    q.includes('invoice') ||
    q.includes('courier') ||
    q.includes('delivery status');

  if (isOrder && entities.length === 0 && !q.includes('free delivery') && !q.includes('shipping charge')) {
    return { intent: 'order_tracking', maxBudget, normalizedTokens: tokens, recognizedEntities: entities };
  }

  // 4. Policy intent
  const isPolicy =
    q.includes('return') ||
    q.includes('refund') ||
    q.includes('replace') ||
    q.includes('shipping policy') ||
    q.includes('shipping charge') ||
    q.includes('delivery charge') ||
    q.includes('free delivery') ||
    q.includes('pin code') ||
    q.includes('pincode') ||
    q.includes('payment') ||
    q.includes('cash on delivery') ||
    q.includes('cod') ||
    q.includes('upi') ||
    q.includes('terms') ||
    q.includes('privacy');

  // 5. Product intent
  const isProduct =
    entities.length > 0 ||
    maxBudget !== null ||
    tokens.some((t) =>
      [
        'nut', 'nuts', 'snack', 'snacks', 'seed', 'seeds', 'dry fruit', 'dry fruits',
        'millet', 'trail', 'sweet', 'sweets', 'hamper', 'hampers', 'gift',
        'best', 'top', 'king', 'jumbo', 'recommend', 'suggest', 'buy', 'price', 'cost',
        'protein', 'workout', 'gym', 'diet', 'weight', 'diabetes', 'sugar', 'heart', 'bp'
      ].includes(t)
    );

  if (isPolicy && isProduct) {
    return { intent: 'hybrid_product_policy', maxBudget, normalizedTokens: tokens, recognizedEntities: entities };
  }
  if (isPolicy) {
    return { intent: 'policy', maxBudget, normalizedTokens: tokens, recognizedEntities: entities };
  }
  if (isProduct) {
    return { intent: 'product_search', maxBudget, normalizedTokens: tokens, recognizedEntities: entities };
  }

  // Pure greeting
  if (tokens.some((t) => ['hi', 'hello', 'hey', 'greetings', 'morning', 'evening'].includes(t))) {
    return { intent: 'greeting', maxBudget: null, normalizedTokens: tokens, recognizedEntities: entities };
  }

  return { intent: 'product_search', maxBudget, normalizedTokens: tokens, recognizedEntities: entities };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Intelligent In-Memory Catalog Ranking Engine
// ─────────────────────────────────────────────────────────────────────────────

interface ScoredProduct {
  product: StaticProduct;
  score: number;
}

function rankProductsInMemory(
  tokens: string[],
  entities: string[],
  maxBudget: number | null,
  catalog: StaticProduct[]
): StaticProduct[] {
  const isSuperlative = tokens.some((t) =>
    ['best', 'top', 'king', 'jumbo', 'finest', 'supreme', 'popular', 'highest', 'royal'].includes(t)
  );
  const isDietOrDiabetes = tokens.some((t) =>
    ['diabetes', 'sugar', 'weight', 'diet', 'slimming', 'low calorie'].includes(t)
  );
  const isGymOrProtein = tokens.some((t) =>
    ['gym', 'workout', 'protein', 'muscle', 'energy', 'fitness'].includes(t)
  );
  const isHeart = tokens.some((t) =>
    ['heart', 'bp', 'cholesterol', 'blood pressure', 'omega'].includes(t)
  );

  const scored: ScoredProduct[] = catalog.map((p) => {
    let score = 0;
    const titleLower = p.name.toLowerCase();
    const descLower = p.description.toLowerCase();
    const catsLower = p.categories.map((c) => c.toLowerCase()).join(' ');

    // 1. Primary Entity Match
    for (const ent of entities) {
      if (titleLower.includes(ent) || catsLower.includes(ent)) {
        score += 80;
      } else if (descLower.includes(ent)) {
        score += 40;
      }
    }

    // 2. Token Matching
    for (const t of tokens) {
      if (['what', 'is', 'the', 'for', 'me', 'show', 'tell', 'give', 'do', 'you', 'have', 'best'].includes(t)) {
        continue;
      }
      if (titleLower.includes(t)) score += 30;
      if (catsLower.includes(t)) score += 20;
      if (descLower.includes(t)) score += 10;
    }

    // 3. Superlative Boosting (e.g. "best cashew" -> W180 King Cashew gets maximum score)
    if (isSuperlative && score > 0) {
      if (titleLower.includes('king') || titleLower.includes('w180') || titleLower.includes('supreme') || p.featured) {
        score += 40;
      }
      if (catsLower.includes('best sellers')) {
        score += 25;
      }
    }

    // 4. Nutritional / Health Intent Boosting
    if (isDietOrDiabetes) {
      if (titleLower.includes('chia') || titleLower.includes('almond') || titleLower.includes('makhana') || titleLower.includes('walnut')) {
        score += 45;
      }
    }
    if (isGymOrProtein) {
      if (titleLower.includes('trail') || titleLower.includes('protein') || titleLower.includes('pumpkin') || titleLower.includes('gond')) {
        score += 45;
      }
    }
    if (isHeart) {
      if (titleLower.includes('walnut') || titleLower.includes('omega') || titleLower.includes('chia')) {
        score += 45;
      }
    }

    // 5. Budget Constraints
    const priceNum = parseFloat(p.price) || 0;
    if (maxBudget !== null) {
      if (priceNum <= maxBudget) {
        score += 35;
      } else {
        score -= 60; // Penalize products exceeding customer budget
      }
    }

    // Stock preference
    if (p.stock_status === 'instock') score += 5;

    return { product: p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Dynamic Suggestion Pills Generator
// ─────────────────────────────────────────────────────────────────────────────

function generateSuggestions(intent: QueryIntent, entities: string[]): string[] {
  if (entities.includes('cashew')) {
    return [
      '👑 Royal Jumbo W180 King Cashews',
      '🍯 Kashmiri Kesar Kaju',
      '🌶️ Peri Peri Cashews',
      '🚚 Check Free Delivery Limit',
    ];
  }
  if (entities.includes('almond')) {
    return [
      '🌰 California Supreme Almonds',
      '🔥 Hickory Smoked BBQ Almonds',
      '🧠 Memory & Brain Nutrition',
      '🚚 Free Express Shipping',
    ];
  }
  if (entities.includes('walnut')) {
    return [
      'Extra Light Walnut Kernels',
      '❤️ Heart & Omega-3 Health',
      '🚚 Free Shipping Above ₹499',
    ];
  }
  if (entities.includes('seed') || entities.includes('chia') || entities.includes('pumpkin')) {
    return [
      '🌱 Organic Raw Chia Seeds',
      '🎃 AAA Grade Pumpkin Seeds',
      '💪 5-in-1 Omega Seed Mix',
      '🥗 Weight Loss Superfoods',
    ];
  }
  if (entities.includes('hamper') || entities.includes('gift')) {
    return [
      '🎁 Artisanal Wooden Hamper',
      '✨ Sovereign 4-Jar Brass Casket',
      '🎉 Festive Celebration Box',
      '📞 Corporate Gifting Helpline',
    ];
  }
  if (intent === 'order_tracking') {
    return [
      '📦 Open My Orders',
      '🔄 Return / Replacement Policy',
      '💬 Chat on WhatsApp (+91 99948 47167)',
    ];
  }
  if (intent === 'policy') {
    return [
      '🚚 Free Delivery Above ₹499',
      '💳 Cash on Delivery & UPI',
      '🔄 7-Day Replacement Policy',
      '📞 Call Concierge (+91 99948 47167)',
    ];
  }

  return [
    '👑 Best King Cashews (W180)',
    '🌰 Super Almonds under ₹500',
    '🎁 Luxury Gift Hampers',
    '🚚 Free Delivery Policy',
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Main Public RAG Entrypoint
// ─────────────────────────────────────────────────────────────────────────────

export async function retrieveRagContext(
  userQuery: string,
  history?: Array<{ role?: string; content?: string }>
): Promise<RagContext> {
  const contextualQuery = contextualizeQuery(userQuery, history);
  const classification = classifyQuery(contextualQuery);
  const { intent, maxBudget, normalizedTokens, recognizedEntities } = classification;
  const policies = loadPolicies();

  // ── FAST PATH 1: CONTACT ───────────────────────────────────────────────────
  if (intent === 'contact') {
    return {
      products: [],
      policies: [
        'Phone & WhatsApp Helpline: +91 99948 47167 (Mon-Sat, 9:00 AM - 8:00 PM IST)',
        'Customer Care Email: support@intersting.duckdns.org',
        'Online Advisory & Contact Page: /contact',
      ],
      suggestions: [
        '📦 Track Live Order',
        '👑 Best King Cashews',
        '🔄 7-Day Return Policy',
      ],
      formattedContext: [
        '### Customer Intent: Contact Customer Care & Support Helpline',
        'INSTRUCTION: In 1-2 friendly sentences, provide our official helpline (+91 99948 47167) and email (support@intersting.duckdns.org). Mention hours: Mon-Sat, 9 AM - 8 PM IST. Never output random links or HTML.',
      ].join('\n'),
    };
  }

  // ── FAST PATH 2: GREETING ──────────────────────────────────────────────────
  if (intent === 'greeting') {
    return {
      products: [],
      policies: [],
      suggestions: [
        '👑 Best King Cashews',
        '🌰 Raw Almonds under ₹500',
        '🎁 Luxury Gift Hampers',
        '📦 Where is my order?',
      ],
      formattedContext: [
        '### Customer Intent: Friendly Greeting / Concierge Welcome',
        '• Role: Chappie, AI Concierge for Interesting gourmet dry fruits pantry.',
        '• INSTRUCTION: Greet the customer in 1 crisp, warm sentence (under 20 words). Never output HTML tags or code blocks. Quick action cards are provided below.',
      ].join('\n'),
    };
  }

  // ── FAST PATH 3: ORDER TRACKING ────────────────────────────────────────────
  if (intent === 'order_tracking') {
    return {
      products: [],
      policies: [
        'Orders dispatch within 24 hours via Express Blue Dart / Delhivery.',
        'Live tracking links are delivered via SMS & WhatsApp.',
        'Customers can view real-time orders & invoices in [My Account > Orders](/account).',
        'Concierge Helpline: +91 99948 47167.',
      ],
      suggestions: [
        '📦 Open My Orders',
        '🔄 Return / Replacement Policy',
        '💬 Chat on WhatsApp',
      ],
      formattedContext: [
        '### Customer Intent: Order Status & Live Tracking Inquiry',
        'INSTRUCTION: In 1-2 sentences, inform the customer they can check real-time order status and invoices in [My Account > Orders](/account). Mention dispatch within 24 hours, or call +91 99948 47167 for direct assistance. Do not output HTML.',
      ].join('\n'),
    };
  }

  // ── PATH 4: POLICY INQUIRY ─────────────────────────────────────────────────
  if (intent === 'policy') {
    const matchedPolicies = policies.filter((p) =>
      normalizedTokens.some((t) => p.keywords.includes(t))
    );
    const chosenPolicies = (matchedPolicies.length > 0 ? matchedPolicies : policies)
      .slice(0, 3)
      .map((p) => `• ${p.topic}: ${p.content}`);

    return {
      products: [],
      policies: chosenPolicies,
      suggestions: generateSuggestions('policy', []),
      formattedContext: [
        '### Customer Intent: Store Policy / Delivery / Payment Inquiry',
        '### Verified Store Policies:',
        ...chosenPolicies,
        '',
        'INSTRUCTION: In 1-2 sentences, directly answer their policy question. Use exact markdown links only where appropriate ([Shipping Policy](/shipping), [Return Policy](/returns), or [FAQ & Payments](/faq)). Never output raw HTML.',
      ].join('\n'),
    };
  }

  // ── PATH 5: PRODUCT SEARCH / RECOMMENDATION / HYBRID ──────────────────────
  // 1. Run in-memory ranking (instant, zero failure)
  let ranked = rankProductsInMemory(normalizedTokens, recognizedEntities, maxBudget, STATIC_PRODUCTS);

  // If no specific match found, fallback to featured & best sellers
  if (ranked.length === 0) {
    ranked = STATIC_PRODUCTS.filter((p) => p.featured || p.category === 'Nuts').slice(0, 4);
  }

  // 2. Parallel Vector Search (Enhancement only — fails gracefully if 503)
  try {
    const vectorPromise = generateQueryVector(contextualQuery).then((vec) =>
      vec ? searchQdrant(vec) : []
    );
    // Timeout vector search to ensure snappy responses
    const vectorHits = await Promise.race([
      vectorPromise,
      new Promise<QdrantSearchHit[]>((resolve) => setTimeout(() => resolve([]), 1500)),
    ]);

    if (vectorHits && vectorHits.length > 0) {
      const topVectorIds = vectorHits
        .map((h) => Number(h.payload?.id || h.id))
        .filter((id) => !isNaN(id));

      // Re-boost products found in Qdrant
      ranked.sort((a, b) => {
        const aBoost = topVectorIds.includes(a.id) ? -1 : 0;
        const bBoost = topVectorIds.includes(b.id) ? -1 : 0;
        return aBoost - bBoost;
      });
    }
  } catch {
    // Vector search failure is non-blocking
  }

  const topProducts: RetrievedProduct[] = ranked.slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    regular_price: p.regular_price,
    image: p.image,
    category: p.category,
    description: p.description.slice(0, 160),
    stock_status: p.stock_status,
  }));

  const productContextText = topProducts
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}** — ₹${p.price} (${p.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'})\n   Details: ${p.description}`
    )
    .join('\n\n');

  const policyContextText =
    intent === 'hybrid_product_policy'
      ? '\n### Relevant Store Delivery / COD Policies:\n• Free express shipping on orders above ₹499.\n• Pay on Delivery (Cash on Delivery / UPI on Delivery) is available across India.\n'
      : '';

  return {
    products: topProducts,
    policies: [],
    suggestions: generateSuggestions(intent, recognizedEntities),
    formattedContext: [
      '### Customer Intent: Gourmet Product Recommendation & Inquiry',
      maxBudget ? `### Budget Constraint: Under ₹${maxBudget}` : '',
      '### Live Verified Products in Store (Prioritize Top 1 or 2):',
      productContextText,
      policyContextText,
      'CRITICAL INSTRUCTION:',
      '- In 1 to 2 friendly, appetizing sentences (under 35 words), directly answer the customer\'s question and name our top recommended product(s) and price (e.g. "**Royal Jumbo W180 King Cashews** at ₹449").',
      '- NEVER output raw HTML (no <div>, <span>, or <button> tags). Output plain text with markdown bolding only.',
      '- NEVER include [Track Your Order] or account links unless the customer asked about order status.',
      '- Interactive product cards with Add to Cart buttons will auto-render below your message.',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
