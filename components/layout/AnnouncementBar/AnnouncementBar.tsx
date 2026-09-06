'use client';

import styles from './AnnouncementBar.module.css';

export function AnnouncementBar() {
  const content = (
    <div className={styles.marqueeContent}>
      <div className={styles.item}>
        <span className={styles.fastBadge}>PURITY</span>
        <span className={styles.message}>
          <strong>Direct Orchard Harvest</strong> | 100% Zero Adulteration | Farm-Fresh Gourmet Pantry
        </span>
      </div>
      <span className={styles.divider}>✦</span>
      <div className={styles.item}>
        <span className={styles.codeBadge}>USE CODE: WELCOME</span>
        <span className={styles.promoText}>Get ₹100 OFF on your first royal order</span>
      </div>
      <span className={styles.divider}>✦</span>
    </div>
  );

  return (
    <aside className={styles.bar} role="banner" aria-label="Announcement">
      {/* Desktop Layout: Clean 2-sided row */}
      <div className={styles.desktopInner}>
        <div className={styles.leftGroup}>
          <span className={styles.fastBadge}>PURITY</span>
          <span className={styles.message}>
            <strong>Direct Orchard Harvest</strong> | 100% Zero Adulteration | Farm-Fresh Gourmet Pantry
          </span>
        </div>

        <div className={styles.rightGroup}>
          <span className={styles.codeBadge}>USE CODE: WELCOME</span>
          <span className={styles.promoText}>Get ₹100 OFF on your first royal order</span>
        </div>
      </div>

      {/* Mobile Layout: Infinite Horizontal Looping Marquee */}
      <div className={styles.mobileMarqueeWrapper}>
        <div className={styles.marqueeTrack}>
          {content}
          {content}
        </div>
      </div>
    </aside>
  );
}
