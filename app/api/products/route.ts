import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/api/products';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('per_page') || '12', 10);
    const orderby = (searchParams.get('orderby') as 'date' | 'popularity' | 'rating' | 'price') || 'date';
    const order = (searchParams.get('order') as 'asc' | 'desc') || undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;

    const products = await getProducts({
      category,
      search,
      page,
      perPage,
      orderby,
      order,
      featured,
    });

    return NextResponse.json({ products });
  } catch (error: unknown) {
    console.error('Products API error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json({ error: msg, products: [] }, { status: 500 });
  }
}
