import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || clientId.includes('your_google_client_id')) {
    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_AUTH_MOCK === 'true') {
      return NextResponse.redirect(new URL('/api/auth/google/callback?dev_mock=true', req.url));
    }
    return NextResponse.redirect(new URL('/login?error=Google+login+is+not+configured', req.url));
  }

  // Cryptographic OAuth state token for CSRF protection
  const state = crypto.randomBytes(24).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
