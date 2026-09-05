import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // If Google credentials are not yet configured in .env.local, provide smooth local dev testing
  if (!clientId || clientId.includes('your_google_client_id')) {
    const devTestRedirect = new URL('/api/auth/google/callback?dev_mock=true', req.url);
    return NextResponse.redirect(devTestRedirect);
  }

  // Standard Google OAuth 2.0 authorization URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl);
}
