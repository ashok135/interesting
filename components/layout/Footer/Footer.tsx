'use client';

import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  Award,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* 1. Top Trust & Assurance Banner */}
      <div className={styles.trustBar}>
        <div className={styles.trustInner}>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}>
              <Truck size={22} strokeWidth={1.75} />
            </div>
            <div className={styles.trustContent}>
              <span className={styles.trustTitle}>Pan-India Express</span>
              <span className={styles.trustDesc}>Fast doorstep delivery in 2-4 days</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <div className={styles.trustIcon}>
              <Award size={22} strokeWidth={1.75} />
            </div>
            <div className={styles.trustContent}>
              <span className={styles.trustTitle}>100% Farm Sourced</span>
              <span className={styles.trustDesc}>Zero adulteration & pure harvest</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <div className={styles.trustIcon}>
              <ShieldCheck size={22} strokeWidth={1.75} />
            </div>
            <div className={styles.trustContent}>
              <span className={styles.trustTitle}>Aroma-Lock Packing</span>
              <span className={styles.trustDesc}>Nitrogen flushed vacuum tins</span>
            </div>
          </div>

          <div className={styles.trustItem}>
            <div className={styles.trustIcon}>
              <CreditCard size={22} strokeWidth={1.75} />
            </div>
            <div className={styles.trustContent}>
              <span className={styles.trustTitle}>Safe & Flexible Pay</span>
              <span className={styles.trustDesc}>UPI, Cards & Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation & Brand Section */}
      <div className={styles.mainContent}>
        <div className={styles.inner}>
          {/* Brand Col */}
          <div className={styles.brandCol}>
            <Link href="/" className={styles.brand} aria-label="Interesting Home">
              <div className={styles.monogram}>
                <span className={styles.monoText}>INT</span>
              </div>
              <div className={styles.brandText}>
                <span className={styles.brandName}>INTERESTING</span>
                <span className={styles.brandTagline}>GOURMET PANTRY</span>
              </div>
            </Link>

            <p className={styles.tagline}>
              Curators of India&apos;s finest origin-certified dry fruits, whole kernel cashews, Kashmiri walnuts, and slow-roasted crisps. Farm-to-table purity guaranteed.
            </p>

            <div className={styles.badgeRow}>
              <div className={styles.fssaiBadge}>
                <CheckCircle2 size={14} className={styles.fssaiIcon} />
                <span>100% Zero Adulteration Guarantee</span>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className={styles.newsletterBox}>
              <span className={styles.newsletterLabel}>Get special harvest offers & secret coupons</span>
              <form
                className={styles.newsletterForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for subscribing to Interesting Gourmet Pantry!');
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className={styles.newsletterInput}
                  required
                />
                <button type="submit" className={styles.newsletterBtn} aria-label="Subscribe">
                  <span>Join</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            </div>
          </div>

          {/* Links Grid */}
          <div className={styles.linksGrid}>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>The Pantry</h4>
              <Link href="/shop" className={styles.link}>All Harvests</Link>
              <Link href="/shop?category=nuts" className={styles.link}>Royal Cashews</Link>
              <Link href="/shop?category=dry-fruits" className={styles.link}>California Almonds</Link>
              <Link href="/shop?category=dry-fruits" className={styles.link}>Kashmiri Walnuts</Link>
              <Link href="/shop?category=seeds" className={styles.link}>Super Seeds</Link>
              <Link href="/shop?category=millets" className={styles.link}>Millet Crisps</Link>
              <Link href="/shop?category=premium-gift-packs" className={styles.link}>Gift Hampers</Link>
            </div>

            <div className={styles.col}>
              <h4 className={styles.colTitle}>Customer Care</h4>
              <Link href="/account" className={styles.link}>My Account</Link>
              <Link href="/account" className={styles.link}>Track Orders</Link>
              <Link href="/cart" className={styles.link}>View Basket</Link>
              <Link href="/wishlist" className={styles.link}>Wishlist</Link>
              <Link href="/faq" className={styles.link}>Shipping & FAQs</Link>
              <Link href="/returns" className={styles.link}>Easy Returns</Link>
              <Link href="/terms" className={styles.link}>Privacy & Terms</Link>
            </div>

            <div className={styles.col}>
              <h4 className={styles.colTitle}>Contact Us</h4>
              <div className={styles.contactItem}>
                <Phone size={15} className={styles.contactIcon} />
                <a href="tel:+919876543210" className={styles.contactLink}>+91 98765 43210</a>
              </div>
              <div className={styles.contactItem}>
                <Mail size={15} className={styles.contactIcon} />
                <a href="mailto:support@interesting.com" className={styles.contactLink}>support@interesting.com</a>
              </div>
              <div className={styles.contactItem}>
                <MapPin size={15} className={styles.contactIcon} />
                <span className={styles.contactText}>Serving 19,000+ PIN codes across India</span>
              </div>
              <div className={styles.supportTiming}>
                <span>Support Hours:</span>
                <strong>Mon – Sat, 9:00 AM – 8:00 PM IST</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Payment Options */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} INTERESTING GOURMET PANTRY. All rights reserved.
          </p>

          <div className={styles.paymentMethods} aria-label="Accepted payment methods">
            <span className={styles.payBadge}>UPI</span>
            <span className={styles.payBadge}>GPay</span>
            <span className={styles.payBadge}>PhonePe</span>
            <span className={styles.payBadge}>RuPay</span>
            <span className={styles.payBadge}>Cards</span>
            <span className={styles.payBadge}>NetBanking</span>
            <span className={styles.payBadge}>Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
