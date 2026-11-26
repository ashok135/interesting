import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail, verifyCustomerCredentials } from '@/lib/api/customers';
import { createSessionToken } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Brute force protection: 10 login attempts per minute per IP
    const rl = checkRateLimit(req, { limit: 10, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait a minute before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Please enter both email and password.' }, { status: 400 });
    }

    const trimmedEmail = String(email).toLowerCase().trim();
    const customer = await findCustomerByEmail(trimmedEmail);

    // Verify credentials even if customer lookup returned null, and return uniform 401 message to prevent email enumeration
    const isValid = customer ? await verifyCustomerCredentials(trimmedEmail, String(password)) : false;
    if (!customer || !isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please try again or use Google Sign-In.' },
        { status: 401 }
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
