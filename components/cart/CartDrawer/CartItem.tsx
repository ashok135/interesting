'use client';

import Image from 'next/image';
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
  const { updateQuantity, removeItem } = useCartContext();
  const subtotal = parseFloat(item.price) * item.quantity;

  return (
    <div className={styles.item}>
      <div className={styles.imageWrapper}>
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
      </div>

      <div className={styles.details}>
        <p className={styles.name}>{item.name}</p>
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
