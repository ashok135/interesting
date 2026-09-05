import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail, createWooCustomer } from '@/lib/api/customers';
import { createSessionToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const existing = await findCustomerByEmail(trimmedEmail);

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    // Split name into first and last name
    const parts = (name || '').trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    // Create customer in WooCommerce
    const customer = await createWooCustomer({
      email: trimmedEmail,
      first_name: firstName,
      last_name: lastName,
      password,
    });

    const sessionUser = {
      id: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
      avatar: customer.avatar_url,
      provider: 'email' as const,
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
    console.error('Signup error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
