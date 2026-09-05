import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/api/products';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ products: [] });
    }

    const products = await getProducts({
      search: query.trim(),
      perPage: 6,
    });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name.replace(/&amp;/g, '&'),
        slug: p.slug,
        price: p.price,
        regular_price: p.regular_price,
        image: p.images?.[0]?.src || '',
        category: p.categories?.[0]?.name || '',
        stock_status: p.stock_status,
      })),
    });
  } catch (error: unknown) {
    console.error('Search API error:', error);
    const msg = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ error: msg, products: [] }, { status: 500 });
  }
}
