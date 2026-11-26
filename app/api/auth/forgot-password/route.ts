import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(req, { limit: 5, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset requests. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Always return a uniform response regardless of whether the account exists (prevents email enumeration)
    return NextResponse.json({
      success: true,
      message:
        'If an account exists for this email, you can reset your password using your email link or contact customer concierge on WhatsApp (+91 99948 47167) for assisted recovery.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process password reset. Please try again.' }, { status: 500 });
  }
}
