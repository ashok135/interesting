import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer } from '@/lib/api/customers';
import { createSessionToken } from '@/lib/auth/session';

interface GoogleUserInfo {
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const isDevMock = searchParams.get('dev_mock') === 'true';

  let googleUser: GoogleUserInfo;

  if (isDevMock) {
    // Local dev mock user to test Google flow before user adds real Google Cloud keys
    googleUser = {
      email: 'ashok.google@example.com',
      name: 'Ashok Chingari',
      given_name: 'Ashok',
      family_name: 'Chingari',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
    };
  } else if (!code) {
    return NextResponse.redirect(new URL('/login?error=Google+login+was+cancelled', req.url));
  } else {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

      // 1. Exchange code for Google access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        console.error('Google token error:', await tokenRes.text());
        return NextResponse.redirect(new URL('/login?error=Failed+to+exchange+Google+token', req.url));
      }

      const tokens = await tokenRes.json();

      // 2. Fetch Google user profile
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userRes.ok) {
        return NextResponse.redirect(new URL('/login?error=Failed+to+fetch+Google+profile', req.url));
      }

      googleUser = await userRes.json();
    } catch (err) {
      console.error('OAuth callback error:', err);
      return NextResponse.redirect(new URL('/login?error=Google+authentication+failed', req.url));
    }
  }

  try {
    // 3. Sync customer with WooCommerce (find existing or create new customer)
    const customer = await getOrCreateCustomer({
      email: googleUser.email,
      first_name: googleUser.given_name || googleUser.name.split(' ')[0] || '',
      last_name: googleUser.family_name || googleUser.name.split(' ').slice(1).join(' ') || '',
      avatar_url: googleUser.picture,
    });

    // 4. Create secure session
    const sessionUser = {
      id: customer.id,
      email: customer.email,
      name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
      avatar: googleUser.picture || customer.avatar_url,
      provider: 'google' as const,
    };

    const token = createSessionToken(sessionUser);
    const redirectTarget = new URL('/account', req.url);
    const response = NextResponse.redirect(redirectTarget);

    response.cookies.set('intersting_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    });

    return response;
  } catch (syncError) {
    console.error('WooCommerce sync error during Google login:', syncError);
    return NextResponse.redirect(new URL('/login?error=Could+not+synchronize+with+WooCommerce', req.url));
  }
}
