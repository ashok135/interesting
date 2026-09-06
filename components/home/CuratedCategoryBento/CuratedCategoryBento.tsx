'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { WooProductCategory } from '@/types';
import styles from './CuratedCategoryBento.module.css';

interface CuratedCategoryBentoProps {
  onSelectCategoryId?: (categoryId: number) => void;
  categories?: WooProductCategory[];
}

export function CuratedCategoryBento({ categories = [] }: CuratedCategoryBentoProps) {
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
          {/* Card 1: Left Tall Featured Card (Nuts) */}
          <Link
            href="/shop?category=nuts"
            className={`${styles.card} ${styles.tallCard}`}
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
          </Link>

          {/* Card 2: Top Middle (Seeds) */}
          <Link
            href="/shop?category=seeds"
            className={styles.card}
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
          </Link>

          {/* Card 3: Top Right (Dry Fruits) */}
          <Link
            href="/shop?category=dry-fruits"
            className={styles.card}
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
          </Link>

          {/* Card 4: Bottom Middle (Flavoured Nuts) */}
          <Link
            href="/shop?category=flavoured-nuts"
            className={styles.card}
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
          </Link>

          {/* Card 5: Bottom Right (Premium Gift Packs) */}
          <Link
            href="/shop?category=premium-gift-packs"
            className={styles.card}
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
          </Link>
        </div>

        {/* 3. Bottom Promotion Strip (Premium Gift Packs) */}
        <Link
          href="/shop?category=premium-gift-packs"
          className={styles.promoStrip}
          aria-label="Explore Royal Keepsake Hampers"
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
        </Link>
      </div>
    </section>
  );
}
