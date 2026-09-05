import Link from 'next/link';
import { ProductCard } from './ProductCard/ProductCard';
import type { WooProduct } from '@/types';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: WooProduct[];
  title?: string;
  subtitle?: string;
  badge?: string;
  totalCount?: number;
  seeAllLink?: string;
}

export function ProductGrid({
  products,
  title = 'Cashew Heavens — Fresh Harvest W180 & W240',
  subtitle = 'Directly cured from Goan & Malabar orchards with guaranteed whole integrity',
  badge = 'Top Seller',
  totalCount = 14,
  seeAllLink = '/shop',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{title}</h2>
            {badge && <span className={styles.badge}>{badge}</span>}
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <Link href={seeAllLink} className={styles.seeAllLink}>
          <span>See All ({totalCount || products.length})</span>
          <span className={styles.chevron}>&gt;</span>
        </Link>
      </div>

      <div className={styles.grid}>
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </section>
  );
}
