'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartContext } from '@/store/CartContext';
import { QuantitySelector, Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils/formatters';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

export default function CartPage() {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCartContext();
  const delivery = parseFloat(total) >= 499 ? 0 : 49;
  const grandTotal = parseFloat(total) + delivery;

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>
          <ShoppingBag size={56} strokeWidth={1.5} color="#94a3b8" />
        </span>
        <h1>Your cart is empty</h1>
        <p>Add some products to get started</p>
        <Link href="/shop">
          <Button variant="primary" size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.heading}>Shopping Cart ({itemCount} items)</h1>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.items}>
            <div className={styles.itemsHeader}>
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear all
              </button>
            </div>

            {items.map((item) => (
              <div key={item.productId} className={styles.item}>
                <div className={styles.itemImage}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className={styles.img}
                    />
                  ) : (
                    <div className={styles.imgPlaceholder} />
                  )}
                </div>

                <div className={styles.itemDetails}>
                  <Link href={`/product/${item.slug}`} className={styles.itemName}>
                    {item.name}
                  </Link>
                  <p className={styles.itemPrice}>{formatPrice(item.price)} each</p>
                  <QuantitySelector
                    quantity={item.quantity}
                    onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
                  />
                </div>

                <div className={styles.itemRight}>
                  <p className={styles.itemSubtotal}>
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                  </p>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.productId)}
                    aria-label="Remove item"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary sidebar */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Delivery</span>
                <span className={delivery === 0 ? styles.free : ''}>
                  {delivery === 0 ? 'FREE' : formatPrice(delivery)}
                </span>
              </div>
              {delivery > 0 && (
                <p className={styles.freeNote}>
                  Add {formatPrice(499 - parseFloat(total))} more for free delivery
                </p>
              )}
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Total</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <Link href="/checkout" className={styles.checkoutLink}>
              <Button variant="primary" size="lg" fullWidth>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Proceed to Checkout <ArrowRight size={16} />
                </span>
              </Button>
            </Link>

            <Link href="/shop" className={styles.continueShopping} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
