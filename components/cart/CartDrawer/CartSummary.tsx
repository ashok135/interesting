'use client';

import Link from 'next/link';
import { useCartContext } from '@/store/CartContext';
import { formatPrice } from '@/lib/utils/formatters';
import styles from './CartSummary.module.css';

export function CartSummary() {
  const { total, itemCount, closeDrawer } = useCartContext();
  const delivery = parseFloat(total) >= 499 ? 0 : 49;
  const grandTotal = parseFloat(total) + delivery;

  return (
    <div className={styles.summary}>
      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.label}>Subtotal ({itemCount} items)</span>
          <span className={styles.value}>{formatPrice(total)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Delivery</span>
          <span className={delivery === 0 ? styles.free : styles.value}>
            {delivery === 0 ? 'FREE' : formatPrice(delivery)}
          </span>
        </div>
        {delivery > 0 && (
          <p className={styles.freeNote}>
            Add {formatPrice(499 - parseFloat(total))} more for free delivery
          </p>
        )}
        <div className={`${styles.row} ${styles.total}`}>
          <span>Total</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className={styles.checkoutBtn}
        onClick={closeDrawer}
      >
        Proceed to Checkout
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>

      <Link href="/cart" className={styles.viewCart} onClick={closeDrawer}>
        View full cart
      </Link>
    </div>
  );
}
