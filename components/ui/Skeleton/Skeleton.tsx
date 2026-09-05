import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius, className }: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className ?? ''}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.productCardSkeleton} aria-hidden="true">
      <div className={styles.imageSkeleton} />
      <div className={styles.cardInfoSkeleton}>
        {/* Origin tag */}
        <Skeleton width="45%" height="0.65rem" borderRadius="4px" />
        {/* Title line 1 */}
        <Skeleton width="90%" height="0.95rem" borderRadius="4px" />
        {/* Title line 2 */}
        <Skeleton width="65%" height="0.95rem" borderRadius="4px" />
        {/* Rating badge */}
        <Skeleton width="38%" height="1.1rem" borderRadius="6px" />
        {/* Price & Add button row */}
        <div className={styles.bottomRowSkeleton}>
          <Skeleton width="40%" height="1.25rem" borderRadius="4px" />
          <Skeleton width="30%" height="1.8rem" borderRadius="8px" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.gridSkeleton} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SearchItemSkeleton() {
  return (
    <div className={styles.searchItemSkeleton} aria-hidden="true">
      <div className={styles.searchThumbSkeleton} />
      <div className={styles.searchTextSkeleton}>
        <Skeleton width="75%" height="0.85rem" borderRadius="4px" />
        <Skeleton width="35%" height="0.75rem" borderRadius="4px" />
      </div>
    </div>
  );
}
