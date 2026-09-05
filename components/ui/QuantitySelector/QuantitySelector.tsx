'use client';

import { Minus, Plus } from 'lucide-react';
import styles from './QuantitySelector.module.css';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.btn}
        onClick={onDecrease}
        disabled={quantity <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={13} strokeWidth={2.5} />
      </button>
      <span className={styles.count}>{quantity}</span>
      <button
        type="button"
        className={styles.btn}
        onClick={onIncrease}
        disabled={quantity >= max}
        aria-label="Increase quantity"
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
