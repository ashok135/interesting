import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export interface AuthUser {
  id: number; // WooCommerce Customer ID
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'email';
}

const COOKIE_NAME = 'intersting_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days in seconds
const ORDER_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable must be configured (minimum 16 characters) in production.');
  }
  // Ephemeral random secret per dev process — never reuse a hardcoded static secret
  const g = globalThis as unknown as { __devSessionSecret?: string };
  if (!g.__devSessionSecret) {
    g.__devSessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return g.__devSessionSecret;
}

/**
 * Signs user data into an HMAC-SHA256 session token.
 */
export function createSessionToken(user: AuthUser): string {
  const payload = JSON.stringify({
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });

  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(payload);
  const signature = hmac.digest('base64url');

  const encodedPayload = Buffer.from(payload).toString('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a session token using constant-time comparison.
 */
export function verifySessionToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) return null;

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const hmac = crypto.createHmac('sha256', getSessionSecret());
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const data = JSON.parse(payload);
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    if (typeof data.id !== 'number' || typeof data.email !== 'string') {
      return null;
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

/**
 * Creates a short-lived signed capability token scoped to a single order ID (for guest invoice access).
 */
export function createOrderAccessToken(orderId: number, email?: string): string {
  const payload = JSON.stringify({
    oid: Number(orderId),
    eml: (email || '').toLowerCase().trim(),
    exp: Math.floor(Date.now() / 1000) + ORDER_TOKEN_MAX_AGE,
  });

  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(`order:${payload}`);
  const signature = hmac.digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

/**
 * Verifies an order-scoped invoice access token.
 */
export function verifyOrderAccessToken(token: string, orderId: number): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) return false;

    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const hmac = crypto.createHmac('sha256', getSessionSecret());
    hmac.update(`order:${payload}`);
    const expectedSignature = hmac.digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    const data = JSON.parse(payload);
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return Number(data.oid) === Number(orderId);
  } catch {
    return false;
  }
}

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
