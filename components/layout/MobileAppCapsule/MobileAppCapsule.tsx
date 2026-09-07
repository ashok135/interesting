'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, Heart, ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import styles from './MobileAppCapsule.module.css';

export function MobileAppCapsule() {
  const pathname = usePathname();
  const { itemCount, openDrawer, isDrawerOpen } = useCartContext();
  const { wishlistCount } = useWishlist();

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // Keep visible near top of page
      if (currentScrollY < 40) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // User scrolling DOWN -> hide capsule
      if (diff > 8) {
        setIsVisible(false);
      }
      // User scrolling UP -> show / enable capsule
      else if (diff < -8) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Broadcast visibility to floating cart bar
  useEffect(() => {
    const isActuallyVisible = isVisible && !isDrawerOpen && pathname !== '/cart';
    window.dispatchEvent(
      new CustomEvent('capsule-visibility', { detail: { visible: isActuallyVisible } })
    );
  }, [isVisible, isDrawerOpen, pathname]);

  // Hide mobile capsule when cart drawer is open or on cart / checkout pages
  if (isDrawerOpen || pathname === '/cart' || pathname === '/checkout') {
    return null;
  }

  return (
    <nav
      className={`${styles.capsuleNav} ${!isVisible ? styles.capsuleHidden : ''}`}
      aria-label="Mobile Navigation"
    >
      <div className={styles.dock}>
        <Link
          href="/"
          className={`${styles.tab} ${pathname === '/' ? styles.active : ''}`}
        >
          <span className={styles.tabIcon}>
            <Home size={20} strokeWidth={2.2} />
          </span>
          <span className={styles.tabLabel}>Home</span>
        </Link>

        <Link
          href="/shop"
          className={`${styles.tab} ${pathname.startsWith('/shop') ? styles.active : ''}`}
        >
          <span className={styles.tabIcon}>
            <LayoutGrid size={20} strokeWidth={2.2} />
          </span>
          <span className={styles.tabLabel}>Pantry</span>
        </Link>

        <button
          type="button"
          className={styles.tab}
          onClick={() => {
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
              searchInput.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <span className={styles.tabIcon}>
            <Search size={20} strokeWidth={2.2} />
          </span>
          <span className={styles.tabLabel}>Search</span>
        </button>

        <Link
          href="/wishlist"
          className={`${styles.tab} ${pathname === '/wishlist' ? styles.active : ''}`}
        >
          <span className={styles.tabIconWrap}>
            <span className={styles.tabIcon}>
              <Heart
                size={20}
                strokeWidth={2}
                fill={wishlistCount > 0 ? '#ef4444' : 'none'}
                color={wishlistCount > 0 ? '#ef4444' : 'currentColor'}
              />
            </span>
            {wishlistCount > 0 && (
              <span className={styles.badge}>{wishlistCount}</span>
            )}
          </span>
          <span className={styles.tabLabel}>Wishlist</span>
        </Link>

        <button
          type="button"
          className={`${styles.tab} ${styles.cartTab}`}
          onClick={openDrawer}
          aria-label="Open cart"
        >
          <span className={styles.tabIconWrap}>
            <span className={styles.tabIcon}>
              <ShoppingBag size={20} strokeWidth={2.2} />
            </span>
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </span>
          <span className={styles.tabLabel}>Bag</span>
        </button>
      </div>
    </nav>
  );
}
