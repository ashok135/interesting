import { getProducts, getCategories } from '@/lib/api/products';
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
  const [allProductsRes, categoriesRes] = await Promise.all([
    safeFetch(() => getProducts({ perPage: 100, orderby: 'date' }), [] as WooProduct[]),
    safeFetch(() => getCategories(), [] as WooProductCategory[]),
  ]);

  const allProducts = allProductsRes.data;
  const categories = categoriesRes.data;

  return (
    <div className={styles.page}>
      <HomePageExplorerContainer
        categories={categories}
        allProducts={allProducts}
      />
    </div>
  );
}
