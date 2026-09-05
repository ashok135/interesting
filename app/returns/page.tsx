'use client';

import Link from 'next/link';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Camera,
  MessageCircle,
  Truck,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react';
import styles from './page.module.css';

export default function ReturnsPage() {
  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>Easy Returns Policy</span>
      </nav>

      {/* Hero Banner */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>100% QUALITY ASSURANCE</span>
        <h1 className={styles.heroTitle}>Easy Returns & Replacement Policy</h1>
        <p className={styles.heroDesc}>
          Your complete satisfaction is our highest priority. If your harvest fails our freshness standard or arrives damaged, we resolve it within 24 hours.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className={styles.pillarsGrid}>
        <div className={styles.pillarCard}>
          <div className={styles.pillarIcon}>
            <RotateCcw size={22} />
          </div>
          <h3 className={styles.pillarTitle}>7-Day Guarantee</h3>
          <p className={styles.pillarText}>
            Report any damage, leakage, or quality issue within 7 days of delivery for an instant replacement or refund.
          </p>
        </div>

        <div className={styles.pillarCard}>
          <div className={styles.pillarIcon}>
            <Clock size={22} />
          </div>
          <h3 className={styles.pillarTitle}>24-48 Hr Fast Refunds</h3>
          <p className={styles.pillarText}>
            Approved refunds are credited directly to your UPI ID, original debit/credit card, or bank account within 24 to 48 business hours.
          </p>
        </div>

        <div className={styles.pillarCard}>
          <div className={styles.pillarIcon}>
            <CheckCircle2 size={22} />
          </div>
          <h3 className={styles.pillarTitle}>Hassle-Free Process</h3>
          <p className={styles.pillarText}>
            No physical parcel return is required for food safety in most cases. Simply share a photo on WhatsApp or email!
          </p>
        </div>
      </div>

      {/* Step by Step Process */}
      <div className={styles.processSection}>
        <h2 className={styles.sectionHeading}>How To Request a Replacement or Refund</h2>
        <p className={styles.sectionSub}>Follow these 3 easy steps to resolve your issue quickly:</p>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepBadge}>1</div>
            <div className={styles.stepIconWrap}>
              <Camera size={24} />
            </div>
            <h4 className={styles.stepTitle}>Take a Quick Photo</h4>
            <p className={styles.stepDesc}>
              Snap a clear photo or short video of the damaged tin, seal, or outer carton packaging along with your invoice or shipping label.
            </p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepBadge}>2</div>
            <div className={styles.stepIconWrap}>
              <MessageCircle size={24} />
            </div>
            <h4 className={styles.stepTitle}>Message Our Support</h4>
            <p className={styles.stepDesc}>
              Send your Order ID and photos to our WhatsApp concierge at <strong>+91 98765 43210</strong> or email <strong>support@interesting.com</strong>.
            </p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepBadge}>3</div>
            <div className={styles.stepIconWrap}>
              <Truck size={24} />
            </div>
            <h4 className={styles.stepTitle}>Instant Resolution</h4>
            <p className={styles.stepDesc}>
              Our concierge verifies your request within 2 hours. We either dispatch a fresh replacement batch immediately or process a 100% refund.
            </p>
          </div>
        </div>
      </div>

      {/* Eligible vs Non-Eligible */}
      <div className={styles.guidelinesSection}>
        <div className={styles.guideCard}>
          <h3 className={styles.guideTitleGood}>
            <CheckCircle2 size={18} /> Eligible for Replacement & Refund
          </h3>
          <ul className={styles.guideList}>
            <li>Package arrived damaged, crushed, or tampered during transit</li>
            <li>Inner aroma-lock seal or vacuum tin was compromised upon arrival</li>
            <li>Incorrect item or weight variant delivered vs what was ordered</li>
            <li>Any unexpected off-flavor or moisture defect reported within 7 days</li>
          </ul>
        </div>

        <div className={styles.guideCard}>
          <h3 className={styles.guideTitleBad}>
            <ShieldAlert size={18} /> Non-Eligible Scenarios
          </h3>
          <ul className={styles.guideList}>
            <li>Return requests submitted after the 7-day delivery window has expired</li>
            <li>Items damaged due to improper customer storage (e.g. kept open in humid air)</li>
            <li>Partially consumed items returned purely due to personal taste preference</li>
            <li>Products purchased during special clearance flash sales marked final sale</li>
          </ul>
        </div>
      </div>

      {/* Action Support Banner */}
      <div className={styles.supportBox}>
        <div className={styles.supportLeft}>
          <h3 className={styles.supportTitle}>Need Help With an Existing Order?</h3>
          <p className={styles.supportText}>
            Our team is active Monday through Saturday, 9:00 AM to 8:00 PM IST. We are dedicated to providing you the best gourmet shopping experience.
          </p>
        </div>
        <div className={styles.supportRight}>
          <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className={styles.supportBtnPrimary}>
            <MessageCircle size={16} />
            <span>Chat on WhatsApp</span>
          </a>
          <Link href="/account" className={styles.supportBtnSecondary}>
            <span>View My Orders</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
