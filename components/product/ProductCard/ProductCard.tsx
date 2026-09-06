'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Plus, Minus } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { useWishlist } from '@/store/WishlistContext';
import { formatPrice, getProductImageUrl } from '@/lib/utils/formatters';
import type { WooProduct } from '@/types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: WooProduct;
  index?: number;
}

const FALLBACK_SPECS = [
  { origin: 'MALABAR COAST GI', spec: '250g Tin • Whole Kernels' },
  { origin: 'PAMPORE VALLEY SAFFRON', spec: '200g Jar • Mongra Grade A1' },
  { origin: 'HIMALAYAN ROCK SALT', spec: '500g Value Pack' },
  { origin: 'MALABAR COAST GI', spec: '250g Tin • Roasted Crunch' },
];

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { items, addItem, updateQuantity } = useCartContext();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const cartItem = items.find((i) => i.productId === product.id || i.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const imageUrl = getProductImageUrl(product);
  const isOutOfStock = product.stock_status === 'outofstock';
  const fallback = FALLBACK_SPECS[index % FALLBACK_SPECS.length];
  const isFav = isInWishlist(product.id);

  // Strictly use real WooCommerce product ratings — NO default/fake ratings
  const hasRealReviews = Boolean(
    product.average_rating &&
    parseFloat(product.average_rating) > 0 &&
    product.rating_count &&
    product.rating_count > 0
  );
  const ratingScore = hasRealReviews ? parseFloat(product.average_rating).toFixed(1) : null;
  const ratingCount = hasRealReviews
    ? product.rating_count >= 1000
      ? `${(product.rating_count / 1000).toFixed(1)}k`
      : String(product.rating_count)
    : '0';

  // Clean title & tags
  const cleanedName = product.name.replace(/&amp;/g, '&');
  const originTag = fallback.origin;
  const packSize = fallback.spec;

  // Real WooCommerce Offer Percentage calculation
  const regularPriceNum = parseFloat(product.regular_price || '');
  const currentPriceNum = parseFloat(product.price || '');
  const discountPercent =
    product.on_sale && regularPriceNum > currentPriceNum && regularPriceNum > 0
      ? Math.round(((regularPriceNum - currentPriceNum) / regularPriceNum) * 100)
      : regularPriceNum > currentPriceNum && regularPriceNum > 0
      ? Math.round(((regularPriceNum - currentPriceNum) / regularPriceNum) * 100)
      : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem({
      id: product.id,
      productId: product.id,
      name: cleanedName,
      slug: product.slug,
      price: product.price || '449',
      image: imageUrl,
      stockStatus: product.stock_status,
    });
  }

  function handleIncrement(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, quantityInCart + 1);
  }

  function handleDecrement(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, quantityInCart - 1);
  }

  return (
    <Link href={`/product/${product.slug}`} className={styles.card} tabIndex={0}>
      {/* Image Container with Shimmer Skeleton */}
      <div className={styles.imageWrapper}>
        {!isLoaded && <div className={styles.imageSkeleton} />}
        <Image
          src={imageUrl}
          alt={product.images?.[0]?.alt || cleanedName}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={`${styles.image} ${isLoaded ? styles.imageLoaded : styles.imageLoading}`}
          loading={index < 4 ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
        />

        {/* Offer Percentage Badge (Top Right Corner) */}
        {discountPercent > 0 && (
          <span className={styles.discountBadge}>
            {discountPercent}% OFF
          </span>
        )}

        {/* Wishlist Button (Top Left Corner) */}
        <button
          type="button"
          className={`${styles.wishlistBtn} ${isFav ? styles.wishlistActive : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id, cleanedName);
          }}
          aria-label={isFav ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={14}
            strokeWidth={2}
            fill={isFav ? '#ef4444' : 'none'}
            color={isFav ? '#ef4444' : 'currentColor'}
          />
        </button>
      </div>

      {/* Info Section */}
      <div className={styles.info}>
        <span className={styles.originTag}>{originTag}</span>
        <h3 className={styles.name}>{cleanedName}</h3>
        <p className={styles.packSize}>{packSize}</p>

        {/* Real WooCommerce Rating (Above Price) */}
        {hasRealReviews && (
          <div className={styles.ratingRow}>
            <span className={styles.ratingBadge}>
              <Star size={11} fill="#f59e0b" color="#f59e0b" />
              <span className={styles.ratingScore}>{ratingScore}</span>
              <span className={styles.ratingCount}>({ratingCount})</span>
            </span>
          </div>
        )}

        <div className={styles.bottomRow}>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(product.price || '449')}</span>
            {product.on_sale && product.regular_price && (
              <span className={styles.regularPrice}>
                {formatPrice(product.regular_price)}
              </span>
            )}
          </div>

          {quantityInCart > 0 ? (
            <div
              className={styles.quantityStepper}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={handleDecrement}
                aria-label={`Decrease quantity of ${cleanedName}`}
              >
                <Minus size={13} strokeWidth={2.5} />
              </button>
              <span className={styles.stepperQty}>{quantityInCart}</span>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={handleIncrement}
                aria-label={`Increase quantity of ${cleanedName}`}
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              className={`${styles.addBtn} ${isOutOfStock ? styles.disabled : ''}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={`Add ${cleanedName} to cart`}
            >
              {isOutOfStock ? (
                'Sold Out'
              ) : (
                <>
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
