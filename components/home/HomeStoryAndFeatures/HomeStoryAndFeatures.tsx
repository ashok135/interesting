'use client';

import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import styles from './HomeStoryAndFeatures.module.css';

export function HomeStoryAndFeatures() {
  return (
    <section className={styles.container} aria-label="Fresh Harvest Callout">
      {/* Royal Harvest Callout Banner */}
      <div className={styles.harvestBanner}>
        <div className={styles.bannerContent}>
          <span className={styles.bannerTag}>FRESH HARVEST 2026</span>
          <h2 className={styles.bannerHeading}>
            Taste The Purity of Real Harvest Nuts
          </h2>
          <p className={styles.bannerSubtext}>
            Join thousands of happy families enjoying farm-fresh cashews, Kashmiri saffron walnuts, and slow-roasted crisps delivered right to their door.
          </p>
          <div className={styles.bannerBtns}>
            <Link href="/shop" className={styles.bannerPrimaryBtn}>
              <span>Explore All Products</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/account" className={styles.bannerSecondaryBtn}>
              <Truck size={16} />
              <span>Track Your Order</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
