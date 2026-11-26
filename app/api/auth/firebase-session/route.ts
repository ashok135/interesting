import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer } from '@/lib/api/customers';
import { createSessionToken } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(req, { limit: 15, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const { idToken, name, photoURL } = await req.json();

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing Firebase verification token.' }, { status: 401 });
    }

    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      console.error('[Firebase Auth] Missing Firebase API key configuration.');
      return NextResponse.json({ error: 'Authentication service is not configured.' }, { status: 503 });
    }

    // Strict cryptographic verification with Google Identity Toolkit (fail closed — never trust unverified JWT payloads)
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        cache: 'no-store',
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Invalid or expired authentication token.' }, { status: 401 });
    }

    const data = await verifyRes.json();
    const verifiedUser = data.users?.[0];
    if (!verifiedUser?.email || verifiedUser.emailVerified === false) {
      return NextResponse.json({ error: 'Verified email is required for sign-in.' }, { status: 401 });
    }

    const verifiedEmail = String(verifiedUser.email).toLowerCase().trim();
    const verifiedName = String(verifiedUser.displayName || name || verifiedEmail.split('@')[0]).trim();
    const verifiedPhoto = verifiedUser.photoUrl || photoURL || undefined;

    const parts = verifiedName.split(/\s+/);
    const firstName = parts[0] || verifiedEmail.split('@')[0];
    const lastName = parts.slice(1).join(' ') || '';

    // 1. Sync or create customer in WooCommerce backend
    const customer = await getOrCreateCustomer({
      email: verifiedEmail,
      first_name: firstName,
      last_name: lastName,
      avatar_url: verifiedPhoto,
    });

    // 2. Create customer session
    const sessionUser = {
      id: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
      avatar: verifiedPhoto || customer.avatar_url,
      provider: 'google' as const,
    };

    const token = createSessionToken(sessionUser);
    const response = NextResponse.json({ success: true, user: sessionUser });

    response.cookies.set('intersting_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });

    return response;
  } catch (error: unknown) {
    console.error('Firebase session sync error:', error);
    return NextResponse.json({ error: 'Failed to establish session.' }, { status: 500 });
  }
}
