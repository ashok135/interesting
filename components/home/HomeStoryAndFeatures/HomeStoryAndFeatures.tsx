'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Flame,
  PackageCheck,
  Star,
  ChevronDown,
  ArrowRight,
  Truck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import styles from './HomeStoryAndFeatures.module.css';

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_PREVIEW: FAQItem[] = [
  {
    q: 'What makes W180 King Cashews different from regular cashews?',
    a: 'W180 is the world-renowned "King of Cashews" grade. The number 180 indicates that each pound contains fewer than 180 whole kernels, making each cashew noticeably larger, creamier, and richer in natural nut butter than commercial supermarket grades like W240 or W320.',
  },
  {
    q: 'How are your nuts and dry fruits packed for freshness?',
    a: 'Every batch is packaged inside food-grade, nitrogen-flushed aroma-lock tins and multi-layer moisture-proof zip pouches. This prevents oxidation and ensures the signature wood-fired crunch remains fresh for over 9 months without any chemical preservatives.',
  },
  {
    q: 'What is the delivery timeline and shipping cost?',
    a: 'We dispatch all orders within 24 hours via express air logistics. Metro cities receive deliveries within 2–3 business days, while other locations take 3–5 days. We provide FREE delivery on all orders over ₹499.',
  },
  {
    q: 'Do you offer Cash on Delivery (COD) and Easy Returns?',
    a: 'Yes! We support Cash on Delivery across 19,000+ Indian PIN codes alongside UPI, Credit/Debit cards, and NetBanking. We also offer a 7-day hassle-free replacement or refund guarantee if your package arrives damaged or fails our quality standard.',
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Rajesh Malhotra',
    location: 'Mumbai, Maharashtra',
    product: 'Royal Jumbo W180 King Cashews',
    rating: 5,
    date: 'Verified Buyer • 2 days ago',
    comment: 'The sheer size of these W180 cashews is unbelievable. Fresh, crunchy, and zero broken pieces in the tin. You can genuinely taste the wood-fired difference compared to regular store-bought nuts.',
  },
  {
    id: 2,
    name: 'Pooja Sundaram',
    location: 'Bengaluru, Karnataka',
    product: 'Kashmiri Kesar & Honey Glazed Kaju',
    rating: 5,
    date: 'Verified Buyer • 4 days ago',
    comment: 'Subtle natural sweetness with real saffron aroma. My family finished the entire 200g jar during evening tea in two days. The nitrogen-sealed tin packaging was top-tier!',
  },
  {
    id: 3,
    name: 'Anirudh Sen',
    location: 'New Delhi',
    product: 'Roasted Salt & Pepper W180 Kaju',
    rating: 5,
    date: 'Verified Buyer • 1 week ago',
    comment: 'Perfect tellicherry pepper crunch with just the right touch of Himalayan pink salt. Fast delivery within 48 hours to Delhi. Ordering the 500g value pack next.',
  },
];

export function HomeStoryAndFeatures() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className={styles.container} aria-label="Why Choose Interesting">
      {/* 1. Feature Cards: The Gourmet Difference */}
      <div className={styles.sectionHeader}>
        <span className={styles.eyebrow}>
          <Sparkles size={14} /> THE INTERESTING DIFFERENCE
        </span>
        <h2 className={styles.sectionTitle}>Crafted For True Connoisseurs</h2>
        <p className={styles.sectionSubtitle}>
          We skip the middlemen and commodity auctions. Every batch is direct-harvested, hand-sorted, and slow-roasted for uncompromising purity.
        </p>
      </div>

      <div className={styles.featureGrid}>
        {/* Card 1 */}
        <div className={styles.featureCard}>
          <div className={styles.iconCircle}>
            <Sparkles size={24} strokeWidth={1.75} />
          </div>
          <h3 className={styles.cardTitle}>Mammoth Whole Kernels</h3>
          <p className={styles.cardDesc}>
            Only prime-harvest Jumbo W180 grade kernels. Every piece is hand-selected to ensure giant size, zero shrivels, and an indulgent, creamy bite.
          </p>
          <div className={styles.cardHighlight}>100% Whole Grade • Zero Splits</div>
        </div>

        {/* Card 2 */}
        <div className={styles.featureCard}>
          <div className={styles.iconCircle}>
            <Flame size={24} strokeWidth={1.75} />
          </div>
          <h3 className={styles.cardTitle}>Wood-Fired Slow Roast</h3>
          <p className={styles.cardDesc}>
            Roasted in artisanal small batches over controlled heat. Preserves healthy monounsaturated oils while enhancing natural nut aromatics.
          </p>
          <div className={styles.cardHighlight}>Pink Himalayan Rock Salt</div>
        </div>

        {/* Card 3 */}
        <div className={styles.featureCard}>
          <div className={styles.iconCircle}>
            <PackageCheck size={24} strokeWidth={1.75} />
          </div>
          <h3 className={styles.cardTitle}>Aroma-Lock Sealing</h3>
          <p className={styles.cardDesc}>
            Nitrogen-flushed inside food-grade vacuum cans and multi-ply zip pouches. Blocks light, humidity, and oxygen for 9+ months of peak freshness.
          </p>
          <div className={styles.cardHighlight}>Zero Added Preservatives</div>
        </div>

        {/* Card 4 */}
        <div className={styles.featureCard}>
          <div className={styles.iconCircle}>
            <ShieldCheck size={24} strokeWidth={1.75} />
          </div>
          <h3 className={styles.cardTitle}>Certified Farm Purity</h3>
          <p className={styles.cardDesc}>
            Origin certified from Konkan, Kashmir, and California. 100% vegetarian, laboratory tested, and verified for zero chemical residues.
          </p>
          <div className={styles.cardHighlight}>GI-Tagged Origin Quality</div>
        </div>
      </div>

      {/* 2. Customer Reviews & Verified Testimonials */}
      <div className={styles.reviewsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>
            <Star size={14} fill="#f59e0b" color="#f59e0b" /> REAL EXPERIENCES
          </span>
          <h2 className={styles.sectionTitle}>Loved By Over 25,000+ Households</h2>
          <p className={styles.sectionSubtitle}>
            Read honest feedback from real customers across India who switched to pure origin dry fruits.
          </p>
        </div>

        <div className={styles.reviewsGrid}>
          {TESTIMONIALS.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewTop}>
                <div className={styles.starsRow}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={15} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <span className={styles.verifiedTag}>
                  <CheckCircle2 size={13} /> Verified
                </span>
              </div>
              <p className={styles.reviewText}>&ldquo;{review.comment}&rdquo;</p>
              <div className={styles.reviewerInfo}>
                <div className={styles.avatar}>
                  {review.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className={styles.reviewerName}>{review.name}</h4>
                  <span className={styles.reviewerLoc}>{review.location}</span>
                </div>
              </div>
              <div className={styles.reviewProduct}>{review.product}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Interactive FAQ Preview */}
      <div className={styles.faqSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>QUESTIONS & ANSWERS</span>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to know about our sourcing, grading, delivery, and quality guarantee.
          </p>
        </div>

        <div className={styles.faqList}>
          {FAQ_PREVIEW.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className={styles.faqQuestionBtn}
                  aria-expanded={isOpen}
                >
                  <span className={styles.faqQuestionText}>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className={styles.faqAnswer}>
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.faqActions}>
          <Link href="/faq" className={styles.faqMoreLink}>
            <span>View All Shipping & FAQs</span>
            <ArrowRight size={15} />
          </Link>
          <Link href="/returns" className={styles.faqSecondaryLink}>
            <RotateCcw size={15} />
            <span>Read Easy Returns Policy</span>
          </Link>
        </div>
      </div>

      {/* 4. Royal Harvest Callout Banner */}
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
