import React from 'react';
import Image from 'next/image';
import styles from './BrandLogo.module.css';

interface LogoProps {
  size?: number;
  variant?: 'horizontal' | 'mark-only';
  className?: string;
  priority?: boolean;
}

export function BrandLogo({ size = 44, className, priority = true }: LogoProps) {
  // Trimmed logo dimensions: 534 x 231 (aspect ratio: ~2.31)
  const height = size;
  const width = Math.round(size * 2.3117);

  return (
    <div className={`${styles.logoWrap} ${className || ''}`}>
      <Image
        src="/images/logo.png"
        alt="Interesting — Dry Fruits, Nuts & Artisanal Hampers"
        width={width}
        height={height}
        priority={priority}
        className={styles.logoImg}
        style={{
          height: `${height}px`,
          width: 'auto',
          aspectRatio: '534 / 231',
        }}
      />
    </div>
  );
}
