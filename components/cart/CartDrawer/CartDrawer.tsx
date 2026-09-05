'use client';

import { X, ShoppingBag } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';
import styles from './CartDrawer.module.css';

export function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items } = useCartContext();

  return (
    <>
      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isDrawerOpen ? styles.overlayVisible : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}
        aria-label="Shopping cart"
        aria-modal="true"
        role="dialog"
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Your Cart</h2>
          <button
            className={styles.closeBtn}
            onClick={closeDrawer}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <ShoppingBag size={44} strokeWidth={1.5} />
              </span>
              <p>Your cart is empty</p>
              <button className={styles.shopLink} onClick={closeDrawer}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className={styles.items}>
                {items.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </div>
              <CartSummary />
            </>
          )}
        </div>
      </aside>
    </>
  );
}
