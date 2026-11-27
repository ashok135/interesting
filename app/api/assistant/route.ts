import { NextRequest, NextResponse } from 'next/server';
import { runAgenticRag } from '@/lib/rag/agenticEngine';
import { checkRateLimit } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 30 requests per minute per IP
    const rl = checkRateLimit(req, { limit: 30, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded.',
          reply: 'You are asking questions a bit too fast! Please pause for a few seconds and try again.',
          products: [],
          suggestions: [],
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.resetSec) },
        }
      );
    }

    const body = await req.json();
    const { message, history, order } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Please enter a message.' },
        { status: 400 }
      );
    }

    const cleanMessage = message.trim().slice(0, 500);

    const formattedHistory = Array.isArray(history)
      ? history
          .slice(-8)
          .filter(
            (msg: { role?: string; content?: string }) =>
              msg && typeof msg.content === 'string' && (msg.role === 'user' || msg.role === 'assistant')
          )
          .map((msg: { role: 'user' | 'assistant'; content: string }) => ({
            role: msg.role,
            content: msg.content.slice(0, 500),
          }))
      : [];

    const agenticResponse = await runAgenticRag(cleanMessage, formattedHistory, order || null);

    return NextResponse.json(agenticResponse);
  } catch (error: unknown) {
    console.error('Agentic RAG Assistant error:', error);
    const msg = error instanceof Error ? error.message : 'AI assistant error';
    return NextResponse.json(
      {
        success: false,
        error: msg,
        reply:
          'I am having trouble connecting to our live concierge right now. Feel free to explore our farm-fresh cashews, almonds, and super-seeds directly in the shop!',
        products: [],
        suggestions: ['👑 Best King Cashews', '🌰 Raw Almonds under ₹500', '🎁 Luxury Gift Hampers'],
      },
      { status: 500 }
    );
  }
}
