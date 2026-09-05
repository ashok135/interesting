import type { Metadata } from 'next';
import { getProducts, getCategories } from '@/lib/api/products';
import { ShopClient } from '@/components/shop/ShopClient';

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
    orderby?: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse all premium nuts and dry fruits. Filter by category.',
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const { category, search, page = '1', orderby = 'date' } = params;

  const [products, categories] = await Promise.all([
    getProducts({
      category,
      search,
      page: parseInt(page, 10),
      orderby: orderby as 'date' | 'popularity' | 'rating' | 'price',
      perPage: 100,
    }),
    getCategories(),
  ]);

  return (
    <ShopClient
      initialProducts={products}
      categories={categories}
      initialCategory={category}
      initialSearch={search}
    />
  );
}

