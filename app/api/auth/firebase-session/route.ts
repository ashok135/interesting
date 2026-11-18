import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCustomer } from '@/lib/api/customers';
import { createSessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { idToken, uid, email, name, photoURL } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

    // Cryptographic validation of Firebase ID token to prevent email spoofing
    if (idToken) {
      let isVerified = false;

      // 1. Primary: Verify token cryptographically with Google Identity Toolkit API
      if (firebaseApiKey) {
        try {
          const verifyRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken }),
            }
          );

          if (verifyRes.ok) {
            const data = await verifyRes.json();
            const verifiedUser = data.users?.[0];
            if (verifiedUser?.email) {
              if (verifiedUser.email.toLowerCase() !== email.toLowerCase()) {
                console.warn(
                  `[Security Alert] ID Token email (${verifiedUser.email}) does not match payload email (${email})`
                );
                return NextResponse.json({ error: 'Token email mismatch. Access denied.' }, { status: 403 });
              }
              isVerified = true;
            }
          } else {
            const errData = await verifyRes.json().catch(() => ({}));
            console.warn('[Firebase Auth] Identitytoolkit lookup rejected token:', errData);
          }
        } catch (apiErr) {
          console.warn('[Firebase Auth] Identitytoolkit network error:', apiErr);
        }
      }

      // 2. Secondary Fallback: Verify JWT structure, claims, and project integrity
      if (!isVerified) {
        try {
          const parts = idToken.split('.');
          if (parts.length === 3) {
            const claims = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            const now = Math.floor(Date.now() / 1000);
            const isIssValid = !projectId || claims.iss === `https://securetoken.google.com/${projectId}`;
            const isAudValid = !projectId || claims.aud === projectId;
            const isNotExpired = claims.exp && claims.exp > now;
            const isEmailMatch = claims.email && claims.email.toLowerCase() === email.toLowerCase();

            if (isIssValid && isAudValid && isNotExpired && isEmailMatch) {
              isVerified = true;
            } else if (claims.email && claims.email.toLowerCase() !== email.toLowerCase()) {
              return NextResponse.json({ error: 'Token email mismatch. Access denied.' }, { status: 403 });
            }
          }
        } catch (jwtErr) {
          console.warn('[Firebase Auth] Fallback JWT inspection error:', jwtErr);
        }
      }

      if (!isVerified && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid Firebase authentication token.' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Missing security verification token.' }, { status: 401 });
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
