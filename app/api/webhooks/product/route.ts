import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const NVIDIA_API_KEY =
  process.env.NVIDIA_API_KEY ||
  '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';
const NVIDIA_EMBED_URL = 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = 'products_rag';

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
 * Health check & status verification
 * GET https://interesting-ten.vercel.app/api/webhooks/product
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/product',
    message: 'WooCommerce Product Webhook endpoint is healthy and ready to receive events.',
    supportedTopics: ['product.created', 'product.updated', 'product.deleted', 'action.woocommerce_webhook_ping'],
  });
}

/**
 * WooCommerce Product Webhook Listener
 * POST https://interesting-ten.vercel.app/api/webhooks/product
 *
 * When a product is created or updated in WordPress:
 * 1. Responds immediately to WooCommerce test pings.
 * 2. Formats semantic product data (Title, Categories, Nutrition / Benefits).
 * 3. Generates 2,048-dim vector via NVIDIA NIM.
 * 4. Upserts point into Qdrant on the GCP VM.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature');
    const topic = req.headers.get('x-wc-webhook-topic') || '';
    const webhookSecret = process.env.WC_WEBHOOK_SECRET;

    // 1. Handle WooCommerce Ping (Sent when creating/testing the webhook in WP Admin)
    if (topic.includes('ping') || rawBody.includes('webhook_id')) {
      console.log('[WooCommerce Product Webhook] Ping verification received successfully.');
      return NextResponse.json({
        success: true,
        message: 'WooCommerce webhook ping verified.',
      });
    }

    // 2. Verify HMAC-SHA256 signature if secret is present
    if (webhookSecret && signature) {
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody, 'utf8')
        .digest('base64');

      const computedBuf = Buffer.from(computedSignature, 'utf8');
      const sigBuf = Buffer.from(signature, 'utf8');

      if (computedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(computedBuf, sigBuf)) {
        console.warn('[WooCommerce Product Webhook] Invalid signature detected.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ message: 'Empty body' }, { status: 200 });
    }

    let productData: any;
    try {
      productData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!productData || !productData.id) {
      return NextResponse.json({ message: 'Payload received, but no valid product ID found' }, { status: 200 });
    }

    const productId = productData.id;
    const productName = productData.name || '';
    const productStatus = (productData.status || '').toLowerCase().trim();
    const productSlug = productData.slug || '';

    console.log(`[WooCommerce Product Webhook] Product #${productId} (${productName}) received. Topic: "${topic}", Status: "${productStatus}"`);

    // If product is deleted or set to draft/trash, remove it from Qdrant
    if (topic === 'product.deleted' || productStatus === 'trash' || productStatus === 'draft') {
      console.log(`[WooCommerce Product Webhook] Removing Product #${productId} from Qdrant...`);
      await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points/delete?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: [productId] }),
      });
      return NextResponse.json({ success: true, action: 'deleted', id: productId });
    }

    // 3. Prepare rich semantic passage for embedding
    const categories = Array.isArray(productData.categories)
      ? productData.categories.map((c: any) => c.name).join(', ')
      : '';
    const shortDesc = stripHtml(productData.short_description || '');
    const longDesc = stripHtml(productData.description || '').slice(0, 500);

    const passage = [
      `Product: ${productName}`,
      categories ? `Category: ${categories}` : '',
      shortDesc ? `Highlights: ${shortDesc}` : '',
      longDesc ? `Details: ${longDesc}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    // 4. Generate 2,048-dim embedding via NVIDIA NIM
    const embedRes = await fetch(NVIDIA_EMBED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [passage],
        model: NVIDIA_EMBED_MODEL,
        input_type: 'passage',
      }),
    });

    if (!embedRes.ok) {
      const errText = await embedRes.text();
      console.error('[WooCommerce Product Webhook] NVIDIA embedding failed:', errText);
      return NextResponse.json({ error: 'Embedding generation failed', details: errText }, { status: 502 });
    }

    const embedData = await embedRes.json();
    const vector = embedData.data[0].embedding;

    // 5. Upsert point into Qdrant on GCP VM
    const qdrantPoint = {
      id: productId,
      vector,
      payload: {
        id: productId,
        name: productName,
        slug: productSlug,
        category: categories,
        type: 'product',
        url: `/product/${productSlug}`,
        passage,
        updated_at: new Date().toISOString(),
      },
    };

    const qdrantRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: [qdrantPoint] }),
    });

    if (!qdrantRes.ok) {
      const errText = await qdrantRes.text();
      console.error('[WooCommerce Product Webhook] Qdrant upsert failed:', errText);
      return NextResponse.json({ error: 'Qdrant upsert failed', details: errText }, { status: 502 });
    }

    console.log(`[WooCommerce Product Webhook] Successfully indexed Product #${productId} (${productName}) in Qdrant.`);

    return NextResponse.json({
      success: true,
      id: productId,
      name: productName,
      message: 'Product embedded and indexed in Qdrant successfully.',
    });
  } catch (error: any) {
    console.error('[WooCommerce Product Webhook] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
