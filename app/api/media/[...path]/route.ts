import { NextRequest, NextResponse } from 'next/server';

const PROD_WC_URL = (process.env.NEXT_PUBLIC_WC_URL || process.env.WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');

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
    const targetUrl = `${PROD_WC_URL}/wp-content/uploads/${imagePath}`;

    // Direct 307 redirect to the production media URL
    // Allows browsers and CDNs to cache and load images directly from the production server
    return NextResponse.redirect(targetUrl, 307);
  } catch (error) {
    console.error('Media redirect error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
