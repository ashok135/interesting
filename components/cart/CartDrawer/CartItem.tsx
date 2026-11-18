'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCartContext } from '@/store/CartContext';
import { QuantitySelector } from '@/components/ui';
import { formatPrice } from '@/lib/utils/formatters';
import { Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types';
import styles from './CartItem.module.css';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, closeDrawer } = useCartContext();
  const subtotal = parseFloat(item.price) * item.quantity;
  const productHref = item.slug ? `/product/${item.slug}` : `/shop`;

  return (
    <div className={styles.item}>
      <Link
        href={productHref}
        onClick={closeDrawer}
        className={styles.imageWrapper}
        title={`View ${item.name}`}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={64}
            height={64}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
      </Link>

      <div className={styles.details}>
        <Link
          href={productHref}
          onClick={closeDrawer}
          className={styles.name}
          title={item.name}
        >
          {item.name}
        </Link>
        <p className={styles.unitPrice}>{formatPrice(item.price)} each</p>
        <div className={styles.controls}>
          <QuantitySelector
            quantity={item.quantity}
            onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
            onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
          />
          <span className={styles.subtotal}>{formatPrice(subtotal)}</span>
        </div>
      </div>

      <button
        className={styles.removeBtn}
        onClick={() => removeItem(item.productId)}
        aria-label={`Remove ${item.name} from cart`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
