'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/api/products';
import { Badge } from '@/components/ui';
import type { WooImage } from '@/types';
import styles from './ProductGallery.module.css';

interface ProductGalleryProps {
  images: WooImage[];
  productName: string;
  onSale?: boolean;
  featured?: boolean;
}

export function ProductGallery({
  images = [],
  productName,
  onSale,
  featured,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMainLoaded, setIsMainLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reset loading shimmer when user selects a different thumbnail
  useEffect(() => {
    setIsMainLoaded(false);
  }, [selectedIndex]);

  const safeImages = useMemo(() => {
    return (images || [])
      .map((img) => ({
        ...img,
        src: normalizeImageUrl(img.src),
      }))
      .filter((img) => Boolean(img.src));
  }, [images]);

  const activeImage = safeImages[selectedIndex] || safeImages[0];
  const hasMultipleImages = safeImages.length > 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe left -> next image
        setSelectedIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
      } else {
        // Swipe right -> prev image
        setSelectedIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className={styles.galleryContainer} aria-label="Product image gallery">
      {/* 1. Flipkart / Amazon style Thumbnail Strip */}
      {hasMultipleImages && (
        <div className={styles.thumbnailsStrip} role="tablist" aria-label="Product thumbnails">
          {safeImages.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.thumbBtn} ${isSelected ? styles.thumbActive : ''}`}
                onClick={() => setSelectedIndex(idx)}
                onMouseEnter={() => setSelectedIndex(idx)}
                aria-label={`View photo ${idx + 1} of ${safeImages.length}`}
              >
                <div className={styles.thumbSkeleton} />
                <Image
                  src={img.src}
                  alt={img.alt || `${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="80px"
                  className={styles.thumbImg}
                  loading="eager"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* 2. Main Large Showcase Image Frame with Shimmer Skeleton */}
      <div
        className={styles.mainFrame}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!isMainLoaded && <div className={styles.mainSkeleton} />}
        {activeImage ? (
          <Image
            src={activeImage.src}
            alt={activeImage.alt || productName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`${styles.mainImg} ${isMainLoaded ? styles.mainImgLoaded : styles.mainImgLoading}`}
            onLoad={() => setIsMainLoaded(true)}
          />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}

        {/* Badges */}
        <div className={styles.badgesCluster}>
          {onSale && <Badge variant="danger">18% OFF</Badge>}
          {featured && <Badge variant="accent">Top Rated</Badge>}
        </div>

        {/* Counter Pill like Flipkart */}
        {safeImages.length > 0 && (
          <div className={styles.photoCounter}>
            {selectedIndex + 1} / {safeImages.length}
          </div>
        )}
      </div>
    </div>
  );
}
