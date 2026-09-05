'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Layers } from 'lucide-react';
import type { WooProductCategory } from '@/types';
import styles from './CategoryBar.module.css';

interface CategoryBarProps {
  categories?: WooProductCategory[];
  activeSlug?: string;
  onSelectCategory?: (slug: string) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'nuts': '/images/categories/nuts.jpg',
  'seeds': '/images/categories/seeds.jpg',
  'dry-fruits': '/images/categories/dryfruits.jpg',
  'millets': '/images/categories/millets.jpg',
  'roasted-snacks': '/images/categories/roasted.jpg',
  'flavoured-nuts': '/images/categories/flavoured.jpg',
  'trail-mix': '/images/categories/trailmix.jpg',
  'traditional-snacks': '/images/categories/traditional.jpg',
  'premium-gift-packs': '/images/categories/gifts.jpg',
};

export function CategoryBar({ categories = [], activeSlug, onSelectCategory }: CategoryBarProps) {
  // Only parent categories directly from WooCommerce (parent === 0, exclude uncategorized)
  const parentCategories = categories
    .filter((c) => c.parent === 0 && c.slug !== 'uncategorized')
    .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));

  const isAllActive = !activeSlug || activeSlug === 'all';

  return (
    <nav className={styles.wrapper} aria-label="Product categories">
      <div className={styles.scroll}>
        {/* All Products pill */}
        <button
          type="button"
          onClick={() => onSelectCategory && onSelectCategory('all')}
          className={`${styles.item} ${isAllActive ? styles.active : ''}`}
          aria-pressed={isAllActive}
        >
          <div className={`${styles.circleWrap} ${isAllActive ? styles.activeRing : ''}`}>
            <Image
              src="/images/categories/all.jpg"
              alt="All Items"
              width={56}
              height={56}
              className={styles.catImage}
              unoptimized
            />
          </div>
          <span className={styles.label}>All Items</span>
        </button>

        {/* Parent Categories */}
        {parentCategories.map((cat) => {
          const isActive = activeSlug === cat.slug;
          const imgSrc = CATEGORY_IMAGES[cat.slug] || '/images/categories/nuts.jpg';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory && onSelectCategory(cat.slug)}
              className={`${styles.item} ${isActive ? styles.active : ''}`}
              aria-pressed={isActive}
            >
              <div className={`${styles.circleWrap} ${isActive ? styles.activeRing : ''}`}>
                <Image
                  src={imgSrc}
                  alt={cat.name}
                  width={56}
                  height={56}
                  className={styles.catImage}
                  unoptimized
                />
              </div>
              <span className={styles.label}>{cat.name.replace('&amp;', '&')}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
