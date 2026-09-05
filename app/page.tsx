import Link from 'next/link';
import { getProducts, getFeaturedProducts, getCategories } from '@/lib/api/products';
import { HomePageExplorerContainer } from '@/components/home/HomePageExplorerContainer';
import type { WooProduct, WooProductCategory } from '@/types';
import styles from './page.module.css';

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<{ data: T; error: boolean }> {
  try {
    const data = await fn();
    return { data, error: false };
  } catch (err) {
    console.error('WooCommerce fetch error:', err);
    return { data: fallback, error: true };
  }
}

const SHOWCASE_PRODUCTS = [
  {
    id: 101,
    name: 'Royal Jumbo W180 King Cashews',
    slug: 'royal-jumbo-w180-king-cashews',
    price: '449',
    regular_price: '549',
    sale_price: '449',
    on_sale: true,
    featured: true,
    stock_status: 'instock',
    manage_stock: false,
    stock_quantity: 50,
    short_description: '250g Tin • Whole Kernels',
    description: 'Certified Konkan GI whole kernels slow wood-fired with pink salt.',
    categories: [{ id: 1, name: 'Malabar Coast GI', slug: 'malabar-coast-gi' }],
    tags: [],
    images: [{ id: 1, src: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80', alt: 'Royal Jumbo W180 King Cashews', name: 'Royal Jumbo W180 King Cashews' }],
    attributes: [],
    average_rating: '0',
    rating_count: 0,
    sku: 'CASHEW-W180-250G',
  },
  {
    id: 102,
    name: 'Kashmiri Kesar & Honey Glazed Kaju',
    slug: 'kashmiri-kesar-honey-glazed-kaju',
    price: '549',
    regular_price: '649',
    sale_price: '549',
    on_sale: true,
    featured: true,
    stock_status: 'instock',
    manage_stock: false,
    stock_quantity: 40,
    short_description: '200g Jar • Mongra Grade A1',
    description: 'Glazed with pure Kashmiri saffron honey and slow roasted to golden perfection.',
    categories: [{ id: 2, name: 'Pampore Valley Saffron', slug: 'pampore-valley-saffron' }],
    tags: [],
    images: [{ id: 2, src: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80', alt: 'Kashmiri Kesar & Honey Glazed Kaju', name: 'Kashmiri Kesar & Honey Glazed Kaju' }],
    attributes: [],
    average_rating: '0',
    rating_count: 0,
    sku: 'CASHEW-KESAR-200G',
  },
  {
    id: 103,
    name: 'W240 Lightly Salted Crispy Cashew',
    slug: 'w240-lightly-salted-crispy-cashew',
    price: '699',
    regular_price: '799',
    sale_price: '699',
    on_sale: true,
    featured: false,
    stock_status: 'instock',
    manage_stock: false,
    stock_quantity: 60,
    short_description: '500g Value Pack',
    description: 'Crispy slow-roasted W240 grade cashews seasoned with crushed pink Himalayan rock salt.',
    categories: [{ id: 3, name: 'Himalayan Rock Salt', slug: 'himalayan-rock-salt' }],
    tags: [],
    images: [{ id: 3, src: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80', alt: 'W240 Lightly Salted Crispy Cashew', name: 'W240 Lightly Salted Crispy Cashew' }],
    attributes: [],
    average_rating: '0',
    rating_count: 0,
    sku: 'CASHEW-SALT-500G',
  },
  {
    id: 104,
    name: 'Roasted Salt & Pepper W180 Kaju',
    slug: 'roasted-salt-pepper-w180-kaju',
    price: '499',
    regular_price: '599',
    sale_price: '499',
    on_sale: true,
    featured: true,
    stock_status: 'instock',
    manage_stock: false,
    stock_quantity: 35,
    short_description: '250g Tin • Whole Kernels',
    description: 'Wood fired with fresh tellicherry black pepper and Konkan sea salt.',
    categories: [{ id: 4, name: 'Malabar Coast GI', slug: 'malabar-coast-gi' }],
    tags: [],
    images: [{ id: 4, src: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80', alt: 'Roasted Salt & Pepper W180 Kaju', name: 'Roasted Salt & Pepper W180 Kaju' }],
    attributes: [],
    average_rating: '0',
    rating_count: 0,
    sku: 'CASHEW-PEPPER-250G',
  },
];

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
