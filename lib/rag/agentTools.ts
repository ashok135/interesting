/**
 * Agentic RAG — Tool Definition & Execution Layer
 *
 * Exposes live store operations to the LLM agent via OpenAI-compatible tool specifications.
 */

import fs from 'node:fs';
import path from 'node:path';
import { STATIC_PRODUCTS, StaticProduct } from './staticCatalog';
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tool Schemas (OpenAI Function Calling Format)
// ─────────────────────────────────────────────────────────────────────────────

export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_catalog',
      description:
        'Search the store catalog for farm-fresh dry fruits, nuts, seeds, hampers, or artisanal snacks by query, category, maximum budget, or nutritional intent.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The product or ingredient name (e.g. cashew, almond, walnut, makhana, chia seed, pumpkin seed, anjeer, dates, raisins, chikki, laddu, kaju katli, hamper).',
          },
          category: {
            type: 'string',
            enum: [
              'Nuts',
              'Seeds',
              'Dry Fruits',
              'Millets',
              'Roasted Snacks',
              'Flavoured Nuts',
              'Trail Mix',
              'Traditional Snacks',
              'Premium Gift Packs',
              'Best Sellers',
            ],
            description: 'Optional category filter.',
          },
          max_price: {
            type: 'number',
            description: 'Optional maximum price in Indian Rupees (₹).',
          },
          dietary_focus: {
            type: 'string',
            enum: ['diabetes', 'weight_loss', 'high_protein', 'heart_health', 'energy'],
            description: 'Optional wellness or health goal.',
          },
          featured_only: {
            type: 'boolean',
            description: 'If true, prioritizes award-winning best sellers and king grades.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_policy_info',
      description:
        'Retrieve authoritative and verified store policies regarding shipping, delivery timelines, free delivery threshold, cash on delivery (COD), return/replacement guarantee, or customer support contact details.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: [
              'shipping_delivery',
              'returns_replacements',
              'payment_cod',
              'contact_support',
              'grading_quality',
              'packaging_freshness',
            ],
            description: 'The policy topic to retrieve.',
          },
        },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_curated_collection',
      description:
        'Retrieve a handpicked collection of items (e.g. best-sellers, festive gift hampers, super seeds, or traditional artisanal sweets).',
      parameters: {
        type: 'object',
        properties: {
          collection: {
            type: 'string',
            enum: ['best_sellers', 'luxury_hampers', 'super_seeds', 'healthy_millets', 'artisanal_sweets'],
            description: 'The collection name.',
          },
        },
        required: ['collection'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. Policy Information Loader
// ─────────────────────────────────────────────────────────────────────────────

interface PolicyData {
  summary: string;
  details: string[];
  link: string;
}

const POLICY_FACTS: Record<string, PolicyData> = {
  shipping_delivery: {
    summary: 'Free Express Shipping is available on all orders with subtotal ₹499 or more across India.',
    details: [
      'Orders below ₹499 incur a nominal flat shipping fee of ₹49.',
      'Delivery Coverage: Over 19,000+ PIN codes across all 28 Indian states and Union Territories.',
      'Dispatch Timeline: Packed and dispatched within 24 to 48 business hours of order confirmation.',
      'Delivery Timelines: Metro cities 2–4 business days; rest of India 3–6 business days via Blue Dart & Delhivery.',
      'Live SMS Tracking is sent automatically as soon as the package is handed over to the courier.',
    ],
    link: '[Shipping Policy](/shipping)',
  },
  returns_replacements: {
    summary: '7-Day Hassle-Free Replacement for damaged, broken, or unsealed pantry packages.',
    details: [
      'Food Safety Assurance: In most cases, no physical return is required for food safety. Simply share a photo on WhatsApp (+91 99948 47167) or email.',
      'Instant Resolution: Verified by concierge within 2 hours. Replacement dispatched immediately or 100% refund processed within 24 to 48 business hours.',
      'Refunds are credited directly to original UPI ID, debit/credit card, or bank account.',
    ],
    link: '[Return & Refund Policy](/returns)',
  },
  payment_cod: {
    summary: 'Pay on Delivery (Cash on Delivery / UPI QR on Delivery) and Direct Instant UPI are supported.',
    details: [
      'No extra convenience charge for Cash on Delivery (COD).',
      'Supported Online Payments: Instant UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit Cards, Net Banking.',
      'Store UPI ID: 9994847167@upi.',
    ],
    link: '[FAQ & Payments](/faq)',
  },
  contact_support: {
    summary: 'Customer Concierge is available Monday through Saturday, 9:00 AM to 8:00 PM IST.',
    details: [
      'Phone & WhatsApp Helpline: +91 99948 47167.',
      'Customer Care Email: support@intersting.duckdns.org (or hello@interesting.co.in).',
      'Corporate & Wedding Gifting Concierge: Custom laser-engraved luxury hampers available via WhatsApp.',
    ],
    link: '[Contact Us](/contact)',
  },
  grading_quality: {
    summary: 'White Whole 180 (W180) King Cashew Grade: less than 180 whole giant kernels per pound.',
    details: [
      'Sourced directly from Konkan GI-certified orchards with 100% zero adulteration.',
      'Slow wood-fired dry roasted with Himalayan pink salt; zero palm oil or chemical preservatives.',
      'Pampore Valley Saffron (Mongra Grade A1) and California Nonpareil Supreme Almonds.',
    ],
    link: '[FAQ & Quality](/faq)',
  },
  packaging_freshness: {
    summary: 'Hermetically nitrogen-flushed tins with airtight pull-rings and reusable lid caps.',
    details: [
      'Keeps nuts crisp, aromatic, and fresh for up to 9 months.',
      'In humid summer months, refrigeration is recommended to preserve peak crunch.',
    ],
    link: '[FAQ & Freshness](/faq)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Tool Implementations
// ─────────────────────────────────────────────────────────────────────────────

export async function executeTool(name: string, args: Record<string, unknown>): Promise<{
  data: unknown;
  products?: RetrievedProduct[];
}> {
  switch (name) {
    case 'search_catalog': {
      const query = String(args.query || '').toLowerCase().trim();
      const category = args.category ? String(args.category).toLowerCase() : undefined;
      const maxPrice = typeof args.max_price === 'number' ? args.max_price : null;
      const dietary = args.dietary_focus ? String(args.dietary_focus).toLowerCase() : undefined;
      const featuredOnly = Boolean(args.featured_only);

      // Extract search tokens
      const searchTerms = query.split(/\s+/).filter((t) => t.length > 2);

      let matched = STATIC_PRODUCTS.filter((p) => {
        const titleLower = p.name.toLowerCase();
        const descLower = p.description.toLowerCase();
        const catsLower = p.categories.map((c) => c.toLowerCase()).join(' ');

        // Category filter
        if (category && !catsLower.includes(category)) return false;

        // Max price filter
        const priceNum = parseFloat(p.price) || 0;
        if (maxPrice !== null && priceNum > maxPrice) return false;

        // Featured filter
        if (featuredOnly && !p.featured && !catsLower.includes('best sellers')) return false;

        // Dietary filters
        if (dietary === 'diabetes' && !titleLower.includes('almond') && !titleLower.includes('chia') && !titleLower.includes('walnut')) {
          return false;
        }
        if (dietary === 'weight_loss' && !titleLower.includes('chia') && !titleLower.includes('pumpkin') && !titleLower.includes('makhana')) {
          return false;
        }
        if (dietary === 'high_protein' && !titleLower.includes('trail') && !titleLower.includes('protein') && !titleLower.includes('pumpkin')) {
          return false;
        }

        // Search terms match
        if (searchTerms.length === 0) return true;
        return searchTerms.some(
          (term) => titleLower.includes(term) || descLower.includes(term) || catsLower.includes(term)
        );
      });

      // If query is broad (e.g. 'cashew' or 'nut') and user asked for best, prioritize W180 King Cashews & Best Sellers
      matched.sort((a, b) => {
        const aScore = (a.featured ? 20 : 0) + (a.name.includes('King') || a.name.includes('W180') ? 30 : 0);
        const bScore = (b.featured ? 20 : 0) + (b.name.includes('King') || b.name.includes('W180') ? 30 : 0);
        return bScore - aScore;
      });

      // Limit to top 4 products
      const topProducts: RetrievedProduct[] = matched.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        regular_price: p.regular_price,
        image: p.image,
        category: p.category,
        description: p.description,
        stock_status: p.stock_status,
      }));

      return {
        data: {
          total_matches: topProducts.length,
          products: topProducts.map((p) => ({
            id: p.id,
            name: p.name,
            price: `₹${p.price}`,
            regular_price: `₹${p.regular_price}`,
            category: p.category,
            description: p.description,
            stock_status: p.stock_status,
            link: `/product/${p.slug}`,
          })),
        },
        products: topProducts,
      };
    }

    case 'get_policy_info': {
      const topic = String(args.topic || 'shipping_delivery');
      const policy = POLICY_FACTS[topic] || POLICY_FACTS.shipping_delivery;
      return {
        data: {
          topic,
          summary: policy.summary,
          details: policy.details,
          official_link: policy.link,
        },
      };
    }

    case 'get_curated_collection': {
      const collection = String(args.collection || 'best_sellers');
      let matched: StaticProduct[] = [];

      if (collection === 'best_sellers') {
        matched = STATIC_PRODUCTS.filter((p) =>
          p.featured || p.categories.some((c) => c.toLowerCase().includes('best seller'))
        );
      } else if (collection === 'luxury_hampers') {
        matched = STATIC_PRODUCTS.filter((p) =>
          p.categories.some((c) => c.toLowerCase().includes('gift') || c.toLowerCase().includes('hamper'))
        );
      } else if (collection === 'super_seeds') {
        matched = STATIC_PRODUCTS.filter((p) =>
          p.categories.some((c) => c.toLowerCase().includes('seed'))
        );
      } else if (collection === 'healthy_millets') {
        matched = STATIC_PRODUCTS.filter((p) =>
          p.categories.some((c) => c.toLowerCase().includes('millet'))
        );
      } else if (collection === 'artisanal_sweets') {
        matched = STATIC_PRODUCTS.filter((p) =>
          p.categories.some((c) => c.toLowerCase().includes('traditional') || c.toLowerCase().includes('katli'))
        );
      }

      const topProducts: RetrievedProduct[] = matched.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        regular_price: p.regular_price,
        image: p.image,
        category: p.category,
        description: p.description,
        stock_status: p.stock_status,
      }));

      return {
        data: {
          collection,
          count: topProducts.length,
          items: topProducts.map((p) => ({
            name: p.name,
            price: `₹${p.price}`,
            description: p.description,
          })),
        },
        products: topProducts,
      };
    }

    default:
      return { data: { error: `Tool ${name} is not recognized.` } };
  }
}
