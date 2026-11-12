'use client';

import Link from 'next/link';
import { Truck, Clock, ShieldAlert, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from '../terms/page.module.css';

export default function ShippingPage() {
  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>Shipping & Delivery</span>
      </nav>

      {/* Hero Header */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>FAST & RELIABLE LOGISTICS</span>
        <h1 className={styles.heroTitle}>Shipping & Delivery Policy</h1>
        <p className={styles.heroDesc}>
          Every pack of dry fruits, cashews, and walnuts is hermetically sealed to preserve farm-fresh crispness and dispatched via express air/surface couriers.
        </p>
      </div>

      <div className={styles.tabContent}>
        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <Truck className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Shipping Coverage & Free Delivery</h2>
              <span className={styles.lastUpdated}>All India Delivery</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p>
              We deliver to over <strong>19,000+ PIN codes across all 28 Indian states and union territories</strong> using verified express logistics partners (Delhivery, Blue Dart, DTDC, India Post Speed Post).
            </p>
            <ul>
              <li><strong>Free Express Shipping:</strong> Available on all orders with a cart subtotal of <strong>₹499 or more</strong>.</li>
              <li><strong>Standard Delivery Fee:</strong> A nominal flat fee of <strong>₹49</strong> applies to smaller orders below ₹499.</li>
            </ul>
          </div>
        </div>

        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <Clock className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Dispatch & Delivery Timelines</h2>
              <span className={styles.lastUpdated}>Estimated Delivery Days</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <ul>
              <li><strong>Order Processing Time:</strong> All orders are freshly packed and dispatched from our origin warehouse within <strong>24 to 48 business hours</strong> of order confirmation.</li>
              <li><strong>Metro & Tier 1 Cities:</strong> Typically delivered within <strong>2 to 4 business days</strong> post-dispatch.</li>
              <li><strong>Rest of India (Tier 2/3 & Remote):</strong> Typically delivered within <strong>3 to 6 business days</strong>.</li>
              <li>Orders placed on Sundays or National Holidays will be processed on the next immediate working day.</li>
            </ul>
            <div className={styles.highlightBox}>
              <CheckCircle2 size={18} className={styles.boxIcon} />
              <div>
                <strong>Live SMS Tracking:</strong> You will receive real-time SMS updates with a direct tracking link as soon as your parcel is packed and handed over to the courier partner.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <Package className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Tamper-Proof Freshness Packaging</h2>
              <span className={styles.lastUpdated}>Vacuum Sealed & Moisture Proof</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p>
              To ensure zero breakage and maximum freshness, all whole kernel cashews, roasted nuts, and saffron honey jars are packed in food-grade multi-layer nitrogen-flushed pouches and rigid corrugated outer boxes.
            </p>
          </div>
        </div>

        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <ShieldAlert className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Damaged or Tampered Shipments</h2>
              <span className={styles.lastUpdated}>Instant Replacement Guarantee</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p>
              If the outer box or courier seal appears tampered, cut, or damaged at the time of delivery:
            </p>
            <ul>
              <li>Please mention <em>&quot;Damaged / Tampered Condition&quot;</em> on the courier proof-of-delivery (POD) sheet.</li>
              <li>Take 2–3 clear photos/videos of the package and reach out to our support within <strong>48 hours</strong>.</li>
              <li>We will dispatch a <strong>free express replacement immediately</strong> with zero hassle.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
