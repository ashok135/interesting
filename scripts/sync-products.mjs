/**
 * Batch Sync All Published WooCommerce Products into Qdrant
 *
 * Fetches all published products from WooCommerce REST API,
 * generates 2,048-dim vectors using NVIDIA NIM, and upserts into Qdrant.
 */

import fs from 'node:fs';
import path from 'node:path';

// 1. Load .env.local if present
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

const WC_BASE_URL = (process.env.WC_URL || process.env.NEXT_PUBLIC_WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || '';
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || '';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

function stripHtml(html) {
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

async function generateEmbeddings(textBatch) {
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
  return data.data.map((item) => item.embedding);
}

async function syncAllProducts() {
  console.log('\n======================================================');
  console.log('🛍️  [PRODUCT RAG SYNC] Fetching Live Products from WooCommerce');
  console.log(`🌐 Base URL: ${WC_BASE_URL}`);
  console.log('======================================================\n');

  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
    console.error('❌ Missing WC_CONSUMER_KEY or WC_CONSUMER_SECRET in environment.');
    return;
  }
  if (!NVIDIA_API_KEY) {
    console.error('❌ Missing NVIDIA_API_KEY in environment.');
    return;
  }

  const creds = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  const wcRes = await fetch(`${WC_BASE_URL}/wp-json/wc/v3/products?per_page=100&status=publish`, {
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!wcRes.ok) {
    const errText = await wcRes.text();
    throw new Error(`Failed to fetch products from WooCommerce (${wcRes.status}): ${errText}`);
  }

  const products = await wcRes.json();
  console.log(`✓ Fetched ${products.length} published products from WooCommerce.\n`);

  const productChunks = [];

  for (const p of products) {
    const categories = Array.isArray(p.categories) ? p.categories.map((c) => c.name).join(', ') : '';
    const shortDesc = stripHtml(p.short_description || '');
    const longDesc = stripHtml(p.description || '').slice(0, 500);

    const passage = [
      `Product: ${p.name}`,
      categories ? `Category: ${categories}` : '',
      `Price: ₹${p.price || 0}`,
      shortDesc ? `Highlights: ${shortDesc}` : '',
      longDesc ? `Nutritional & Health Details: ${longDesc}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    productChunks.push({
      id: p.id,
      passage,
      payload: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        category: categories,
        type: 'product',
        url: `/product/${p.slug}`,
        image: Array.isArray(p.images) && p.images[0]?.src ? p.images[0].src : '',
        passage,
        updated_at: new Date().toISOString(),
      },
    });
  }

  console.log(`🚀 Generating embeddings for ${productChunks.length} products in batches of 8...`);

  const BATCH_SIZE = 8;
  const qdrantPoints = [];

  for (let i = 0; i < productChunks.length; i += BATCH_SIZE) {
    const batch = productChunks.slice(i, i + BATCH_SIZE);
    process.stdout.write(`   Processing batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(productChunks.length / BATCH_SIZE)}... `);

    const embeddings = await generateEmbeddings(batch.map((c) => c.passage));

    for (let j = 0; j < batch.length; j++) {
      qdrantPoints.push({
        id: batch[j].id,
        vector: embeddings[j],
        payload: batch[j].payload,
      });
    }
    console.log('✓ Done');
  }

  console.log(`\n💾 Upserting ${qdrantPoints.length} points to Qdrant collection "${COLLECTION_NAME}"...`);

  const qdrantRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: qdrantPoints }),
  });

  if (!qdrantRes.ok) {
    const errText = await qdrantRes.text();
    throw new Error(`Qdrant upsert failed (${qdrantRes.status}): ${errText}`);
  }

  console.log('✅ All products successfully indexed into Qdrant!\n');

  // Verify total points
  const verifyRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
  const verifyData = await verifyRes.json();
  console.log(`📊 Current Qdrant Total Points Count: ${verifyData?.result?.points_count}\n`);
}

syncAllProducts().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
