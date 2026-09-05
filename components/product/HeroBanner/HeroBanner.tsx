import Image from 'next/image';
import Link from 'next/link';
import type { WooProduct } from '@/types';
import styles from './HeroBanner.module.css';

interface HeroBannerProps {
  product?: WooProduct | null;
}

export function HeroBanner({ product }: HeroBannerProps) {
  const productSlug = product?.slug ? `/product/${product.slug}` : '/shop';
  const heroImage = product?.images?.[0]?.src || 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80';

  return (
    <section className={styles.heroGrid} aria-label="Hero Highlights">
      {/* Left Card: The Sovereign Cashew Reserve */}
      <div className={styles.mainCard}>
        <div className={styles.mainContent}>
          <div className={styles.harvestTag}>
            <span className={styles.tagDiamond}>◈</span>
            <span>DIRECT HARVEST W180 KING GRADE</span>
          </div>

          <h1 className={styles.mainTitle}>
            The Sovereign Cashew Reserve
          </h1>

          <p className={styles.mainDesc}>
            Certified Konkan GI whole kernels slow wood-fired with pink salt &amp; saffron. Pure buttery crunch directly from our orchards.
          </p>

          <div className={styles.mainActions}>
            <Link href={productSlug} className={styles.orderBtn}>
              ORDER FRESH HARVEST
            </Link>
          </div>
        </div>

        <div className={styles.mainImageWrap}>
          <Image
            src={heroImage}
            alt="The Sovereign Cashew Reserve"
            fill
            priority
            className={styles.mainImage}
            sizes="(max-width: 900px) 100vw, 45vw"
          />
          <div className={styles.mainImageOverlay} />
        </div>
      </div>

      {/* Right Card: Brass & Velvet Keepsake Boxes */}
      <div className={styles.festiveCard}>
        <div className={styles.festiveContent}>
          <span className={styles.festiveBadge}>FESTIVE SPECIAL</span>

          <h2 className={styles.festiveTitle}>
            Brass &amp; Velvet Keepsake Boxes
          </h2>

          <p className={styles.festiveDesc}>
            Curated 4-tin royal hampers with Kashmiri Saffron nuts &amp; Afghan Figs for instant wedding &amp; corporate gifting.
          </p>

          <div className={styles.festiveBottom}>
            <div className={styles.priceWrap}>
              <span className={styles.priceLabel}>Starting from</span>
              <span className={styles.festivePrice}>₹1,499</span>
            </div>

            <Link href="/shop?category=royal-hampers" className={styles.exploreBtn}>
              Explore Boxes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
