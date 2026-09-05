'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  X,
  Nut,
  Sprout,
  Grape,
  Wheat,
  Flame,
  Zap,
  Compass,
  Cookie,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { CategoryBar, ProductGrid } from '@/components/product';
import { ProductGridSkeleton } from '@/components/ui';
import { useProducts } from '@/hooks/useProducts';
import type { WooProduct, WooProductCategory } from '@/types';
import styles from '@/app/shop/page.module.css';

interface ShopClientProps {
  initialProducts: WooProduct[];
  categories: WooProductCategory[];
  initialCategory?: string;
  initialSearch?: string;
}

type SortOption = 'date' | 'price-asc' | 'price-desc' | 'rating' | 'popularity';

const CATEGORY_ICONS: Record<string, any> = {
  'nuts': Nut,
  'seeds': Sprout,
  'dry-fruits': Grape,
  'millets': Wheat,
  'roasted-snacks': Flame,
  'flavoured-nuts': Zap,
  'trail-mix': Compass,
  'traditional-snacks': Cookie,
  'premium-gift-packs': Gift,
};

export function ShopClient({
  initialProducts,
  categories,
  initialCategory,
  initialSearch,
}: ShopClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    initialCategory === 'all' ? undefined : initialCategory
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery] = useState<string | undefined>(initialSearch);
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Parse orderby and order for WooCommerce API
  const { orderbyParam, orderParam } = useMemo(() => {
    switch (sortBy) {
      case 'price-asc':
        return { orderbyParam: 'price' as const, orderParam: 'asc' as const };
      case 'price-desc':
        return { orderbyParam: 'price' as const, orderParam: 'desc' as const };
      case 'rating':
        return { orderbyParam: 'rating' as const, orderParam: 'desc' as const };
      case 'popularity':
        return { orderbyParam: 'popularity' as const, orderParam: 'desc' as const };
      case 'date':
      default:
        return { orderbyParam: 'date' as const, orderParam: 'desc' as const };
    }
  }, [sortBy]);

  // TanStack Query with in-memory caching
  const { data: rawProducts = [], isFetching, isLoading } = useProducts({
    category: selectedCategory,
    search: searchQuery,
    orderby: orderbyParam,
    order: orderParam,
    perPage: 100,
    initialData:
      !selectedCategory || selectedCategory === initialCategory ? initialProducts : undefined,
  });

  // Identify active parent category
  const activeParentCat = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((c) => c.slug === selectedCategory) || null;
  }, [categories, selectedCategory]);

  // Child subcategories for the active parent
  const subcategoryList = useMemo(() => {
    if (!activeParentCat) return [];
    return categories.filter((c) => c.parent === activeParentCat.id);
  }, [categories, activeParentCat]);

  // Filter products by subcategory if selected
  const products = useMemo(() => {
    if (selectedSubcategory === 'All') return rawProducts;

    const cleanSub = selectedSubcategory.toLowerCase().replace(/\(.*?\)/g, '').trim();
    return rawProducts.filter((p) => {
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
  }, [rawProducts, selectedSubcategory]);

  // Group products by parent category when "All" is active
  const categorySections = useMemo(() => {
    const parentCats = categories
      .filter((c) => c.parent === 0 && c.slug !== 'uncategorized')
      .sort((a, b) => (a.menu_order || 0) - (b.menu_order || 0));

    return parentCats
      .map((cat) => {
        const childIds = new Set(
          categories.filter((c) => c.parent === cat.id).map((c) => c.id)
        );

        const sectionProducts = rawProducts.filter((p) => {
          return p.categories?.some(
            (c) =>
              c.id === cat.id ||
              c.slug === cat.slug ||
              c.name.toLowerCase() === cat.name.toLowerCase() ||
              childIds.has(c.id)
          );
        });

        return {
          category: cat,
          products: sectionProducts,
        };
      })
      .filter((s) => s.products.length > 0);
  }, [categories, rawProducts]);

  const handleCategorySelect = (slug: string) => {
    const nextSlug = slug === 'all' || selectedCategory === slug ? undefined : slug;
    setSelectedCategory(nextSlug);
    setSelectedSubcategory('All');

    // Update browser URL without page reload
    const url = nextSlug ? `/shop?category=${nextSlug}` : '/shop';
    window.history.pushState(null, '', url);
  };

  const handleSubcategorySelect = (subName: string) => {
    setSelectedSubcategory(subName);
  };

  const clearAllFilters = () => {
    setSelectedCategory(undefined);
    setSelectedSubcategory('All');
    window.history.pushState(null, '', '/shop');
  };

  const HeaderIcon = selectedCategory ? CATEGORY_ICONS[selectedCategory] || Sparkles : Sparkles;
  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : activeParentCat
    ? activeParentCat.name.replace('&amp;', '&')
    : 'All Gourmet Pantry Essentials';

  const totalProductsCount = selectedCategory ? products.length : rawProducts.length;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Breadcrumb Bar */}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumbs">
          <Link href="/" className={styles.breadcrumbLink}>
            Home
          </Link>
          <span className={styles.breadcrumbDivider}>/</span>
          <Link href="/shop" className={styles.breadcrumbLink}>
            Shop
          </Link>
          {activeParentCat && (
            <>
              <span className={styles.breadcrumbDivider}>/</span>
              <span className={styles.breadcrumbCurrent}>
                {activeParentCat.name.replace('&amp;', '&')}
              </span>
            </>
          )}
          {selectedSubcategory !== 'All' && (
            <>
              <span className={styles.breadcrumbDivider}>/</span>
              <span className={styles.breadcrumbCurrent}>{selectedSubcategory}</span>
            </>
          )}
        </nav>

        {/* 1. Category Circles Bar (Zepto/Blinkit Style) */}
        <CategoryBar
          categories={categories}
          activeSlug={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* 2. Subcategory Horizontal Chips (when parent category is active) */}
        {selectedCategory && subcategoryList.length > 0 && (
          <div className={styles.subcategoriesBar} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={selectedSubcategory === 'All'}
              className={`${styles.subChip} ${selectedSubcategory === 'All' ? styles.subChipActive : ''}`}
              onClick={() => handleSubcategorySelect('All')}
            >
              All {activeParentCat?.name.replace('&amp;', '&')}
            </button>
            {subcategoryList.map((sub) => {
              const isSubActive = selectedSubcategory === sub.name;
              return (
                <button
                  key={sub.id}
                  type="button"
                  role="tab"
                  aria-selected={isSubActive}
                  className={`${styles.subChip} ${isSubActive ? styles.subChipActive : ''}`}
                  onClick={() => handleSubcategorySelect(sub.name)}
                >
                  {sub.name.replace('&amp;', '&')}
                  {sub.count > 0 && <span className={styles.subChipCount}>({sub.count})</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Top Banner & Sort Controls */}
        <div className={styles.headerSection}>
          <div className={styles.titleArea}>
            <div className={styles.titleHeadingRow}>
              <div className={styles.titleIconWrap}>
                <HeaderIcon size={20} strokeWidth={2.2} />
              </div>
              <h1 className={styles.heading}>{pageTitle}</h1>
            </div>
            <p className={styles.subheading}>
              100% Zero-Adulteration Harvest • Packed Fresh at Orchard Source
            </p>
          </div>

          <div className={styles.controlsArea}>
            <div className={styles.countBadge}>
              <span className={styles.countNumber}>{totalProductsCount}</span> items
            </div>

            {/* Sort Select */}
            <div className={styles.sortWrapper}>
              <SlidersHorizontal size={14} className={styles.sortIcon} />
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products by"
              >
                <option value="date">Newest Harvest</option>
                <option value="popularity">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className={styles.selectChevron} />
            </div>
          </div>
        </div>

        {/* 4. Active Filters Bar (if filtered) */}
        {(selectedCategory || selectedSubcategory !== 'All' || searchQuery) && (
          <div className={styles.activeFiltersBar}>
            <span className={styles.filterLabel}>Active Filter:</span>
            {selectedCategory && (
              <span className={styles.filterPill}>
                {activeParentCat?.name.replace('&amp;', '&')}
                <button
                  type="button"
                  onClick={() => handleCategorySelect(selectedCategory)}
                  aria-label="Remove category filter"
                  className={styles.removePillBtn}
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {selectedSubcategory !== 'All' && (
              <span className={styles.filterPill}>
                {selectedSubcategory}
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory('All')}
                  aria-label="Remove subcategory filter"
                  className={styles.removePillBtn}
                >
                  <X size={13} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className={styles.clearAllBtn}
            >
              Reset All
            </button>
          </div>
        )}

        {/* 5. Products Display: Grouped by Category Topics when All Items is active */}
        {!selectedCategory && !searchQuery ? (
          <div className={styles.categorySectionsWrapper}>
            {categorySections.map(({ category: cat, products: catProducts }) => {
              const CatIcon = CATEGORY_ICONS[cat.slug] || Sparkles;
              return (
                <section key={cat.id} className={styles.topicSection} aria-label={cat.name}>
                  <div className={styles.topicHeader}>
                    <div className={styles.topicTitleRow}>
                      <div className={styles.topicIconWrap}>
                        <CatIcon size={18} strokeWidth={2.2} />
                      </div>
                      <div className={styles.topicTitleInfo}>
                        <h2 className={styles.topicTitle}>{cat.name.replace('&amp;', '&')}</h2>
                        <span className={styles.topicCount}>{catProducts.length} items</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.viewTopicBtn}
                      onClick={() => handleCategorySelect(cat.slug)}
                    >
                      View All {cat.name.replace('&amp;', '&')} <ArrowRight size={13} />
                    </button>
                  </div>

                  <ProductGrid products={catProducts} totalCount={catProducts.length} />
                </section>
              );
            })}
          </div>
        ) : (
          /* Focused single category or search results */
          isLoading && products.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrap}>
                <Sparkles size={32} />
              </div>
              <h2 className={styles.emptyTitle}>No gourmet items found</h2>
              <p className={styles.emptySubtitle}>
                We couldn&apos;t find any items matching your selected filter. Explore our full pantry.
              </p>
              <button
                type="button"
                className={styles.emptyBtn}
                onClick={clearAllFilters}
              >
                View All Products <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <ProductGrid products={products} totalCount={products.length} />
          )
        )}
      </div>
    </div>
  );
}
