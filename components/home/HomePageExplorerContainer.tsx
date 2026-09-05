'use client';

import { useState } from 'react';
import { CuratedCategoryBento, TrustBadges, ZeptoCategoryExplorer } from '@/components/product';
import { HomeStoryAndFeatures } from '@/components/home/HomeStoryAndFeatures/HomeStoryAndFeatures';
import type { WooProduct, WooProductCategory } from '@/types';

interface HomePageExplorerContainerProps {
  categories: WooProductCategory[];
  allProducts: WooProduct[];
  initialCategoryId?: number;
}

export function HomePageExplorerContainer({
  categories,
  allProducts,
  initialCategoryId = 25,
}: HomePageExplorerContainerProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<number>(initialCategoryId);

  const handleSelectCategory = (catId: number) => {
    setActiveCategoryId(catId);
    setTimeout(() => {
      const target = document.getElementById('zepto-category-explorer');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <>
      <CuratedCategoryBento
        categories={categories}
        onSelectCategoryId={handleSelectCategory}
      />
      <TrustBadges />
      <div id="zepto-category-explorer">
        <ZeptoCategoryExplorer
          categories={categories}
          fallbackProducts={allProducts}
          externalActiveCategoryId={activeCategoryId}
          onSelectCategoryId={setActiveCategoryId}
        />
      </div>
      <HomeStoryAndFeatures />
    </>
  );
}
