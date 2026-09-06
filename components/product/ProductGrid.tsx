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
  hideHeader?: boolean;
}

export function ProductGrid({
  products,
  title,
  subtitle,
  badge,
  totalCount,
  seeAllLink = '/shop',
  hideHeader = false,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No products found.</p>
      </div>
    );
  }

  const showHeader = !hideHeader && Boolean(title);

  return (
    <section className={styles.section} aria-label={title || 'Product Grid'}>
      {showHeader && (
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
      )}

      <div className={styles.grid}>
        {products.map((product, idx) => (
          <ProductCard key={product.id} product={product} index={idx} />
        ))}
      </div>
    </section>
  );
}
