/**
 * WooCommerce Products API
 * All product-related API calls isolated in one file
 */

import { wcFetch } from '@/lib/api/client';
import type { WooProduct, WooProductCategory } from '@/types';

interface GetProductsOptions {
  perPage?: number;
  page?: number;
  category?: string;
  featured?: boolean;
  search?: string;
  orderby?: 'date' | 'popularity' | 'rating' | 'price';
  order?: 'asc' | 'desc';
  include?: number[];
}

export async function getProducts(options: GetProductsOptions = {}): Promise<WooProduct[]> {
  const {
    perPage = 20,
    page = 1,
    category,
    featured,
    search,
    orderby = 'date',
    order = 'desc',
    include,
  } = options;

  const params: Record<string, string | number | boolean> = {
    per_page: perPage,
    page,
    orderby,
    order,
  };

  const CATEGORY_SLUG_MAP: Record<string, number> = {
    'nuts': 25,
    'seeds': 26,
    'dry-fruits': 27,
    'millets': 28,
    'roasted-snacks': 29,
    'flavoured-nuts': 30,
    'trail-mix': 31,
    'traditional-snacks': 32,
    'premium-gift-packs': 33,
    'nuts-kaju': 25,
    'super-seeds': 26,
    'millet-crisps': 28,
    'vitality-trail': 31,
    'halwai-snacks': 32,
    'royal-hampers': 33,
  };

  if (category) {
    if (/^\d+$/.test(category)) {
      params.category = category;
    } else if (CATEGORY_SLUG_MAP[category]) {
      params.category = CATEGORY_SLUG_MAP[category];
    } else {
      params.category = category;
    }
  }
  if (featured !== undefined) params.featured = featured;
  if (search) params.search = search;
  if (include && include.length > 0) params.include = include.join(',');

  return wcFetch<WooProduct[]>('products', {
    params,
    revalidate: 60, // ISR: revalidate every 60 seconds
  });
}

export async function getProductBySlug(slug: string): Promise<WooProduct | null> {
  const products = await wcFetch<WooProduct[]>('products', {
    params: { slug },
    revalidate: 60,
  });
  return products[0] ?? null;
}

export async function getProductById(id: number): Promise<WooProduct> {
  return wcFetch<WooProduct>(`products/${id}`, { revalidate: 60 });
}

export async function getFeaturedProducts(limit = 8): Promise<WooProduct[]> {
  return getProducts({ featured: true, perPage: limit });
}

export async function getRelatedProducts(
  productId: number,
  categoryId?: number,
  limit = 4
): Promise<WooProduct[]> {
  const params: Record<string, string | number | boolean> = {
    per_page: limit,
    exclude: productId,
  };
  if (categoryId) params.category = categoryId;

  return wcFetch<WooProduct[]>('products', { params, revalidate: 60 });
}

export async function getCategories(): Promise<WooProductCategory[]> {
  const categories = await wcFetch<WooProductCategory[]>('products/categories', {
    params: { per_page: 100, hide_empty: false },
    revalidate: 60,
  });
  return (categories || []).sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await wcFetch<Array<{ slug: string }>>('products', {
    params: { per_page: 100, fields: 'slug' },
    revalidate: 300,
  });
  return products.map((p) => p.slug);
}
