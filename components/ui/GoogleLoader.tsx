'use client';

import React from 'react';
import styles from './GoogleLoader.module.css';

interface GoogleLoaderProps {
  size?: number;
  text?: string;
  variant?: 'google' | 'brand';
  className?: string;
}

export default function GoogleLoader({
  size = 40,
  text,
  variant = 'google',
  className = '',
}: GoogleLoaderProps) {
  return (
    <div className={`${styles.loaderContainer} ${className}`} role="status" aria-label={text || 'Loading'}>
      <svg
        className={`${styles.circular} ${variant === 'brand' ? styles.brandColors : styles.googleColors}`}
        viewBox="25 25 50 50"
        style={{ width: size, height: size }}
      >
        <circle
          className={styles.path}
          cx="50"
          cy="50"
          r="20"
          fill="none"
          strokeWidth="3.8"
          strokeMiterlimit="10"
        />
      </svg>
      {text && <p className={styles.loaderText}>{text}</p>}
    </div>
  );
}
