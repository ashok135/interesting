'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Zap, ShieldCheck, Sparkles } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { useToast } from '@/store/ToastContext';
import { formatPrice } from '@/lib/utils/formatters';
import { flyToCart } from '@/lib/utils/flyToCart';
import type { WooProduct } from '@/types';
import styles from './FrequentlyBoughtTogether.module.css';

interface FrequentlyBoughtTogetherProps {
  mainProduct: WooProduct;
  comboProducts: WooProduct[];
}

function getProductThumb(product: WooProduct): string {
  if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]?.src) {
    return product.images[0].src;
  }
  return '/images/categories/nuts.jpg';
}

function parsePrice(p: string | number | undefined): number {
  if (typeof p === 'number') return p;
  if (!p) return 0;
  const num = parseFloat(String(p).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

export default function FrequentlyBoughtTogether({
  mainProduct,
  comboProducts,
}: FrequentlyBoughtTogetherProps) {
  const { addItem, openDrawer } = useCartContext();
  const { showSuccess } = useToast();

  // Combine mainProduct with up to 2 combo products
  const allItems: WooProduct[] = [mainProduct, ...comboProducts.slice(0, 2)];

  // Ensure all items are checked by default
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    allItems.map((item) => item.id)
  );

  useEffect(() => {
    setSelectedIds(allItems.map((item) => item.id));
  }, [mainProduct.id, comboProducts.map((p) => p.id).join(',')]);

  if (comboProducts.length === 0) {
    return null;
  }

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one item selected
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectedProducts = allItems.filter((p) => selectedIds.includes(p.id));

  // Pricing calculations
  const totalRegular = selectedProducts.reduce((sum, p) => {
    const regular = parsePrice(p.regular_price || p.price);
    return sum + (regular > 0 ? regular : parsePrice(p.price));
  }, 0);

  const totalCurrent = selectedProducts.reduce((sum, p) => {
    return sum + parsePrice(p.price);
  }, 0);

  // Extra 10% Combo Deal bundle savings when 2 or more items are selected
  const hasBundleSavings = selectedProducts.length >= 2;
  const comboDiscountMultiplier = hasBundleSavings ? 0.9 : 1.0;
  const finalBundlePrice = Math.round(totalCurrent * comboDiscountMultiplier);
  const totalSavings = Math.max(0, totalRegular - finalBundlePrice);

  const handleAddComboToCart = (e?: React.MouseEvent) => {
    if (selectedProducts.length === 0) return;
    if (e) {
      flyToCart(e, getProductThumb(mainProduct));
    }

    selectedProducts.forEach((product, idx) => {
      addItem({
        id: Date.now() + idx,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: hasBundleSavings
          ? String(Math.round(parsePrice(product.price) * 0.9))
          : String(product.price),
        image: getProductThumb(product),
        stockStatus: product.stock_status,
      });
    });

    if (hasBundleSavings) {
      showSuccess(
        `🎉 Added ${selectedProducts.length} items to your cart with combo bundle discount!`
      );
    } else {
      showSuccess(`Added selected item to cart!`);
    }

    openDrawer();
  };

  return (
    <section className={styles.comboSection} aria-label="Frequently Bought Together">
      <div className={styles.header}>
        <span className={styles.headerBadge}>
          <Sparkles size={12} /> Curated Healthy Pairing
        </span>
        <h2 className={styles.title}>Frequently Bought Together</h2>
        <p className={styles.subtitle}>
          Handpicked pairings curated for balanced nutrition and authentic flavor.
        </p>
      </div>

      <div className={styles.comboCard}>
        {/* Visual Item Strip */}
        <div className={styles.itemsStrip}>
          {allItems.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isMain = item.id === mainProduct.id;

            return (
              <React.Fragment key={item.id}>
                {index > 0 && <span className={styles.plusDivider}>+</span>}

                <div
                  className={`${styles.itemCard} ${isSelected ? styles.itemCardSelected : styles.itemCardUnselected}`}
                >
                  <label className={styles.checkboxWrap} title={isMain ? 'Main item' : 'Toggle item'}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id)}
                      className={styles.checkboxInput}
                    />
                  </label>

                  <div className={styles.thumbWrap}>
                    <Image
                      src={getProductThumb(item)}
                      alt={item.name}
                      fill
                      sizes="(max-width: 639px) 68px, 80px"
                      className={styles.thumbImg}
                      unoptimized
                    />
                  </div>

                  <Link href={`/product/${item.slug}`} className={styles.itemTitle} title={item.name}>
                    {item.name}
                  </Link>

                  <p className={styles.itemPrice}>{formatPrice(item.price)}</p>

                  {isMain && <span className={styles.currentBadge}>Current Item</span>}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Summary Action Box */}
        <div className={styles.actionBox}>
          <div className={styles.priceGroup}>
            <span className={styles.itemsCountLabel}>
              Bundle total for {selectedProducts.length} {selectedProducts.length === 1 ? 'item' : 'items'}:
            </span>
            <div className={styles.priceRow}>
              <span className={styles.finalPrice}>{formatPrice(finalBundlePrice)}</span>
              {totalSavings > 0 && (
                <span className={styles.strikePrice}>{formatPrice(totalRegular)}</span>
              )}
            </div>
            {totalSavings > 0 && (
              <span className={styles.savingsPill}>
                <Zap size={12} /> Save {formatPrice(totalSavings)} (Combo Deal)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddComboToCart}
            disabled={selectedProducts.length === 0}
            className={styles.addComboBtn}
          >
            <ShoppingBag size={17} />
            <span>
              {selectedProducts.length > 1
                ? `Add All ${selectedProducts.length} to Cart`
                : 'Add to Cart'}
            </span>
          </button>

          <div className={styles.trustNote}>
            <ShieldCheck size={13} color="#16a34a" />
            <span>100% Farm-Fresh • Airtight Vacuum Sealed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
