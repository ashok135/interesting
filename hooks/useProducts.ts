'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { WooProduct } from '@/types';

export interface UseProductsOptions {
  category?: string;
  search?: string;
  page?: number;
  perPage?: number;
  orderby?: 'date' | 'popularity' | 'rating' | 'price';
  order?: 'asc' | 'desc';
  featured?: boolean;
  initialData?: WooProduct[];
}

async function fetchProductsApi(options: UseProductsOptions): Promise<WooProduct[]> {
  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.search) params.set('search', options.search);
  if (options.page) params.set('page', String(options.page));
  if (options.perPage) params.set('per_page', String(options.perPage));
  if (options.orderby) params.set('orderby', options.orderby);
  if (options.order) params.set('order', options.order);
  if (options.featured) params.set('featured', 'true');

  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await res.json();
  return data.products || [];
}

export function useProducts(options: UseProductsOptions = {}) {
  const { category, search, page = 1, perPage = 12, orderby = 'date', order, featured, initialData } = options;

  return useQuery<WooProduct[]>({
    queryKey: ['products', { category: category || '', search: search || '', page, perPage, orderby, order: order || '', featured: Boolean(featured) }],
    queryFn: () => fetchProductsApi({ category, search, page, perPage, orderby, order, featured }),
    initialData,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    gcTime: 1000 * 60 * 30, // 30 minutes in memory
    placeholderData: keepPreviousData,
  });
}
