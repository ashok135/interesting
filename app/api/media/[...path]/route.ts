import { NextRequest, NextResponse } from 'next/server';

const PROD_WC_URL = (process.env.NEXT_PUBLIC_WC_URL || process.env.WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Image path required', { status: 400 });
    }

    const imagePath = pathSegments.join('/');
    // Prevent path traversal or arbitrary URL redirection
    if (
      imagePath.includes('..') ||
      imagePath.includes('\\') ||
      !/^[a-zA-Z0-9/_\-.]+$/.test(imagePath)
    ) {
      return new NextResponse('Invalid media path', { status: 400 });
    }

    const targetUrl = `${PROD_WC_URL}/wp-content/uploads/${imagePath}`;

    // Redirect to authoritative WordPress media URL
    return NextResponse.redirect(targetUrl, 307);
  } catch (error) {
    console.error('Media serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
