import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

// The 6 Core Store Policy & Customer Help Documents
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

async function generateEmbeddings(textBatch: string[]) {
  const res = await fetch(NVIDIA_EMBED_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: textBatch,
      model: NVIDIA_EMBED_MODEL,
      input_type: 'passage',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`NVIDIA Embedding failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.data.map((item: any) => item.embedding);
}

export async function GET(req: NextRequest) {
  return handleSync();
}

export async function POST(req: NextRequest) {
  return handleSync();
}

async function handleSync() {
  try {
    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: 'NVIDIA_API_KEY is missing from server environment.' },
        { status: 500 }
      );
    }

    console.log('[Sync Policies] Generating embeddings for 6 core store policies...');
    const texts = POLICIES.map((p) => p.passage);
    const embeddings = await generateEmbeddings(texts);

    const qdrantPoints = POLICIES.map((p, idx) => ({
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

    console.log('[Sync Policies] Upserting 6 policy points into Qdrant...');
    const qdrantRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: qdrantPoints }),
    });

    if (!qdrantRes.ok) {
      const errText = await qdrantRes.text();
      return NextResponse.json(
        { error: 'Failed to save policies to Qdrant', details: errText },
        { status: 502 }
      );
    }

    // Verify final count
    const verifyRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
    const verifyData = await verifyRes.json();
    const totalPoints = verifyData?.result?.points_count ?? 'unknown';

    return NextResponse.json({
      success: true,
      message: 'All 6 store policies successfully indexed in Qdrant Vector DB!',
      totalPointsInDatabase: totalPoints,
      indexedPolicies: POLICIES.map((p) => ({
        id: p.id,
        title: p.title,
        url: p.url,
      })),
    });
  } catch (error: any) {
    console.error('[Sync Policies] Error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
