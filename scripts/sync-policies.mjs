/**
 * Automatic Policy & Return Sync Script
 * Runs during Next.js production build to ensure Qdrant always has the latest store policies.
 */

import fs from 'node:fs';
import path from 'node:path';

// Load .env.local if present locally
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Ignore
}

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

const POLICIES = [
  {
    id: 90001,
    title: 'Shipping & Delivery Policy',
    topic: 'shipping',
    url: '/shipping',
    passage:
      'Shipping and Delivery Policy: Free Express Delivery across India on all prepaid orders and all orders above ₹499. Orders dispatch within 24 hours of confirmation in tamper-evident, nitrogen-flushed airtight containers. Delivery takes 2 to 4 business days for metro cities (Bengaluru, Mumbai, Delhi, Chennai, Hyderabad) and 3 to 6 days for the rest of India. Real-time SMS and WhatsApp tracking updates are sent at every shipping milestone across 19,000+ PIN codes.',
  },
  {
    id: 90002,
    title: 'Cancellation & Returns Policy',
    topic: 'returns',
    url: '/returns',
    passage:
      'Easy Returns and Cancellation Policy: Interesting provides a 7-day hassle-free replacement or full refund guarantee if any product arrives damaged, unsealed, or fails our freshness standard. Customers can report issues within 7 days with photos for instant replacement dispatch. Approved refunds are credited directly to your UPI ID, original debit/credit card, or bank account within 24 to 48 business hours. We arrange a 100% free doorstep reverse pickup.',
  },
  {
    id: 90003,
    title: 'FAQs & Payment Methods',
    topic: 'faq',
    url: '/faq',
    passage:
      'Frequently Asked Questions & Payment Methods: We support Pay on Delivery (Cash on Delivery / UPI QR on Delivery) and 100% secure Direct Instant UPI (Google Pay, PhonePe, Paytm, BHIM) as well as all major Debit/Credit Cards and Net Banking with zero extra transaction fees. All products are 100% natural, farm-sourced, zero artificial preservatives, zero chemical bleaching, vacuum sealed in airtight canisters.',
  },
  {
    id: 90004,
    title: 'Privacy Policy',
    topic: 'privacy',
    url: '/privacy',
    passage:
      'Privacy Policy: Interesting adheres to strict data privacy and Indian consumer protection guidelines. Customer phone numbers, addresses, and order histories are encrypted and never sold, shared, or rented to third-party marketing companies. SMS and communications are strictly restricted to order tracking and customer support.',
  },
  {
    id: 90005,
    title: 'Terms of Service & Purity Guarantee',
    topic: 'terms',
    url: '/terms',
    passage:
      'Terms of Service and Quality Commitment: By shopping on Interesting Gourmet Pantry, customers are assured 100% authentic, origin-certified whole kernel dry fruits, Kashmiri walnuts, and premium nuts. Lab-tested quality, accurate weight assurances, and fair transparent pricing with all GST taxes clearly itemized on tax invoices.',
  },
  {
    id: 90006,
    title: 'Customer Support & Contact Us',
    topic: 'contact',
    url: '/contact',
    passage:
      'Contact Us and Customer Support: Our dedicated customer advisory team is available Monday to Saturday, 9:00 AM to 8:00 PM IST. Phone & WhatsApp helpline: +91 99948 47167. Email support: support@intersting.duckdns.org. We serve 19,000+ PIN codes across India from our central gourmet fulfillment hub.',
  },
];

async function sync() {
  if (!NVIDIA_API_KEY) {
    console.warn('[Policy Sync] Skipping: NVIDIA_API_KEY not configured in environment.');
    return;
  }

  console.log('[Policy Sync] Generating embeddings for 6 store policies...');
  const res = await fetch(NVIDIA_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: POLICIES.map((p) => p.passage),
      model: NVIDIA_EMBED_MODEL,
      input_type: 'passage',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('[Policy Sync] Embedding call failed:', err);
    return;
  }

  const data = await res.json();
  const embeddings = data.data.map((item) => item.embedding);

  const points = POLICIES.map((p, idx) => ({
    id: p.id,
    vector: embeddings[idx],
    payload: {
      id: p.id,
      name: p.title,
      slug: p.topic,
      type: 'policy',
      category: 'Store Policy & Help',
      url: p.url,
      passage: p.passage,
      updated_at: new Date().toISOString(),
    },
  }));

  console.log(`[Policy Sync] Upserting ${points.length} policies to Qdrant...`);
  const qdrantRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  });

  if (qdrantRes.ok) {
    console.log('✓ [Policy Sync] Successfully synced all 6 store policies to Qdrant!');
  } else {
    const err = await qdrantRes.text();
    console.warn('[Policy Sync] Qdrant upsert returned:', err);
  }
}

sync().catch((e) => {
  console.warn('[Policy Sync] Non-blocking warning:', e.message);
});
