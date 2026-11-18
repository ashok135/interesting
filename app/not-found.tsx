import Link from 'next/link';
import { ShoppingBag, Home, Search, ArrowRight } from 'lucide-react';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <span className={styles.badge}>404 — Page Not Found</span>
        <h1 className={styles.title}>Looking for Fresh Gourmet Harvests?</h1>
        <p className={styles.desc}>
          The page or product you are looking for might have been moved, renamed, or is enjoying a seasonal break.
        </p>

        <div className={styles.actions}>
          <Link href="/shop" className={styles.primaryBtn}>
            <ShoppingBag size={18} /> Explore Pantry
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            <Home size={18} /> Back to Home
          </Link>
        </div>

        <div className={styles.quickLinks}>
          <span className={styles.quickLabel}>Popular Destinations:</span>
          <div className={styles.tagGrid}>
            <Link href="/shop?category=cashews" className={styles.tag}>W180 Jumbo Cashews <ArrowRight size={12} /></Link>
            <Link href="/shop?category=dry-fruits" className={styles.tag}>California Pistachios <ArrowRight size={12} /></Link>
            <Link href="/shop?category=trail-mix" className={styles.tag}>Omega-3 Trail Mix <ArrowRight size={12} /></Link>
            <Link href="/account" className={styles.tag}>Track My Orders <ArrowRight size={12} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
