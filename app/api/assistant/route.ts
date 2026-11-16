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

    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        {
          error: 'NVIDIA_API_KEY is not configured in server environment.',
          reply:
            'I am currently undergoing routine maintenance. In the meantime, please feel free to explore our farm-fresh cashews, almonds, and super-seeds in our catalog!',
          products: [],
        },
        { status: 503 }
      );
    }

    const cleanQuery = message.trim();

    // 1. RAG Retrieval Step: Vector search in Qdrant + live inventory grounding (RIG)
    const ragContext = await retrieveRagContext(cleanQuery);

    // 2. Strict Grounding System Prompt
    const systemPrompt = `You are "Tara", the AI Nutritionist & Concierge for "Interesting" — a luxury farm-fresh dry fruits, nuts, super-seeds, and artisanal hampers store in India.

ROLE & GUIDELINES:
1. If the customer is greeting or asking general questions, welcome them warmly in 1-2 concise sentences.
2. If the customer asks about orders or tracking, guide them to [My Account > Orders](/account) and provide our helpline. Do NOT recommend products.
3. If the customer asks about shipping, returns, or payment, reference the provided Store Policies accurately.
4. If the customer asks for food, nuts, seeds, or gift recommendations, recommend ONLY from the provided "Live Store Products" catalog with exact price in ₹ (INR) and health benefits (protein, fiber, healthy fats, omega-3).
5. Keep answers concise, polite, encouraging, and natural.

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
      max_tokens: 800,
      temperature: 0.5,
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
