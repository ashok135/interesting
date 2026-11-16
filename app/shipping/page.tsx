'use client';

import Link from 'next/link';
import { Truck, Clock, ShieldAlert, Package, CheckCircle2 } from 'lucide-react';
import shippingData from '@/content/policies/shipping.json';
import styles from '../terms/page.module.css';

export default function ShippingPage() {
  const getCardIcon = (icon: string) => {
    switch (icon) {
      case 'truck':
        return <Truck className={styles.cardIcon} size={22} />;
      case 'clock':
        return <Clock className={styles.cardIcon} size={22} />;
      case 'package':
        return <Package className={styles.cardIcon} size={22} />;
      case 'shield':
      default:
        return <ShieldAlert className={styles.cardIcon} size={22} />;
    }
  };

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span className={styles.current}>{shippingData.title}</span>
      </nav>

      {/* Hero Header */}
      <div className={styles.heroBanner}>
        <span className={styles.heroTag}>{shippingData.heroTag}</span>
        <h1 className={styles.heroTitle}>{shippingData.title}</h1>
        <p className={styles.heroDesc}>{shippingData.heroDesc}</p>
      </div>

      <div className={styles.tabContent}>
        {shippingData.cards.map((card, idx) => (
          <div key={idx} className={styles.policyCard}>
            <div className={styles.cardHeader}>
              {getCardIcon(card.icon)}
              <div>
                <h2 className={styles.cardTitle}>{card.title}</h2>
                <span className={styles.lastUpdated}>{card.subtitle}</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              {card.paragraphs.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
              {card.bullets.length > 0 && (
                <ul>
                  {card.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
              {card.highlight && (
                <div className={styles.highlightBox}>
                  <CheckCircle2 size={18} className={styles.boxIcon} />
                  <div>{card.highlight}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
