import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail } from '@/lib/api/customers';
import { createSessionToken } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please enter both email and password.' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const customer = await findCustomerByEmail(trimmedEmail);

    if (!customer) {
      return NextResponse.json(
        { error: 'No account found with this email. Please sign up first.' },
        { status: 404 }
      );
    }

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
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
