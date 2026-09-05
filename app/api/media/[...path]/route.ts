import { NextRequest, NextResponse } from 'next/server';

const WC_URL = process.env.NEXT_PUBLIC_WC_URL || 'https://gusty-gravity.localsite.io';
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

    const imagePath = path.join('/');
    const targetUrl = `${WC_URL}/wp-content/uploads/${imagePath}`;

    const headers: Record<string, string> = {
      'User-Agent': 'NextJS-Media-Proxy/1.0',
    };

    if (WC_URL.includes('localsite.io') || (TUNNEL_USER && TUNNEL_PASSWORD)) {
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
