'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import { QuantitySelector } from '@/components/ui';
import type { WooProduct } from '@/types';
import { ShoppingBag, Zap, Heart } from 'lucide-react';
import styles from './AddToCartSection.module.css';

interface AddToCartSectionProps {
  product: WooProduct;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { addItem, openDrawer } = useCartContext();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isOutOfStock = product.stock_status === 'outofstock';
  const isFav = isInWishlist(product.id);

  function addCurrentItems() {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: Date.now() + i,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0]?.src ?? '',
        stockStatus: product.stock_status,
      });
    }
  }

  function handleAddToCart() {
    if (isOutOfStock) return;
    addCurrentItems();
    openDrawer();
  }

  function handleBuyNow() {
    if (isOutOfStock) return;
    addCurrentItems();
    router.push('/checkout');
  }

  return (
    <div className={styles.section}>
      {/* 1. Dedicated Clean Quantity Selector & Wishlist Row */}
      <div className={styles.quantityRow}>
        <div className={styles.qtyControl}>
          <span className={styles.qtyLabel}>Quantity:</span>
          <QuantitySelector
            quantity={quantity}
            onIncrease={() => setQuantity((q) => q + 1)}
            onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
            max={product.stock_quantity ?? 99}
          />
        </div>

        <button
          type="button"
          className={`${styles.wishlistBtn} ${isFav ? styles.wishlistActive : ''}`}
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-label={isFav ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={18}
            fill={isFav ? '#e11d48' : 'none'}
            color={isFav ? '#e11d48' : 'currentColor'}
          />
          <span className={styles.wishlistText}>
            {isFav ? 'Wishlisted' : 'Save to Wishlist'}
          </span>
        </button>
      </div>

      {/* 2. Flipkart Style Action Buttons: Clean, Elevated, One by One */}
      <div className={styles.actionsStack}>
        <button
          type="button"
          className={styles.addToCartBtn}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label="Add product to cart"
        >
          <ShoppingBag size={20} className={styles.btnIcon} />
          <span>{isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
        </button>

        {!isOutOfStock && (
          <button
            type="button"
            className={styles.buyNowBtn}
            onClick={handleBuyNow}
            aria-label="Buy product now"
          >
            <Zap size={20} className={styles.btnIcon} />
            <span>BUY NOW</span>
          </button>
        )}
      </div>
    </div>
  );
}
