/**
 * Single Source of Truth Policy & Knowledge Sync Script
 *
 * Reads directly from content/policies/*.json, extracts focused semantic chunks,
 * embeds them via NVIDIA NIM, and stores them in Qdrant on GCP VM.
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

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

const POLICIES_DIR = path.resolve(process.cwd(), 'content/policies');

async function syncPolicies() {
  console.log('\n======================================================');
  console.log('🚀 [KNOWLEDGE SYNC] Reading Single Source of Truth Files');
  console.log(`📁 Directory: ${POLICIES_DIR}`);
  console.log('======================================================\n');

  if (!fs.existsSync(POLICIES_DIR)) {
    console.error(`❌ Policies directory not found: ${POLICIES_DIR}`);
    return;
  }

  // 1. Read all JSON policy files
  const policyFiles = fs.readdirSync(POLICIES_DIR).filter((f) => f.endsWith('.json'));
  console.log(`✓ Found ${policyFiles.length} policy files: ${policyFiles.join(', ')}\n`);

  const allChunks = [];

  for (const file of policyFiles) {
    const filePath = path.join(POLICIES_DIR, file);
    const rawData = fs.readFileSync(filePath, 'utf8');
    const doc = JSON.parse(rawData);

    console.log(`📖 [Reading File] ${file} -> "${doc.title}" (Page: ${doc.url})`);

    for (const section of doc.sections || []) {
      const chunkText = `Store Page: ${doc.title} | Section: ${section.topic} | Summary: ${section.summary} | Full Details: ${section.content}`;

      console.log(`   ➤ [Chunk #${section.id}] Topic: "${section.topic}" (${chunkText.length} chars)`);

      allChunks.push({
        id: section.id,
        passage: chunkText,
        payload: {
          id: section.id,
          name: `${doc.title} - ${section.topic}`,
          slug: section.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          type: 'policy',
          category: 'Store Knowledge & Policies',
          url: doc.url,
          passage: chunkText,
          updated_at: new Date().toISOString(),
        },
      });
    }
    console.log('');
  }

  console.log(`📊 Total Chunks Extracted: ${allChunks.length} chunks across ${policyFiles.length} pages.`);

  if (!NVIDIA_API_KEY) {
    console.warn('\n⚠️  NVIDIA_API_KEY is not set in environment. Skipping vector generation.');
    return;
  }

  // 2. Batch embed with NVIDIA NIM
  console.log('\n--- [Step 2: Generating Vectors with NVIDIA NIM] ---');
  console.log(`Calling model: ${NVIDIA_EMBED_MODEL} (2,048 dimensions)...`);

  const BATCH_SIZE = 8;
  const qdrantPoints = [];

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    process.stdout.write(`   Embedding chunks ${i + 1} to ${Math.min(i + BATCH_SIZE, allChunks.length)}... `);

    const res = await fetch(NVIDIA_EMBED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: batch.map((c) => c.passage),
        model: NVIDIA_EMBED_MODEL,
        input_type: 'passage',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log('FAILED!');
      throw new Error(`NVIDIA API error: ${err}`);
    }

    const data = await res.json();
    for (let j = 0; j < batch.length; j++) {
      qdrantPoints.push({
        id: batch[j].id,
        vector: data.data[j].embedding,
        payload: batch[j].payload,
      });
    }
    console.log('✓ (2048 dims)');
  }

  // 3. Upsert into Qdrant
  console.log('\n--- [Step 3: Storing in Qdrant on GCP VM] ---');
  console.log(`Target: ${QDRANT_URL}/collections/${COLLECTION_NAME}`);

  const qdrantRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: qdrantPoints }),
  });

  if (!qdrantRes.ok) {
    const err = await qdrantRes.text();
    throw new Error(`Qdrant upsert failed: ${err}`);
  }

  // Verify total points count
  const verifyRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
  const verifyData = await verifyRes.json();
  const totalCount = verifyData?.result?.points_count ?? 'unknown';

  console.log(`🎉 SUCCESS! All ${allChunks.length} policy chunks are permanently stored in Qdrant.`);
  console.log(`📈 Total Points in Database: ${totalCount}`);
  console.log('======================================================\n');
}

syncPolicies().catch((err) => {
  console.error('\n❌ Policy sync failed:', err.message);
});
