import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/api/products';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ products: [] });
    }

    const ids = idsParam
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = await getProducts({
      include: ids,
      perPage: ids.length,
    });

    return NextResponse.json({ products });
  } catch (error: unknown) {
    console.error('Wishlist fetch error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch wishlist products';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
