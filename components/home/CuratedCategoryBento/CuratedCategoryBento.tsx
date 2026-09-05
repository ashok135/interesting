'use client';

import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import type { WooProductCategory } from '@/types';
import styles from './CuratedCategoryBento.module.css';

interface CuratedCategoryBentoProps {
  onSelectCategoryId?: (categoryId: number) => void;
  categories?: WooProductCategory[];
}

export function CuratedCategoryBento({ onSelectCategoryId, categories = [] }: CuratedCategoryBentoProps) {
  const getCatId = (slug: string, fallbackId: number) => {
    const found = categories.find(
      (c) => c.slug === slug || c.name.toLowerCase().includes(slug.replace('-', ' '))
    );
    return found?.id || fallbackId;
  };

  const handleCardClick = (slug: string, fallbackId: number) => {
    const catId = getCatId(slug, fallbackId);
    if (onSelectCategoryId) {
      onSelectCategoryId(catId);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('select-category', { detail: { id: catId, slug } })
      );
    }
    // Smooth scroll to the category explorer section
    const target = document.getElementById('zepto-category-explorer');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className={styles.bentoSection} aria-label="Curated Categories">
      <div className={styles.bentoCardContainer}>
        {/* 1. Festive Header Illustration Banner */}
        <div className={styles.headerBanner}>
          <Image
            src="/images/bento/festive_header.jpg"
            alt="Royal Gourmet Harvest Festival"
            fill
            sizes="(max-width: 768px) 100vw, 1240px"
            className={styles.bannerImg}
            priority
          />
          <div className={styles.bannerOverlay}>
            <span className={styles.bannerTag}>FRESH HARVEST 2026</span>
            <h2 className={styles.bannerTitle}>Royal Pantry Specials</h2>
          </div>
        </div>

        {/* 2. Zepto/Blinkit Style 5-Card Bento Grid */}
        <div className={styles.bentoGrid}>
          {/* Card 1: Left Tall Featured Card (Nuts - ID 25) */}
          <button
            type="button"
            className={`${styles.card} ${styles.tallCard}`}
            onClick={() => handleCardClick('nuts', 25)}
            aria-label="Shop Nuts & Kaju Favourites"
          >
            <span className={styles.cardTitle}>
              Harvest<br />Favourites
            </span>
            <div className={styles.tallImgWrapper}>
              <Image
                src="/images/bento/nuts_tall.jpg"
                alt="Royal Cashews and Almonds"
                fill
                sizes="(max-width: 768px) 45vw, 400px"
                className={styles.productImg}
              />
            </div>
            <div className={styles.startingPill}>
              Starting @ ₹249
            </div>
          </button>

          {/* Card 2: Top Middle (Seeds - ID 26) */}
          <button
            type="button"
            className={styles.card}
            onClick={() => handleCardClick('seeds', 26)}
            aria-label="Shop Super Seeds & Berries"
          >
            <span className={styles.cardTitle}>
              Super Seeds<br />&amp; Berries
            </span>
            <div className={styles.smallImgWrapper}>
              <Image
                src="/images/bento/seeds.jpg"
                alt="Organic Chia and Pumpkin Seeds"
                fill
                sizes="(max-width: 768px) 25vw, 250px"
                className={styles.productImg}
              />
            </div>
          </button>

          {/* Card 3: Top Right (Dry Fruits - ID 27) */}
          <button
            type="button"
            className={styles.card}
            onClick={() => handleCardClick('dry-fruits', 27)}
            aria-label="Shop Royal Dry Fruits"
          >
            <span className={styles.cardTitle}>
              Royal Dry<br />Fruits
            </span>
            <div className={styles.smallImgWrapper}>
              <Image
                src="/images/bento/dryfruits.jpg"
                alt="Afghan Dried Anjeer and Jumbo Raisins"
                fill
                sizes="(max-width: 768px) 25vw, 250px"
                className={styles.productImg}
              />
            </div>
          </button>

          {/* Card 4: Bottom Middle (Flavoured Nuts - ID 30) */}
          <button
            type="button"
            className={styles.card}
            onClick={() => handleCardClick('flavoured-nuts', 30)}
            aria-label="Shop Flavoured & Roasted Snacks"
          >
            <span className={styles.cardTitle}>
              Flavoured<br />&amp; Roasted
            </span>
            <div className={styles.smallImgWrapper}>
              <Image
                src="/images/bento/flavoured.jpg"
                alt="Spiced Peri Peri Cashews and Roasted Makhana"
                fill
                sizes="(max-width: 768px) 25vw, 250px"
                className={styles.productImg}
              />
            </div>
          </button>

          {/* Card 5: Bottom Right (Premium Gift Packs - ID 33) */}
          <button
            type="button"
            className={styles.card}
            onClick={() => handleCardClick('premium-gift-packs', 33)}
            aria-label="Shop Gift Boxes & Hampers"
          >
            <span className={styles.cardTitle}>
              Gift Boxes<br />&amp; Hampers
            </span>
            <div className={styles.smallImgWrapper}>
              <Image
                src="/images/bento/gifts.jpg"
                alt="Luxury Diwali Imperial Gift Box"
                fill
                sizes="(max-width: 768px) 25vw, 250px"
                className={styles.productImg}
              />
            </div>
          </button>
        </div>

        {/* 3. Bottom Promotion Strip (Premium Gift Packs - ID 33) */}
        <button
          type="button"
          className={styles.promoStrip}
          onClick={() => handleCardClick('premium-gift-packs', 33)}
        >
          <div className={styles.promoLeft}>
            <div className={styles.promoIconWrap}>
              <Image
                src="/images/bento/gifts.jpg"
                alt="Gift icon"
                width={38}
                height={38}
                className={styles.promoMiniThumb}
              />
            </div>
            <div className={styles.promoInfo}>
              <span className={styles.promoHeadline}>
                <strong>Royal Keepsake Hampers</strong> • 100% Handcrafted
              </span>
              <span className={styles.promoSub}>
                Pure brass &amp; velvet keepsake gift boxes for celebrations!
              </span>
            </div>
          </div>
          <div className={styles.promoArrowBtn}>
            <ChevronRight size={18} />
          </div>
        </button>
      </div>
    </section>
  );
}
