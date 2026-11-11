import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer } from '@/lib/api/customers';
import { createSessionToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { uid, email, name, photoURL } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const parts = (name || '').trim().split(' ');
    const firstName = parts[0] || email.split('@')[0];
    const lastName = parts.slice(1).join(' ') || '';

    // 1. Sync or create customer in WooCommerce backend
    const customer = await getOrCreateCustomer({
      email,
      first_name: firstName,
      last_name: lastName,
      avatar_url: photoURL || undefined,
    });

    // 2. Create customer session
    const sessionUser = {
      id: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
      avatar: photoURL || customer.avatar_url,
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
    const message = error instanceof Error ? error.message : 'Failed to establish session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
