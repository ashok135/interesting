import Link from 'next/link';
import { getProducts, getFeaturedProducts, getCategories } from '@/lib/api/products';
import { HomePageExplorerContainer } from '@/components/home/HomePageExplorerContainer';
import type { WooProduct, WooProductCategory } from '@/types';
import styles from './page.module.css';

// Revalidate homepage every 60 seconds (Incremental Static Regeneration)
export const revalidate = 60;

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<{ data: T; error: boolean }> {
  try {
    const data = await fn();
    return { data, error: false };
  } catch (err) {
    console.error('WooCommerce fetch error:', err);
    return { data: fallback, error: true };
  }
}

export default async function HomePage() {
  const [featuredRes, allProductsRes, categoriesRes] = await Promise.all([
    safeFetch(() => getFeaturedProducts(4), [] as WooProduct[]),
    safeFetch(() => getProducts({ perPage: 100, orderby: 'date' }), [] as WooProduct[]),
    safeFetch(() => getCategories(), [] as WooProductCategory[]),
  ]);

  const featured = featuredRes.data;
  const allProducts = allProductsRes.data;
  const categories = categoriesRes.data;

  // Use live WooCommerce products if present, else use the screenshot showcase products
  // Extract Nuts products for initial category SSR hydration
  const nutsProducts = allProducts.filter((p) =>
    p.categories?.some((c) => c.id === 25 || c.slug === 'nuts' || c.name.toLowerCase() === 'nuts')
  );
  const heroProduct = featured[0] ?? nutsProducts[0] ?? allProducts[0];

  return (
    <div className={styles.page}>
      <HomePageExplorerContainer
        categories={categories}
        allProducts={allProducts}
      />
    </div>
  );
}
