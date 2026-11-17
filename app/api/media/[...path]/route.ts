import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PROD_WC_URL = (process.env.NEXT_PUBLIC_WC_URL || process.env.WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');
const LOCAL_PRODUCTS_DIR = path.join(process.cwd(), 'public', 'images', 'products');

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
    const filename = pathSegments[pathSegments.length - 1];
    const basename = filename.replace(/\.[^.]+$/, '');
    
    // 1. Check if optimized WebP exists locally in public/images/products
    const localWebpFile = path.join(LOCAL_PRODUCTS_DIR, `${basename}.webp`);
    if (fs.existsSync(localWebpFile)) {
      const buffer = fs.readFileSync(localWebpFile);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': String(buffer.length),
        },
      });
    }

    // 2. Check if local JPG fallback exists
    const localJpgFile = path.join(LOCAL_PRODUCTS_DIR, `${basename}.jpg`);
    if (fs.existsSync(localJpgFile)) {
      const buffer = fs.readFileSync(localJpgFile);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': String(buffer.length),
        },
      });
    }

    // 3. Not on local disk yet: fetch from WooCommerce, compress on the fly, and cache
    const targetUrl = `${PROD_WC_URL}/wp-content/uploads/${imagePath}`;
    try {
      const remoteRes = await fetch(targetUrl, { next: { revalidate: 86400 } });
      if (remoteRes.ok) {
        const arrayBuf = await remoteRes.arrayBuffer();
        const inputBuf = Buffer.from(arrayBuf);
        
        // Compress to high quality WebP
        const optimizedWebp = await sharp(inputBuf)
          .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 5 })
          .toBuffer();

        // Save to local cache directory for subsequent requests
        if (!fs.existsSync(LOCAL_PRODUCTS_DIR)) {
          fs.mkdirSync(LOCAL_PRODUCTS_DIR, { recursive: true });
        }
        fs.writeFileSync(localWebpFile, optimizedWebp);

        return new NextResponse(optimizedWebp, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': String(optimizedWebp.length),
          },
        });
      }
    } catch (compressErr) {
      console.warn('Failed on-the-fly image compression, redirecting to upstream:', compressErr);
    }

    // 4. Fallback 307 redirect
    return NextResponse.redirect(targetUrl, 307);
  } catch (error) {
    console.error('Media serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
