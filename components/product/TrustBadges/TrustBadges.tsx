'use client';

import { Truck, ShieldCheck, Leaf, CreditCard } from 'lucide-react';
import styles from './TrustBadges.module.css';

const BADGES = [
  {
    icon: <Truck size={20} />,
    title: 'Pan-India Delivery',
    subtitle: 'Safe doorstep drop',
    iconClass: styles.greenIcon,
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'GI Certified Konkan',
    subtitle: '100% Zero adulteration',
    iconClass: styles.goldIcon,
  },
  {
    icon: <Leaf size={20} />,
    title: 'W180 King Grade',
    subtitle: 'Zero split kernels',
    iconClass: styles.mintIcon,
  },
  {
    icon: <CreditCard size={20} />,
    title: 'Instant UPI & COD',
    subtitle: 'Safe secure checkout',
    iconClass: styles.orangeIcon,
  },
];

export function TrustBadges() {
  const renderBadgesList = (isDuplicate = false) => (
    <div className={styles.badgesTrackGroup} aria-hidden={isDuplicate}>
      {BADGES.map((badge, idx) => (
        <div key={`${badge.title}-${isDuplicate ? 'dup' : 'orig'}-${idx}`} className={styles.badge}>
          <div className={`${styles.iconWrap} ${badge.iconClass}`}>
            <span className={styles.icon}>{badge.icon}</span>
          </div>
          <div className={styles.text}>
            <span className={styles.title}>{badge.title}</span>
            <span className={styles.subtitle}>{badge.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container} aria-label="Store Guarantees">
      {/* 1. Desktop View: Static 4-column Grid */}
      <div className={styles.desktopGrid}>
        {BADGES.map((badge) => (
          <div key={badge.title} className={styles.desktopBadge}>
            <div className={`${styles.iconWrap} ${badge.iconClass}`}>
              <span className={styles.icon}>{badge.icon}</span>
            </div>
            <div className={styles.text}>
              <span className={styles.title}>{badge.title}</span>
              <span className={styles.subtitle}>{badge.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Mobile View: Infinite Horizontal Scrolling Loop */}
      <div className={styles.mobileLoopWrapper}>
        <div className={styles.mobileMarqueeTrack}>
          {renderBadgesList(false)}
          {renderBadgesList(true)}
        </div>
      </div>
    </div>
  );
}
