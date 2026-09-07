'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { formatPrice } from '@/lib/utils/formatters';
import styles from './FloatingCartBar.module.css';

export function FloatingCartBar() {
  const pathname = usePathname();
  const { itemCount, total, openDrawer, isDrawerOpen } = useCartContext();

  const [isCapsuleVisible, setIsCapsuleVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (currentScrollY < 40) {
        setIsCapsuleVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (diff > 8) {
        setIsCapsuleVisible(false);
      } else if (diff < -8) {
        setIsCapsuleVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    const handleCapsuleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ visible: boolean }>;
      if (customEvent.detail !== undefined) {
        setIsCapsuleVisible(customEvent.detail.visible);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('capsule-visibility', handleCapsuleEvent);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('capsule-visibility', handleCapsuleEvent);
    };
  }, []);

  // Hide floating cart bar if cart is empty, drawer is open, or on checkout, cart, or auth pages
  const isAuthOrSpecialPage = ['/checkout', '/cart', '/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);
  if (itemCount === 0 || isDrawerOpen || isAuthOrSpecialPage) {
    return null;
  }

  const currentTotal = formatPrice(total);

  return (
    <div
      className={`${styles.container} ${isCapsuleVisible ? styles.withCapsule : styles.withoutCapsule}`}
    >
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
