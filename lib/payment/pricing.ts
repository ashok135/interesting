import { getProducts } from '@/lib/api/products';
import { wcFetch } from '@/lib/api/client';
import type { OrderLineItem } from '@/types';

export interface VerifiedOrderPricing {
  normalizedLineItems: Array<{ product_id: number; quantity: number }>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  grandTotal: number;
  appliedCouponCode?: string;
  freeShippingByCoupon: boolean;
}

interface WooCouponRaw {
  id: number;
  code: string;
  amount: string;
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product';
  minimum_amount: string;
  maximum_amount: string;
  product_ids?: number[];
  excluded_product_ids?: number[];
  date_expires?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  free_shipping?: boolean;
  exclude_sale_items?: boolean;
  limit_usage_to_x_items?: number | null;
}

/**
 * Validates cart line items, stock levels, and WooCommerce coupons on the server.
 * Prevents negative quantities, missing/invalid products, expired coupons, and price tampering.
 */
export async function verifyAndCalculateOrderPricing(
  rawLineItems: OrderLineItem[],
  couponCode?: string
): Promise<VerifiedOrderPricing> {
  if (!Array.isArray(rawLineItems) || rawLineItems.length === 0) {
    throw new Error('Cart cannot be empty.');
  }
  if (rawLineItems.length > 50) {
    throw new Error('Too many distinct items in a single order.');
  }

  const normalizedLineItems: Array<{ product_id: number; quantity: number }> = [];
  for (const item of rawLineItems) {
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error('Invalid product ID in order items.');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new Error('Item quantity must be a whole number between 1 and 100.');
    }
    normalizedLineItems.push({ product_id: productId, quantity });
  }

  const uniqueProductIds = Array.from(new Set(normalizedLineItems.map((i) => i.product_id)));
  const products = await getProducts({ include: uniqueProductIds, perPage: uniqueProductIds.length });

  const productMap = new Map<
    number,
    {
      price: number;
      onSale: boolean;
      stock_status?: string;
      stock_quantity?: number | null;
      name: string;
    }
  >();

  for (const p of products) {
    const pPrice = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
    productMap.set(p.id, {
      price: pPrice,
      onSale: Boolean(p.on_sale),
      stock_status: p.stock_status,
      stock_quantity: p.stock_quantity,
      name: p.name,
    });
  }

  // Verify every item exists, is in stock, and has sufficient stock quantity
  let subtotal = 0;
  for (const item of normalizedLineItems) {
    const pInfo = productMap.get(item.product_id);
    if (!pInfo) {
      throw new Error(`Product #${item.product_id} was not found in the catalog.`);
    }
    if (pInfo.stock_status === 'outofstock') {
      throw new Error(`"${pInfo.name}" is currently out of stock. Please remove it from your cart to proceed.`);
    }
    if (
      pInfo.stock_quantity !== null &&
      pInfo.stock_quantity !== undefined &&
      item.quantity > pInfo.stock_quantity
    ) {
      throw new Error(
        `Only ${pInfo.stock_quantity} units of "${pInfo.name}" are available in stock (you requested ${item.quantity}).`
      );
    }
    subtotal += pInfo.price * item.quantity;
  }

  if (subtotal <= 0) {
    throw new Error('Calculated order subtotal must be greater than zero.');
  }

  // Verify coupon rules against live WooCommerce data
  let discount = 0;
  let appliedCouponCode: string | undefined;
  let freeShippingByCoupon = false;

  if (couponCode && couponCode.trim()) {
    const cleanCode = couponCode.trim().toLowerCase();
    try {
      const coupons = await wcFetch<WooCouponRaw[]>('coupons', {
        params: { code: cleanCode },
        cache: 'no-store',
      });

      if (Array.isArray(coupons) && coupons.length > 0) {
        const coupon = coupons[0];
        const isExpired = coupon.date_expires ? new Date(coupon.date_expires).getTime() < Date.now() : false;
        const isExhausted =
          coupon.usage_limit !== null &&
          coupon.usage_limit !== undefined &&
          coupon.usage_limit > 0 &&
          (coupon.usage_count || 0) >= coupon.usage_limit;

        const minSpend = parseFloat(coupon.minimum_amount) || 0;
        const maxSpend = parseFloat(coupon.maximum_amount) || 0;
        const cAmount = parseFloat(coupon.amount) || 0;

        const meetsMin = minSpend <= 0 || subtotal >= minSpend;
        const meetsMax = maxSpend <= 0 || subtotal <= maxSpend;

        if (!isExpired && !isExhausted && meetsMin && meetsMax) {
          const includedIds = Array.isArray(coupon.product_ids) ? coupon.product_ids : [];
          const excludedIds = Array.isArray(coupon.excluded_product_ids) ? coupon.excluded_product_ids : [];

          const isItemEligible = (productId: number) => {
            const pInfo = productMap.get(productId);
            if (coupon.exclude_sale_items && pInfo?.onSale) return false;
            if (includedIds.length > 0 && !includedIds.includes(productId)) return false;
            if (excludedIds.length > 0 && excludedIds.includes(productId)) return false;
            return true;
          };

          const eligibleItems = normalizedLineItems.filter((it) => isItemEligible(it.product_id));
          if (eligibleItems.length > 0) {
            if (coupon.discount_type === 'percent') {
              const eligibleSubtotal = eligibleItems.reduce((sum, it) => {
                const p = productMap.get(it.product_id);
                return sum + (p ? p.price * it.quantity : 0);
              }, 0);
              discount = Math.round((eligibleSubtotal * cAmount) / 100);
            } else if (coupon.discount_type === 'fixed_product') {
              const maxItems =
                coupon.limit_usage_to_x_items && coupon.limit_usage_to_x_items > 0
                  ? coupon.limit_usage_to_x_items
                  : Infinity;
              let itemsDiscounted = 0;
              discount = eligibleItems.reduce((sum, it) => {
                if (itemsDiscounted >= maxItems) return sum;
                const qtyToDiscount = Math.min(it.quantity, maxItems - itemsDiscounted);
                itemsDiscounted += qtyToDiscount;
                const p = productMap.get(it.product_id);
                const unitDiscount = p ? Math.min(p.price, cAmount) : 0;
                return sum + unitDiscount * qtyToDiscount;
              }, 0);
            } else {
              discount = Math.min(subtotal, cAmount);
            }

            freeShippingByCoupon = Boolean(coupon.free_shipping);
            appliedCouponCode = cleanCode.toUpperCase();
          }
        }
      }
    } catch (couponErr) {
      console.warn('[Order Pricing] Coupon verification failed:', couponErr);
    }
  }

  // Consistent with checkout/cart/shipping policy: free delivery at subtotal >= 499 or free_shipping coupon, else ₹49
  const shippingFee = subtotal >= 499 || freeShippingByCoupon ? 0 : 49;
  const grandTotal = Math.max(0, subtotal + shippingFee - discount);

  return {
    normalizedLineItems,
    subtotal,
    discount,
    shippingFee,
    grandTotal,
    appliedCouponCode,
    freeShippingByCoupon,
  };
}
