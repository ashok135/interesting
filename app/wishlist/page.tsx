'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/store/WishlistContext';
import { ProductGrid } from '@/components/product';
import { ProductGridSkeleton } from '@/components/ui';
import type { WooProduct } from '@/types';
import styles from './page.module.css';

async function fetchWishlistProducts(ids: number[]): Promise<WooProduct[]> {
  if (ids.length === 0) return [];
  const res = await fetch(`/api/wishlist?ids=${ids.join(',')}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.products || [];
}

export default function WishlistPage() {
  const { wishlistIds, clearWishlist } = useWishlist();

  // TanStack Query with instant cache
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['wishlist', wishlistIds],
    queryFn: () => fetchWishlistProducts(wishlistIds),
    enabled: wishlistIds.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>My Wishlist</h1>
            {wishlistIds.length > 0 && (
              <span className={styles.badge}>
                {wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          {wishlistIds.length > 0 && (
            <button
              type="button"
              onClick={clearWishlist}
              className={styles.clearBtn}
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Heart size={44} strokeWidth={1.5} color="#94a3b8" />
            </div>
            <h2 className={styles.emptyTitle}>Your Wishlist is Empty</h2>
            <p className={styles.emptySub}>
              Explore our single-origin roasted cashews, premium saffron, and dry fruits to save your favorites for later.
            </p>
            <Link href="/shop" className={styles.shopBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Explore Fresh Harvest <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <ProductGrid products={products} hideHeader={true} />
        )}
      </div>
    </div>
  );
}
