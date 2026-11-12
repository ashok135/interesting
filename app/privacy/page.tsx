'use client';

import Link from 'next/link';
import { Shield, Lock, Eye, Database, Cookie, CheckCircle2 } from 'lucide-react';
import styles from '../terms/page.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>Privacy Policy</span>
      </nav>

      {/* Hero Header */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>DATA PROTECTION & PRIVACY</span>
        <h1 className={styles.heroTitle}>Privacy Policy</h1>
        <p className={styles.heroDesc}>
          At INTERSTING Gourmet Pantry, we are deeply committed to protecting your personal information. Read our transparent privacy practices.
        </p>
      </div>

      <div className={styles.tabContent}>
        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <Shield className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Information We Collect</h2>
              <span className={styles.lastUpdated}>Last updated: November 2026</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p>
              When you visit or place an order on INTERSTING (<code>https://intersting.duckdns.org</code>), we collect only the necessary information required to fulfill your order and provide customer support:
            </p>
            <ul>
              <li><strong>Contact Information:</strong> Full name, delivery address, phone number, and email address.</li>
              <li><strong>Account Credentials:</strong> If you use Google One-Click Sign-In, authentication is managed securely by Google and Firebase. We never receive or store your Google account password.</li>
              <li><strong>Order History:</strong> Products purchased, quantities, timestamps, delivery tracking numbers, and transaction reference IDs (e.g. 12-digit UPI UTR).</li>
              <li><strong>Payment Data:</strong> We <strong>never store or process credit/debit card numbers or bank account passwords</strong> on our servers. All online transactions are handled through RBI-regulated encrypted payment gateways.</li>
            </ul>
          </div>
        </div>

        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <Lock className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>How We Use Your Information</h2>
              <span className={styles.lastUpdated}>Strict No-Spam Policy</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p>Your personal data is used strictly for the following purposes:</p>
            <ul>
              <li>Processing, packing, and dispatching your gourmet harvest orders.</li>
              <li>Sending automated order confirmation, shipment tracking, and delivery SMS updates via our secure SMS gateway.</li>
              <li>Communicating with you regarding order cancellations, address corrections, or refunds.</li>
              <li>Preventing fraudulent transactions and ensuring website security.</li>
            </ul>
            <div className={styles.highlightBox}>
              <CheckCircle2 size={18} className={styles.boxIcon} />
              <div>
                <strong>Zero Data Selling Guarantee:</strong> We do not sell, rent, or trade your personal data, phone number, or email to third-party telemarketers or advertisers.
              </div>
            </div>
          </div>
        </div>

        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <Database className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Sharing With Service Partners</h2>
              <span className={styles.lastUpdated}>Operational Partners Only</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p>We only share required details with trusted operational partners under strict data-protection contracts:</p>
            <ul>
              <li><strong>Courier & Delivery Partners:</strong> Name, shipping address, and phone number are shared with logistics services (e.g. Delhivery, Shiprocket, India Post) solely to deliver your package and call you upon arrival.</li>
              <li><strong>Payment Processors:</strong> Transaction totals and order IDs are shared with banking gateways to process your payments securely.</li>
              <li><strong>Legal Authorities:</strong> Only when strictly required by applicable Indian law, court order, or government regulation.</li>
            </ul>
          </div>
        </div>

        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <Cookie className={styles.cardIcon} size={22} />
            <div>
              <h2 className={styles.cardTitle}>Cookies & Session Storage</h2>
              <span className={styles.lastUpdated}>Essential Store Functionality</span>
            </div>
          </div>
          <div className={styles.cardBody}>
            <p>
              We use secure, HTTP-only session cookies (<code>intersting_session</code>) to maintain your shopping cart items, saved addresses, and logged-in account status between page visits. You can disable cookies in your browser settings, though doing so may prevent you from completing checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
