'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Shield,
  Lock,
  CheckCircle2,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';
import styles from './page.module.css';

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'cancellation'>('terms');

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>Privacy & Terms</span>
      </nav>

      {/* Hero Header */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>LEGAL & TRUST POLICIES</span>
        <h1 className={styles.heroTitle}>Privacy Policy & Terms of Service</h1>
        <p className={styles.heroDesc}>
          We believe in complete transparency. Read how we protect your personal data and our commitments when you order from Interesting Gourmet Pantry.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className={styles.tabNav} role="tablist">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'terms' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          <FileText size={16} />
          <span>Terms of Service</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'privacy' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <Lock size={16} />
          <span>Privacy & Data Protection</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'cancellation' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('cancellation')}
        >
          <Shield size={16} />
          <span>Cancellation Policy</span>
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.card}>
        {activeTab === 'terms' && (
          <article className={styles.policyContent}>
            <h2>1. Terms of Service</h2>
            <p className={styles.lastUpdated}>Last Updated: September 2026</p>
            <p>
              Welcome to <strong>INTERESTING GOURMET PANTRY</strong> (&ldquo;Interesting&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing our website, purchasing products, or using any associated services, you agree to be bound by the following terms and conditions.
            </p>

            <h3>1.1 Store Eligibility & Account</h3>
            <p>
              By placing an order, you confirm that you are at least 18 years old or accessing the store under the supervision of a parent or legal guardian. You agree to provide accurate, complete, and current information for all purchases made on our store.
            </p>

            <h3>1.2 Product Pricing & Availability</h3>
            <p>
              All prices are listed in Indian Rupees (INR) and are inclusive of applicable GST taxes. While we make every effort to display accurate product weights, images, and descriptions, minor natural agricultural variations in kernel color or size may occur. We reserve the right to revise prices or discontinue products without prior notice.
            </p>

            <h3>1.3 Orders & Payments</h3>
            <p>
              An order confirmation does not signify our final acceptance of your order. We reserve the right to accept or decline your order for reasons including inventory unavailability, non-serviceable pin codes, or suspected fraudulent activity. In such events, any charged amount will be refunded in full immediately.
            </p>

            <h3>1.4 Intellectual Property</h3>
            <p>
              All content on this website — including text, logos, photography, graphics, and interface code — is the intellectual property of INTERESTING and protected under Indian Copyright and Trademark laws. Unauthorized reproduction is strictly prohibited.
            </p>
          </article>
        )}

        {activeTab === 'privacy' && (
          <article className={styles.policyContent}>
            <h2>2. Privacy & Data Protection</h2>
            <p className={styles.lastUpdated}>Last Updated: September 2026</p>
            <p>
              Your personal privacy is sacred to us. We strictly implement bank-grade 256-bit encryption across all communications and will <strong>never sell, rent, or trade your personal data</strong> to third-party advertisers.
            </p>

            <h3>2.1 What Information We Collect</h3>
            <ul>
              <li><strong>Contact Information:</strong> Name, delivery address, phone number, and email address to ship your orders and send tracking updates.</li>
              <li><strong>Order History:</strong> Information related to your past purchases, saved basket items, and wishlist preferences.</li>
              <li><strong>Session Data:</strong> Secure authentication tokens to keep your session logged in safely without exposing sensitive credentials.</li>
            </ul>

            <h3>2.2 Payment Security</h3>
            <p>
              We do <strong>not</strong> store your credit card numbers, debit card CVV, or net banking passwords on our servers. All financial transactions are processed directly through RBI-authorized, PCI-DSS Level 1 compliant payment gateways.
            </p>

            <h3>2.3 Cookie Policy</h3>
            <p>
              We use essential first-party cookies solely to maintain your shopping cart, preserve your login session, and store your preferred theme settings.
            </p>
          </article>
        )}

        {activeTab === 'cancellation' && (
          <article className={styles.policyContent}>
            <h2>3. Cancellation & Modification Policy</h2>
            <p className={styles.lastUpdated}>Last Updated: September 2026</p>
            <p>
              We aim to dispatch all orders as quickly as possible. Please review our straightforward cancellation policy below:
            </p>

            <h3>3.1 Order Cancellation Window</h3>
            <p>
              You can cancel your order free of charge at any time <strong>before it has been dispatched</strong> from our warehouse (typically within 4–6 hours of order placement). To cancel, reach out via WhatsApp at <strong>+91 98765 43210</strong> or email <strong>support@interesting.com</strong> with your Order ID.
            </p>

            <h3>3.2 Post-Dispatch Cancellations</h3>
            <p>
              Once your package has been handed over to the courier partner and an AWB tracking number has been generated, the order cannot be cancelled in transit. You can refuse delivery at your doorstep, and a refund will be processed once the parcel returns to our facility.
            </p>

            <h3>3.3 Refund Timelines</h3>
            <p>
              For prepaid cancellations, the entire amount will be refunded to your original payment mode within 24 to 48 business hours.
            </p>
          </article>
        )}
      </div>

      {/* Support Contact Footer */}
      <div className={styles.contactCard}>
        <div>
          <h3>Have Questions Regarding Our Policies?</h3>
          <p>Reach out to our legal and customer compliance desk anytime.</p>
        </div>
        <div className={styles.contactActions}>
          <a href="mailto:support@interesting.com" className={styles.contactBtn}>
            <Mail size={16} />
            <span>Email Support</span>
          </a>
          <a href="tel:+919876543210" className={styles.contactBtnSec}>
            <Phone size={16} />
            <span>Call Desk</span>
          </a>
        </div>
      </div>
    </div>
  );
}
