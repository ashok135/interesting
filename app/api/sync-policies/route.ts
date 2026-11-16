import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_EMBED_URL = process.env.NVIDIA_EMBED_URL || 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = process.env.NVIDIA_EMBED_MODEL || 'nvidia/nemotron-3.5-embed-1b';

const QDRANT_URL = process.env.QDRANT_URL || 'https://intersting.duckdns.org/qdrant';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'products_rag';

const POLICIES_DIR = path.resolve(process.cwd(), 'content/policies');

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

    if (!fs.existsSync(POLICIES_DIR)) {
      return NextResponse.json(
        { error: `Policies directory not found: ${POLICIES_DIR}` },
        { status: 500 }
      );
    }

    const policyFiles = fs.readdirSync(POLICIES_DIR).filter((f) => f.endsWith('.json'));
    const allChunks: any[] = [];

    for (const file of policyFiles) {
      const filePath = path.join(POLICIES_DIR, file);
      const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      for (const section of doc.sections || []) {
        const chunkText = `Store Page: ${doc.title} | Section: ${section.topic} | Summary: ${section.summary} | Full Details: ${section.content}`;

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
    }

    const BATCH_SIZE = 8;
    const qdrantPoints: any[] = [];

    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      const embeddings = await generateEmbeddings(batch.map((c) => c.passage));

      for (let j = 0; j < batch.length; j++) {
        qdrantPoints.push({
          id: batch[j].id,
          vector: embeddings[j],
          payload: batch[j].payload,
        });
      }
    }

    const qdrantRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: qdrantPoints }),
    });

    if (!qdrantRes.ok) {
      const errText = await qdrantRes.text();
      return NextResponse.json(
        { error: 'Failed to save policy chunks to Qdrant', details: errText },
        { status: 502 }
      );
    }

    const verifyRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
    const verifyData = await verifyRes.json();
    const totalPoints = verifyData?.result?.points_count ?? 'unknown';

    return NextResponse.json({
      success: true,
      message: `All ${allChunks.length} policy chunks successfully indexed from content/policies/ into Qdrant!`,
      totalPointsInDatabase: totalPoints,
      chunksIndexed: allChunks.map((c) => ({
        id: c.id,
        name: c.payload.name,
        url: c.payload.url,
      })),
    });
  } catch (error: any) {
    console.error('[Sync Policies API] Error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
