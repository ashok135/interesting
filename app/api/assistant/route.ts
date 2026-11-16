import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { retrieveRagContext } from '@/lib/rag/catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL =
  process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

const nvidiaClient = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: NVIDIA_BASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Please enter a message.' },
        { status: 400 }
      );
    }

    const cleanQuery = message.trim();

    // 1. RAG Retrieval Step: Fetch real-time products & policies from WooCommerce
    const ragContext = await retrieveRagContext(cleanQuery);

    // 2. Strict Grounding System Prompt
    const systemPrompt = `You are "Tara", the AI Nutritionist & Concierge for "Interesting" — a luxury farm-fresh dry fruits, nuts, super-seeds, and artisanal hampers store in India.

ROLE & GUIDELINES:
1. Recommend ONLY products from the provided "Live Store Products" catalog. NEVER suggest brands or items not listed.
2. Always mention the exact product name and price in ₹ (INR) as provided in the catalog.
3. Keep answers concise (2-4 clear paragraphs or bullet points), polite, encouraging, and focused on health benefits (e.g. fiber, healthy fats, antioxidants, omega-3, protein).
4. If the customer asks about shipping, returns, or payment, reference the provided Store Policies.
5. If no exact match exists, guide the customer to the closest wholesome pairing in the catalog.

${ragContext.formattedContext}
`;

    // 3. Prepare message chain for LLM
    const formattedHistory = Array.isArray(history)
      ? history
          .slice(-4)
          .filter(
            (msg: { role?: string; content?: string }) =>
              msg && msg.content && (msg.role === 'user' || msg.role === 'assistant')
          )
          .map((msg: { role: 'user' | 'assistant'; content: string }) => ({
            role: msg.role,
            content: msg.content,
          }))
      : [];

    // 4. Generation Step via NVIDIA NIM
    const completion = await nvidiaClient.chat.completions.create({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: cleanQuery },
      ],
      max_tokens: 1024,
      temperature: 0.6,
    });

    const choice = completion.choices[0];
    let replyText = choice?.message?.content || '';

    // If content was empty due to reasoning buffer, fallback cleanly
    if (!replyText.trim() && (choice?.message as { reasoning_content?: string })?.reasoning_content) {
      replyText =
        'Here are our recommended farm-fresh selections tailored to your health goals. You can add them directly to your bag below!';
    }

    return NextResponse.json({
      success: true,
      reply: replyText.trim(),
      products: ragContext.products,
    });
  } catch (error: unknown) {
    console.error('NVIDIA RAG Assistant error:', error);
    const msg = error instanceof Error ? error.message : 'AI assistant error';
    return NextResponse.json(
      {
        error: msg,
        reply:
          'I am having trouble connecting to our live advisory engine right now. In the meantime, you can explore our farm-fresh cashews, almonds, and super-seeds in the shop!',
        products: [],
      },
      { status: 500 }
    );
  }
}
