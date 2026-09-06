'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Layers, ArrowRight, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { ProductCard } from '../ProductCard/ProductCard';
import { getCategoryHeader } from '../categoryHeaders';
import { ProductCardSkeleton } from '@/components/ui';
import { useProducts } from '@/hooks/useProducts';
import type { WooProduct, WooProductCategory } from '@/types';
import styles from './ZeptoCategoryExplorer.module.css';

interface ZeptoCategoryExplorerProps {
  categories?: WooProductCategory[];
  fallbackProducts?: WooProduct[];
  externalActiveCategoryId?: number;
  onSelectCategoryId?: (id: number) => void;
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

export function ZeptoCategoryExplorer({
  categories = [],
  fallbackProducts = [],
  externalActiveCategoryId,
  onSelectCategoryId,
}: ZeptoCategoryExplorerProps) {
  // 1. Parent categories directly from WooCommerce (parent === 0, exclude uncategorized)
  const parentCategories = useMemo(() => {
    return (categories || [])
      .filter((c) => c.parent === 0 && c.slug !== 'uncategorized')
      .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));
  }, [categories]);

  // Active parent category ID
  const [internalActiveCategoryId, setInternalActiveCategoryId] = useState<number>(() => {
    return externalActiveCategoryId || parentCategories[0]?.id || 25;
  });

  const activeCategoryId =
    externalActiveCategoryId !== undefined ? externalActiveCategoryId : internalActiveCategoryId;

  const setActiveCategoryId = (id: number) => {
    setInternalActiveCategoryId(id);
    if (onSelectCategoryId) {
      onSelectCategoryId(id);
    }
  };

  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [showAll, setShowAll] = useState<boolean>(false);

  // Reset subcategory and showAll when active category changes
  useEffect(() => {
    setActiveSubcategory('All');
    setShowAll(false);
  }, [activeCategoryId]);

  // Keep active category synced if parent categories load asynchronously
  useEffect(() => {
    if (parentCategories.length > 0 && !parentCategories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(parentCategories[0].id);
      setShowAll(false);
    }
  }, [parentCategories, activeCategoryId]);

  // Listen to select-category events from CuratedCategoryBento or other components
  useEffect(() => {
    const handleCategorySelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ slug?: string; id?: number }>;
      if (!customEvent.detail) return;
      const { slug, id } = customEvent.detail;

      const matched = parentCategories.find((c) => {
        if (id && c.id === id) return true;
        if (slug) {
          const s = slug.toLowerCase();
          return (
            c.slug.toLowerCase() === s ||
            c.name.toLowerCase().includes(s) ||
            s.includes(c.slug.toLowerCase())
          );
        }
        return false;
      });

      if (matched) {
        setActiveCategoryId(matched.id);
        setActiveSubcategory('All');
        setShowAll(false);
      }
    };

    window.addEventListener('select-category', handleCategorySelect);
    return () => window.removeEventListener('select-category', handleCategorySelect);
  }, [parentCategories]);

  const activeCategory = useMemo(() => {
    return parentCategories.find((c) => c.id === activeCategoryId) || parentCategories[0];
  }, [parentCategories, activeCategoryId]);

  // 2. Subcategories directly from WooCommerce child categories (parent === activeCategoryId)
  const activeSubcategories = useMemo(() => {
    if (!activeCategory) return ['All'];
    const children = (categories || [])
      .filter((c) => c.parent === activeCategory.id)
      .map((c) => c.name);
    return ['All', ...children];
  }, [categories, activeCategory]);

  // 3. Products directly fetched from WooCommerce using TanStack Query
  const { data: fetchedProducts = [], isLoading } = useProducts({
    category: activeCategory ? String(activeCategory.id) : undefined,
    perPage: 30,
    initialData:
      activeCategory?.id === 25 && fallbackProducts.length > 0 ? fallbackProducts : undefined,
  });

  // Filter products strictly by active parent category and selected subcategory
  const displayedProducts = useMemo(() => {
    const rawList = fetchedProducts.length > 0 ? fetchedProducts : fallbackProducts;

    // Strictly ensure only products belonging to the selected parent category are included
    const list = rawList.filter((p) => {
      if (!activeCategory) return true;
      return p.categories?.some(
        (c) =>
          c.id === activeCategory.id ||
          c.slug === activeCategory.slug ||
          c.name.toLowerCase() === activeCategory.name.toLowerCase()
      );
    });

    if (activeSubcategory === 'All') return list;

    // Filter by subcategory keyword matching WooCommerce category name or product attributes
    const cleanSub = activeSubcategory.toLowerCase().replace(/\(.*?\)/g, '').trim();
    const filtered = list.filter((p) => {
      const matchCat = p.categories?.some((c) => {
        const catName = c.name.toLowerCase();
        return catName.includes(cleanSub) || cleanSub.includes(catName);
      });
      if (matchCat) return true;

      const name = p.name.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const shortDesc = (p.short_description || '').toLowerCase();
      return name.includes(cleanSub) || desc.includes(cleanSub) || shortDesc.includes(cleanSub);
    });

    return filtered;
  }, [fetchedProducts, fallbackProducts, activeCategory, activeSubcategory]);

  const INITIAL_LIMIT = 10;
  const hasMoreThanLimit = displayedProducts.length > INITIAL_LIMIT;
  const visibleProducts = useMemo(() => {
    if (showAll || !hasMoreThanLimit) {
      return displayedProducts;
    }
    return displayedProducts.slice(0, INITIAL_LIMIT);
  }, [displayedProducts, showAll, hasMoreThanLimit]);

  const handleCategoryChange = (catId: number) => {
    setActiveCategoryId(catId);
    setActiveSubcategory('All');
    setShowAll(false);
  };

  const handleSubcategoryChange = (sub: string) => {
    setActiveSubcategory(sub);
    setShowAll(false);
  };

  if (!parentCategories || parentCategories.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Quick Category Explorer">
      {/* 1. Category Circles Bar (Zepto / Zomato Style) */}
      <div className={styles.categoryBarContainer}>
        <div className={styles.categoryScroll}>
          {parentCategories.map((cat, idx) => {
            const isActive = cat.id === activeCategoryId;
            const imgSrc = CATEGORY_IMAGES[cat.slug] || '/images/categories/nuts.jpg';

            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.catButton} ${isActive ? styles.catButtonActive : ''}`}
                onClick={() => handleCategoryChange(cat.id)}
                aria-pressed={isActive}
              >
                <div className={`${styles.circleRing} ${isActive ? styles.circleRingActive : ''}`}>
                  <Image
                    src={imgSrc}
                    alt={cat.name}
                    width={54}
                    height={54}
                    className={styles.catImg}
                    unoptimized
                  />
                </div>
                <span className={styles.catName}>
                  {idx + 1}. {cat.name}
                </span>
                {isActive && <span className={styles.activeDot} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Subcategory Header & Filter Pills (Zepto / Zomato Quick Commerce) */}
      <div className={styles.subcategoryWrapper}>
        {(() => {
          const headerInfo = activeCategory
            ? getCategoryHeader(activeCategory.slug, activeCategory.name)
            : null;
          return (
            <div className={styles.categoryMetaHeader}>
              <div className={styles.metaLeft}>
                <div className={styles.titleRow}>
                  <h2 className={styles.activeCategoryTitle}>
                    {activeCategory ? activeCategory.name.replace('&amp;', '&') : 'All Products'}
                  </h2>
                  <span className={styles.activeCategoryBadge}>
                    <Sparkles size={11} /> {headerInfo ? headerInfo.badge : '100% Direct Harvest'}
                  </span>
                </div>
                <p className={styles.metaSubtitle}>
                  {headerInfo ? headerInfo.subtitle : 'Direct whole harvest • Delivered fresh in 15–30 mins'}
                </p>
              </div>

              <span className={styles.productCountBadge}>
                {displayedProducts.length} items
              </span>
            </div>
          );
        })()}

        {/* Subcategories Horizontal Filter Chips directly from WooCommerce */}
        {activeSubcategories.length > 1 && (
          <div className={styles.subcategoriesScroll} role="tablist">
            {activeSubcategories.map((sub) => {
              const isSubActive = sub === activeSubcategory;
              return (
                <button
                  key={sub}
                  type="button"
                  role="tab"
                  aria-selected={isSubActive}
                  className={`${styles.subChip} ${isSubActive ? styles.subChipActive : ''}`}
                  onClick={() => handleSubcategoryChange(sub)}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Vertically Scrollable 2-Column Product Feed (Not Horizontal!) */}
      <div className={styles.verticalScrollFeed}>
        {isLoading && displayedProducts.length === 0 ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className={styles.emptyCard}>
            <Layers size={32} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Fresh stock arriving soon</h3>
            <p className={styles.emptySub}>
              We are curing fresh orchard batches for {activeCategory?.name || 'this category'}.
            </p>
            <button
              type="button"
              onClick={() => handleCategoryChange(parentCategories[0]?.id || 25)}
              className={styles.emptyBtn}
            >
              Explore {parentCategories[0]?.name || 'Nuts'} <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {visibleProducts.map((product, idx) => (
                <ProductCard key={product.id} product={product} index={idx} />
              ))}
            </div>

            {/* Instamart Style "View All" Expansion / Navigation */}
            {hasMoreThanLimit ? (
              <div className={styles.instamartViewAllContainer}>
                <button
                  type="button"
                  className={styles.instamartViewAllBtn}
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      <span>
                        View All {displayedProducts.length} Items in {activeCategory?.name}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <Link
                  href={`/shop?category=${activeCategory?.slug || ''}`}
                  className={styles.instamartShopLink}
                >
                  Explore complete collection in Shop <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div className={styles.instamartCatalogRow}>
                <span className={styles.endOfCategoryText}>
                  Showing all {displayedProducts.length} items in {activeCategory?.name}
                </span>
                <Link
                  href={`/shop?category=${activeCategory?.slug || ''}`}
                  className={styles.instamartShopLink}
                >
                  Browse Shop <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
