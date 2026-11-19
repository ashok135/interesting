'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, Flame } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard/ProductCard';
import type { WooProduct, WooProductCategory } from '@/types';
import styles from './BestSellersSection.module.css';

interface BestSellersSectionProps {
  allProducts: WooProduct[];
  categories?: WooProductCategory[];
}

export function BestSellersSection({
  allProducts = [],
  categories = [],
}: BestSellersSectionProps) {
  // 1. Identify "Best Seller" or "Best Sellers" category in WooCommerce
  const bestSellerCat = useMemo(() => {
    return (categories || []).find((c) => {
      const slug = (c.slug || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      return (
        slug.includes('best-seller') ||
        slug.includes('bestseller') ||
        name.includes('best seller') ||
        name.includes('bestseller') ||
        slug === 'popular' ||
        name === 'popular'
      );
    });
  }, [categories]);

  // 2. Select products matching category, tags, or featured fallback
  const bestSellerProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    // Check by category ID or slug
    if (bestSellerCat) {
      const fromCat = allProducts.filter((p) =>
        p.categories?.some((c) => c.id === bestSellerCat.id || c.slug === bestSellerCat.slug)
      );
      if (fromCat.length > 0) return fromCat;
    }

    // Direct check across product categories
    const tagged = allProducts.filter((p) =>
      p.categories?.some((c) => {
        const s = (c.slug || '').toLowerCase();
        const n = (c.name || '').toLowerCase();
        return s.includes('best-seller') || s.includes('bestseller') || n.includes('best seller') || n.includes('bestseller');
      })
    );
    if (tagged.length > 0) return tagged;

    // Graceful fallback so the section looks stunning before category assignment:
    // Sort by total_sales or featured
    const bySales = allProducts
      .filter((p) => p.featured || (p.total_sales && p.total_sales > 0))
      .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0));

    if (bySales.length > 0) return bySales.slice(0, 8);

    return allProducts.slice(0, 8);
  }, [allProducts, bestSellerCat]);

  if (bestSellerProducts.length === 0) {
    return null;
  }

  const shopLink = bestSellerCat?.slug
    ? `/shop?category=${bestSellerCat.slug}`
    : '/shop';

  return (
    <section className={styles.section} aria-label="Best Sellers">
      {/* Header Row */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.tagWrap}>
            <span className={styles.tag}>
              <Flame size={13} className={styles.tagIcon} />
              CUSTOMER FAVORITES
            </span>
          </div>
          <h2 className={styles.heading}>
            {bestSellerCat?.name || 'Best Sellers'}
          </h2>
          <p className={styles.subheading}>
            Our most loved orchard-fresh dry fruits and gourmet snacks, curated for pure nutrition and royal taste.
          </p>
        </div>

        <Link href={shopLink} className={styles.viewAllBtn} title="Explore all best sellers">
          <span>View All Products</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Product Cards Grid */}
      <div className={styles.grid}>
        {bestSellerProducts.map((product, idx) => (
          <div key={product.id} className={styles.cardWrapper}>
            <ProductCard product={product} index={idx} />
          </div>
        ))}
      </div>
    </section>
  );
}
