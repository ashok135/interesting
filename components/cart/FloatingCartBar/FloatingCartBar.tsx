'use client';

import { usePathname } from 'next/navigation';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { formatPrice } from '@/lib/utils/formatters';
import styles from './FloatingCartBar.module.css';

export function FloatingCartBar() {
  const pathname = usePathname();
  const { itemCount, total, openDrawer, isDrawerOpen } = useCartContext();

  // Hide floating cart bar if cart is empty, drawer is open, or on checkout / cart pages
  if (itemCount === 0 || isDrawerOpen || pathname === '/checkout' || pathname === '/cart') {
    return null;
  }

  const currentTotal = formatPrice(total);

  return (
    <div className={styles.container}>
      <button className={styles.capsule} onClick={openDrawer} aria-label="View shopping cart">
        <div className={styles.left}>
          <div className={styles.bagIconWrap}>
            <ShoppingBag size={20} strokeWidth={2.2} />
          </div>
          <div className={styles.textCol}>
            <span className={styles.countText}>{itemCount} {itemCount === 1 ? 'Item' : 'Items'} in Bag</span>
            <div className={styles.priceRow}>
              <span className={styles.priceText}>{currentTotal}</span>
            </div>
          </div>
        </div>

        <div className={styles.viewCartBtn}>
          <span>VIEW CART</span>
          <ArrowRight size={16} strokeWidth={2.5} />
        </div>
      </button>
    </div>
  );
}
