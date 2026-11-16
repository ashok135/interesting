'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Zap, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { useCartContext } from '@/store/CartContext';
import { useToast } from '@/store/ToastContext';
import { formatPrice } from '@/lib/utils/formatters';
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
  const num = parseFloat(p.replace(/[^0-9.]/g, ''));
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

  // By default, select all items in the combo
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    allItems.map((item) => item.id)
  );

  if (comboProducts.length === 0) {
    return null;
  }

  const toggleItem = (id: number) => {
    // If it's the main product, allow toggling but at least 1 item must remain
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one item
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectedProducts = allItems.filter((p) => selectedIds.includes(p.id));
  const isAllSelected = selectedProducts.length === allItems.length;

  // Calculate pricing
  const totalRegular = selectedProducts.reduce((sum, p) => {
    const regular = parsePrice(p.regular_price || p.price);
    return sum + (regular > 0 ? regular : parsePrice(p.price));
  }, 0);

  const totalCurrent = selectedProducts.reduce((sum, p) => {
    return sum + parsePrice(p.price);
  }, 0);

  // Apply extra 10% Combo Bundle Savings when 2 or more items are selected
  const hasBundleSavings = selectedProducts.length >= 2;
  const comboDiscountMultiplier = hasBundleSavings ? 0.9 : 1.0;
  const finalBundlePrice = Math.round(totalCurrent * comboDiscountMultiplier);
  const totalSavings = Math.max(0, totalRegular - finalBundlePrice);

  const handleAddComboToCart = () => {
    if (selectedProducts.length === 0) return;

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
        `🎉 Added ${selectedProducts.length} combo items to cart with extra 10% bundle savings!`
      );
    } else {
      showSuccess(`Added selected item to cart!`);
    }

    openDrawer();
  };

  return (
    <section className={styles.comboSection} aria-label="Frequently Bought Together">
      <div className={styles.header}>
        <span className={styles.badge}>
          <Sparkles size={13} /> Curated Healthy Pairing
        </span>
        <h2 className={styles.title}>Frequently Bought Together</h2>
        <p className={styles.subtitle}>
          Customers who love this harvest frequently bundle it with these farm-fresh pairings.
        </p>
      </div>

      <div className={styles.comboContainer}>
        {/* Visual Item Cards with + separators */}
        <div className={styles.visualChain}>
          {allItems.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isMain = item.id === mainProduct.id;

            return (
              <React.Fragment key={item.id}>
                {index > 0 && <span className={styles.chainPlus}>+</span>}

                <div
                  className={`${styles.itemCard} ${isSelected ? styles.itemCardActive : styles.itemCardDisabled}`}
                >
                  <label className={styles.checkboxWrap} title={isMain ? 'Main item' : 'Toggle item'}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id)}
                      className={styles.checkbox}
                    />
                  </label>

                  <div className={styles.thumbWrap}>
                    <Image
                      src={getProductThumb(item)}
                      alt={item.name}
                      fill
                      sizes="90px"
                      className={styles.thumbImg}
                      unoptimized
                    />
                  </div>

                  <Link href={`/product/${item.slug}`} className={styles.itemTitle} title={item.name}>
                    {item.name}
                  </Link>

                  <p className={styles.itemPrice}>{formatPrice(item.price)}</p>

                  {isMain && <span className={styles.thisItemBadge}>This Item</span>}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Action Box */}
        <div className={styles.actionBox}>
          <div className={styles.priceBreakdown}>
            <span className={styles.priceLabel}>
              Total for {selectedProducts.length} {selectedProducts.length === 1 ? 'item' : 'items'}:
            </span>
            <div className={styles.totalPriceRow}>
              <span className={styles.bundlePrice}>{formatPrice(finalBundlePrice)}</span>
              {totalSavings > 0 && (
                <span className={styles.strikePrice}>{formatPrice(totalRegular)}</span>
              )}
            </div>
            {totalSavings > 0 && (
              <span className={styles.savingsPill}>
                <Zap size={13} /> Save {formatPrice(totalSavings)} (Combo Deal)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddComboToCart}
            disabled={selectedProducts.length === 0}
            className={styles.addComboBtn}
          >
            <ShoppingBag size={18} />
            <span>
              {selectedProducts.length > 1
                ? `Add All ${selectedProducts.length} to Cart`
                : 'Add to Cart'}
            </span>
          </button>

          <div className={styles.comboGuarantee}>
            <ShieldCheck size={14} color="#16a34a" />
            <span>Farm-fresh vacuum sealed • Free Express Shipping</span>
          </div>
        </div>
      </div>
    </section>
  );
}
