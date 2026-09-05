import crypto from 'crypto';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: number; // WooCommerce Customer ID
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'email';
}

const COOKIE_NAME = 'intersting_session';
const SECRET_KEY = process.env.SESSION_SECRET || 'intersting-headless-secret-key-2026-production';
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days in seconds

/**
 * Signs and encrypts user data into a token
 */
export function createSessionToken(user: AuthUser): string {
  const payload = JSON.stringify({
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('base64url');

  const encodedPayload = Buffer.from(payload).toString('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token
 */
export function verifySessionToken(token: string): AuthUser | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64url');

    if (signature !== expectedSignature) return null;

    const data = JSON.parse(payload);
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.avatar,
      provider: data.provider,
    };
  } catch {
    return null;
  }
}

import type { NextRequest } from 'next/server';

/**
 * Gets the current authenticated user from Next.js cookies or request
 */
export async function getCurrentUser(req?: NextRequest): Promise<AuthUser | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies?.get(COOKIE_NAME)?.value;
    if (!token) {
      const cookieHeader = req.headers.get('cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
        if (match) token = match[1];
      }
    }
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch {
      // ignore
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}
