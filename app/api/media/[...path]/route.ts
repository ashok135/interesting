import { NextRequest, NextResponse } from 'next/server';

let WC_URL = (process.env.NEXT_PUBLIC_WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');
if (WC_URL.includes('interesting.local') && (process.env.VERCEL || process.env.NODE_ENV === 'production')) {
  WC_URL = 'https://intersting.duckdns.org';
}
const TUNNEL_USER = process.env.WC_TUNNEL_USER || 'pizzas';
const TUNNEL_PASSWORD = process.env.WC_TUNNEL_PASSWORD || 'tender';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return new NextResponse('Image path required', { status: 400 });
    }

    const currentWcUrl = (process.env.NEXT_PUBLIC_WC_URL || WC_URL).replace(/\/$/, '');
    const imagePath = path.join('/');
    const targetUrl = `${currentWcUrl}/wp-content/uploads/${imagePath}`;

    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Media-Proxy/1.0',
    };

    if (currentWcUrl.includes('localsite.io') && TUNNEL_USER && TUNNEL_PASSWORD) {
      const basicAuth = Buffer.from(`${TUNNEL_USER}:${TUNNEL_PASSWORD}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    const res = await fetch(targetUrl, {
      headers,
      next: { revalidate: 86400 }, // Cache on server for 24h
    });

    if (!res.ok) {
      return new NextResponse(`Upstream image error: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Media proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
